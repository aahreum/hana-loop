# API 클라이언트 레이어

> 이 레이어(`lib/api/`)는 프론트엔드와 Next.js API Routes 사이의 fetch 함수 모음.
> API Routes 내부 구현은 `08-backend-setup.md` 참고.

## 설계 원칙

- `lib/api/*`는 순수 fetch 함수만 담음 — 상태 관리 없음
- TanStack Query 훅(`lib/hooks/`)에서 이 함수를 `queryFn` / `mutationFn`으로 사용
- API Route 주소 변경 또는 실제 외부 API 전환 시 이 레이어만 수정

## API 클라이언트 함수 예시

```ts
// lib/api/activities.ts
import type { ActivityData, ActivityQueryParams } from "@/types/activity";

export async function getActivities(params?: ActivityQueryParams): Promise<ActivityData[]> {
  const url = new URL("/api/activities", window.location.origin);
  if (params?.companyId) url.searchParams.set("companyId", params.companyId);
  if (params?.yearMonth) url.searchParams.set("yearMonth", params.yearMonth);
  if (params?.type) url.searchParams.set("type", params.type);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch activities");
  return res.json();
}

export async function createActivity(
  data: Omit<ActivityData, "id" | "createdAt">
): Promise<ActivityData> {
  const res = await fetch("/api/activities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error ?? "Failed to create activity");
  }
  return res.json();
}

export async function deleteActivity(id: string): Promise<void> {
  const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete activity");
}
```

## TanStack Query 훅 패턴

```ts
// lib/hooks/useActivities.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api/activities";
import type { ActivityData, ActivityQueryParams } from "@/types/activity";

export function useActivities(params?: ActivityQueryParams) {
  return useQuery({
    queryKey: ["activities", params],
    queryFn: () => api.getActivities(params),
    staleTime: 30_000,
  });
}

// 생성 — Optimistic Update 포함
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createActivity,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["activities"] });
      const previous = queryClient.getQueryData<ActivityData[]>(["activities"]);

      queryClient.setQueryData<ActivityData[]>(["activities"], (old = []) => [
        ...old,
        { ...newData, id: "temp-" + Date.now(), createdAt: new Date().toISOString() },
      ]);

      return { previous };
    },
    onError: (_err, _newData, context) => {
      // 실패 시 롤백
      queryClient.setQueryData(["activities"], context?.previous);
    },
    onSettled: () => {
      // 성공/실패 무관 refetch
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}
```

## Query Key 전략

```ts
// 계층적 key로 관련 쿼리 일괄 무효화 가능
["activities"]                          // 전체 목록
["activities", { companyId: "c1" }]    // 회사 필터
["emission-results", { companyId: "c1", from: "2025-01" }]
["factors"]                             // 자주 안 바뀜 → staleTime 길게
["companies"]
```
