# API 클라이언트 레이어

> `shared/lib/api.ts` — 브라우저에서 Next.js API Routes를 호출하는 fetch 함수 모음.
> 상태 관리 없음. TanStack Query 훅에서 `queryFn` / `mutationFn`으로 사용.

## 설계 원칙

- 모든 API 호출은 `shared/lib/api.ts`를 통해서만 — 컴포넌트에서 직접 `fetch` 금지
- `shared/lib/api.ts`는 순수 fetch 함수만 담음 (에러 파싱 포함)
- API Route 경로 변경 시 이 파일만 수정

## 공통 request 헬퍼

```ts
// shared/lib/api.ts 내부
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}
```

## 제공 함수 목록

```ts
// Companies
getCompanies()                         // GET /api/companies
getCompany(id)                         // GET /api/companies/:id

// Activities
getActivities(params?)                 // GET /api/activities?companyId=&yearMonth=&type=
createActivity(body)                   // POST /api/activities
deleteActivity(id)                     // DELETE /api/activities/:id

// Emission Factors
getFactors(activityType?)              // GET /api/factors?activityType=

// Emission Results
getEmissionResults(params?)            // GET /api/emission-results?companyId=&from=&to=

// Posts
getPosts(params?)                      // GET /api/posts?resourceUid=&dateTime=
createPost(body)                       // POST /api/posts
updatePost(id, body)                   // PATCH /api/posts/:id
deletePost(id)                         // DELETE /api/posts/:id
```

## TanStack Query 훅 패턴

```ts
// features/{slice}/hooks/useActivities.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/shared/lib/api';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

export function useActivities(params?: { companyId?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.activitiesFiltered(params ?? {}),
    queryFn: () => api.getActivities(params),
    staleTime: 30_000,
  });
}

// 삭제 — Optimistic Update + 스냅샷 롤백
// 클릭 즉시 행이 사라지는 UX. maybeFail 15% 환경에서도 dim 처리보다 자연스럽다.
export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string, DeleteActivityContext>({
    mutationFn: api.deleteActivity,
    onMutate: async (id) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: QUERY_KEYS.activities }),
        queryClient.cancelQueries({ queryKey: QUERY_KEYS.emissionResults }),
      ]);
      // 모든 필터 캐시 변형까지 스냅샷 (롤백용)
      const prevActivities = queryClient.getQueriesData<ActivityData[]>({
        queryKey: QUERY_KEYS.activities,
      });
      const prevResults = queryClient.getQueriesData<EmissionResult[]>({
        queryKey: QUERY_KEYS.emissionResults,
      });
      // 낙관적 제거 — activities + emission_results (DB 는 ON DELETE CASCADE)
      queryClient.setQueriesData<ActivityData[]>(
        { queryKey: QUERY_KEYS.activities },
        (old) => old?.filter((a) => a.id !== id),
      );
      queryClient.setQueriesData<EmissionResult[]>(
        { queryKey: QUERY_KEYS.emissionResults },
        (old) => old?.filter((r) => r.activityId !== id),
      );
      return { prevActivities, prevResults };
    },
    onError: (_err, _id, context) => {
      // 실패 시 스냅샷 복원
      if (!context) return;
      for (const [key, data] of context.prevActivities) {
        queryClient.setQueryData(key, data);
      }
      for (const [key, data] of context.prevResults) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activities });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.emissionResults });
    },
  });
}
```

> **생성(`useCreateActivity`) 은 invalidate 방식 유지** — 폼 dialog 가 jitter 동안 열려 있어 dim 효과 자체가 없고, 사용자에게 "저장 중..." 버튼 상태로 진행이 보이기 때문.

## Query Key 전략

`shared/constants/queryKeys.ts`의 `QUERY_KEYS` 상수만 사용. 인라인 string key 금지.

```ts
QUERY_KEYS.activities; // 전체 목록 무효화용
QUERY_KEYS.activitiesFiltered({ companyId: 'c1' }); // 필터 포함 조회
QUERY_KEYS.emissionResultsByCompany(id, from, to); // 기간 조회
QUERY_KEYS.factors; // staleTime 길게 (자주 안 바뀜)
```
