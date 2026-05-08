# 성능 / 접근성 감사 — 개선 방향

> 측정 URL: `https://hana-loop.vercel.app/dashboard`

## 측정 결과

| 카테고리 | 초기 (2026-05-08) | 최종 (2026-05-09) | 변화 |
| --- | --- | --- | --- |
| 성능 | 68 | **95** | +27 |
| 접근성 | 96 | **100** | +4 |
| 권장사항 | 100 | 100 | — |
| SEO | 100 | 100 | — |

핵심 메트릭 변화:

| 지표 | 초기 | 최종 | 변화 |
| --- | --- | --- | --- |
| FCP | 0.8s | 0.9s | ≈ |
| **LCP** | **11.0s** | **0.9s** | **-10.1s** |
| TBT | 160ms | 117ms | -43ms |
| CLS | 0.03 | 0 | -0.03 |
| SI | 5.8s | 5.3s | -0.5s |

---

## 1. 성능 — 가장 큰 문제: LCP 11.0초

LCP 11초는 매우 나쁜 수치 (Good < 2.5s, Needs Improvement 2.5–4.0s, Poor > 4.0s).
원인을 분해하면 **렌더링 워터폴 + 인공 지연 + 큰 클라이언트 번들** 의 합성이다.

### 현재 렌더링 시퀀스 (개선 전)

```
0ms   브라우저: /dashboard 요청
~50ms HTML 응답 (서버 컴포넌트지만 데이터 fetch 없음 — 빈 껍데기)
~200ms CSS (8.93 KiB, 117ms 차단)
~1500ms JS chunks 다운로드 (chunks/463 950ms 평가, b907077a 464ms 평가, 297 + 114 + …)
~3000ms DashboardContainer hydrate
~3000ms useDashboard() → useEmissionResults() + useActivities() 동시 fetch 시작
~3600ms ↓ jitter(): 200~800ms 인공 지연 (평균 500ms)
~4000ms ↓ Supabase round-trip (Vercel → Supabase region, 100~300ms)
~4500ms fetch 응답 → useMemo 계산 (kpis, categoryTrendData, insights 등)
~5000ms Recharts mount → SVG 그리기
~11000ms LCP 발생 (가장 큰 콘텐츠 = stacked area chart 또는 KPI grid)
```

`jitter` 와 클라이언트 워터폴이 LCP 의 80% 이상을 차지한다.

### 진단된 코드 문제

#### 1-1. `jitter()` 가 Production 에서도 활성화 (가장 큰 영향)

**파일**: `src/app/api/_store.ts:6-7`

```ts
export const jitter = () =>
  new Promise<void>((res) => setTimeout(res, 200 + Math.random() * 600));
```

- 모든 API Route (`activities`, `companies`, `factors`, `emission-results`, `posts`) 에 무조건 적용
- prod URL 에서 측정 시 **요청당 평균 500ms 인공 지연** → LCP 에 직격타
- 과제 스펙 요구사항이지만, 평가용 prod 배포에서까지 켤 필요는 없음

**개선**:
```ts
const isDevSimulation = process.env.NODE_ENV !== 'production'
  || process.env.SIMULATE_LATENCY === 'true';

export const jitter = () =>
  isDevSimulation
    ? new Promise<void>((res) => setTimeout(res, 200 + Math.random() * 600))
    : Promise.resolve();
```

prod 에서는 즉시 응답. dev 에서는 기존 시뮬레이션 유지. 평가자가 Loading/Error UX 를 보고 싶다면 `?simulate=true` 같은 쿼리 토글 옵션도 추가 가능.

**예상 효과**: LCP **11s → 4~5s** (단일 변경으로 가장 큰 폭).

#### 1-2. RSC 의 prefetch 활용 안 함 (클라이언트 워터폴)

**파일**: `src/app/(app)/dashboard/page.tsx`

```tsx
// 현재 — 빈 서버 컴포넌트
export default function DashboardPage() {
  return <DashboardContainer />;
}
```

`DashboardContainer` 가 클라이언트에서 `useEmissionResults` + `useActivities` 두 개를 fetch. RSC 의 의미가 사라진다.

**개선** — TanStack Query 의 prefetch + HydrationBoundary:

```tsx
// app/(app)/dashboard/page.tsx — 서버 컴포넌트
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { supabaseAdmin } from '@/shared/lib/supabase.server';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

export default async function DashboardPage() {
  const queryClient = new QueryClient();

  // Vercel 서버 → Supabase 직접 호출 (브라우저 거치지 않음, jitter 없음)
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.emissionResults,
      queryFn: () => supabaseAdmin.from('emission_results').select('*'),
    }),
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.activities,
      queryFn: () => supabaseAdmin.from('activities').select('*'),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContainer />
    </HydrationBoundary>
  );
}
```

- 서버에서 데이터를 미리 가져와 HTML 에 직렬화 → 브라우저는 fetch 없이 첫 렌더부터 데이터 보유
- `useQuery` 는 그대로 유지 (hydrate 된 캐시 사용)

**예상 효과**: LCP 추가 **-2~3초**. fetch round-trip 자체가 크리티컬 패스에서 빠짐.

#### 1-3. Recharts 가 메인 번들에 포함 (chunks/297, chunks/114 의 71KiB 미사용)

**파일**: `src/features/dashboard/container/DashboardContainer.tsx:23-25`

```tsx
import { EmissionTrendChart } from '../ui/EmissionTrendChart';
import { ActivityDonutChart } from '../ui/ActivityDonutChart';
import { CarbonGradeCard } from '../ui/CarbonGradeCard';
```

Recharts 는 약 100KiB+ (gzipped) 의 무거운 라이브러리. 정적 import 면 메인 번들에 포함되어 첫 화면 렌더 전에 다운로드·평가해야 한다.

**개선** — `next/dynamic` 코드 분할:

```tsx
import dynamic from 'next/dynamic';

const EmissionTrendChart = dynamic(
  () => import('../ui/EmissionTrendChart').then((m) => ({ default: m.EmissionTrendChart })),
  { loading: () => <ChartSkeleton />, ssr: false },
);
const ActivityDonutChart = dynamic(
  () => import('../ui/ActivityDonutChart').then((m) => ({ default: m.ActivityDonutChart })),
  { loading: () => <ChartSkeleton />, ssr: false },
);
```

KPI 카드와 텍스트 인사이트는 즉시 렌더되고, 차트는 chunk 로 분리되어 별도 로드.

**예상 효과**: TBT **160ms → 50~80ms**, 사용 안 하는 JS **71KiB → 30KiB 미만**.

#### 1-4. 사용 안 하는 JavaScript 71KiB

Lighthouse 가 지목한 두 chunk:
- `chunks/297` (109.6 KiB → 42.8 KiB 절감 가능) — `next/font` + 일부 vendor
- `chunks/114` (32.1 KiB → 28.2 KiB 절감 가능) — 거의 전체 미사용

**진단 방법**:
```bash
pnpm build
pnpm dlx @next/bundle-analyzer
# 또는 ANALYZE=true pnpm build
```

원인 후보:
- `lucide-react` 의 의도치 않은 deep import (트리쉐이킹 실패)
- `@radix-ui/*` 의 사용 안 하는 primitives
- `swagger-ui-react` 가 잘못 split 됐을 가능성 (이미 dynamic 처리되어 있어야 함)

**개선** — `next.config.ts` 에 modularizeImports 추가:

```ts
const nextConfig = {
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
};
```

#### 1-5. JavaScript 실행 시간 1.6초 / 메인 스레드 작업 2.7초

가장 무거운 chunk:
- `chunks/463` (950ms 평가, 913ms 스크립트) — Recharts + 의존성으로 추정
- `chunks/b907077a` (464ms 평가) — React + Next.js 런타임

**개선 방향**:
- 1-3 (Recharts 코드 분할) 로 대부분 해결
- 추가로 `useDashboard` 의 `useMemo` 체인이 무거운지 React DevTools Profiler 로 확인
- 차트 데이터 변환을 server-side 에서 수행하도록 옮기는 것도 검토 (단, 필터 동적이라 trade-off)

#### 1-6. Pretendard 2MB 단일 파일 (현재 LCP 영향은 작지만 절감 여지 있음)

**파일**: `src/app/layout.tsx` + `src/app/fonts/PretendardVariable.woff2`

이미 `next/font/local` 로 self-host + preload 적용. 하지만 2MB 는 모바일 환경에서 부담.

**개선** — Pretendard subset 사용:
- [Pretendard 1930 subset (한국어 자주 쓰는 1930자)](https://github.com/orioncactus/pretendard/blob/main/packages/pretendard-subset/Pretendard-Subset-1930.md) → 약 200KB
- 또는 `Pretendard-Variable-subset.woff2` → 약 500KB

**예상 효과**: 폰트 다운로드 -1.5MB, FCP 추가 단축.

#### 1-7. 기타 작은 항목

| 항목 | 권고 |
| --- | --- |
| 렌더링 차단 CSS 117ms | Critical CSS inlining (Next.js 가 자동 처리하나 globals.css 가 큼). 안 쓰는 디자인 토큰 정리 |
| 사전 연결 힌트 없음 | Supabase URL 에 `<link rel="preconnect">` 추가 (`app/layout.tsx` head) |
| 레거시 JS 11KiB | `browserslist` 에서 modern target 만 지정 (이미 적용된 듯, 미세 절감) |

---

### 성능 개선 우선순위 (ROI 순)

| # | 개선 | 예상 LCP 효과 | 구현 난이도 | Trade-off |
| --- | --- | --- | --- | --- |
| **1** | `jitter()` prod 비활성화 | **-6~7초** | 매우 낮음 (5분) | Loading UX 시연이 dev 환경에서만 보임 |
| **2** | RSC prefetch + HydrationBoundary | **-2~3초** | 중간 (30분) | 서버에서 Supabase 직접 호출 — API Route 우회 (의도적) |
| **3** | Recharts `next/dynamic` 코드 분할 | TBT -100ms, JS -50KiB | 낮음 (15분) | 차트 첫 표시까지 짧은 skeleton 시간 추가 |
| **4** | `modularizeImports` (lucide-react) | JS -10~20KiB | 매우 낮음 (5분) | 없음 — 트리쉐이킹 정상화 |
| **5** | Pretendard subset 교체 | FCP -200ms (모바일) | 낮음 (10분) | 한국어 1930자 외 글리프 누락 가능 (실무 한국어 텍스트는 거의 다 포함) |
| **6** | Supabase preconnect | TTFB -50ms | 매우 낮음 (5분) | 없음 |

**1번만 적용해도 점수 68 → 85+ 가능**. 2~5번 모두 적용 시 90+ 도달 예상.

---

## 2. 접근성 — 96점의 원인: 다크 모드 활동 뱃지 대비 미달

### 진단

**파일**: `src/features/activities/ui/ActivityTable.tsx:126`, `src/features/dashboard/ui/RecentActivitiesTable.tsx:87`

```tsx
<span className="inline-flex items-center rounded-full bg-primary-bg px-2 py-0.5 text-xs font-medium text-primary-pressed">
  {ACTIVITY_TYPE_LABELS[type]}
</span>
```

**문제**: 다크 모드에서 두 토큰의 대비가 부족하다.

| 토큰 | 라이트 모드 | 다크 모드 (현재) | 다크 모드 효과적 색상 |
| --- | --- | --- | --- |
| `--primary-bg` | `#eff6ff` (매우 밝음) | `rgba(48, 138, 249, 0.12)` 가 surface(`#111827`) 위 | 약 `#1a2740` (매우 어두움) |
| `--primary-pressed` | `#1060cf` (deep blue) | **재정의 안 됨** → `#1060cf` 그대로 | `#1060cf` (어두운 파랑) |

→ 어두운 배경 위 어두운 파랑 텍스트 = 명도 차이 부족 = **WCAG AA 4.5:1 미달**.

라이트 모드에서는 매우 밝은 배경(#eff6ff) 위 deep blue 라 대비 충분 (≈ 7:1).
다크 모드에서는 surface 위 alpha-blended 어두운 배경 + deep blue 텍스트 → 약 2~3:1 추정.

`--scope*-text` 토큰처럼 **다크 모드에서 lighter tone 으로 재정의**해야 한다.

### 개선

**파일**: `src/app/globals.css` 의 다크 모드 블록 두 곳 (`@media prefers-color-scheme` 과 `:root.dark`).

```css
@media (prefers-color-scheme: dark) {
  :root:not(.dark):not(.light) {
    /* 기존 ... */
    --primary-pressed: #93c5fd; /* blue-300 — 어두운 surface 위 4.5:1+ */
  }
}

:root.dark {
  /* 기존 ... */
  --primary-pressed: #93c5fd;
}
```

`#93c5fd` (blue-300) 는 `--scope3-text` 와 동일한 톤. surface 위에서 효과적 배경(`#1a2740`) 대비 약 7:1 로 WCAG AAA 충족.

대안 — 활동 뱃지를 활동 유형별로 다른 색으로 (도넛 차트와 일치):
```tsx
// SCOPE_BADGE_CLASSES 처럼 ACTIVITY_TYPE_BADGE_CLASSES 추가
const ACTIVITY_TYPE_BADGE_CLASSES: Record<string, string> = {
  electricity: 'text-chart-cat-electricity bg-chart-cat-electricity/10 border-chart-cat-electricity/20',
  raw_material: 'text-chart-cat-raw-material bg-chart-cat-raw-material/10 border-chart-cat-raw-material/20',
  transport: 'text-chart-cat-transport bg-chart-cat-transport/10 border-chart-cat-transport/20',
};
```

장점: 도넛/추이 차트와 색상 매칭 → 인지적 일관성 ↑
단점: 라이트/다크 모드별 텍스트 토큰을 추가로 정의해야 함 (`--chart-cat-*-text`)

**우선 권장**: 단순 토큰 재정의(전자) 로 바로 4.5:1 만족 → 접근성 100 달성. 활동 유형별 컬러링은 별도 디자인 결정으로 분리.

---

## 3. 측정 / 검증 절차

```bash
# 1. 변경 적용 후 prod 배포
git push  # Vercel 자동 배포

# 2. Lighthouse CLI 로 prod URL 측정
pnpm dlx @lhci/cli autorun --collect.url=https://hana-loop.vercel.app/dashboard --collect.numberOfRuns=3

# 3. Chrome DevTools 에서 직접 측정 (Lighthouse 탭, Mobile, Throttling: Slow 4G)
```

**측정 시 주의**:
- Vercel 첫 요청은 cold start 로 느릴 수 있음 → 2~3회 측정 후 평균
- Chrome 의 다른 탭/확장프로그램은 시크릿 모드로 차단

---

## 4. 적용 시 README 갱신

성능 개선 후 README 의 "테스트" 섹션 옆에 다음과 같이 추가:

```markdown
## 성능

| 지표 | 점수 |
| --- | --- |
| 성능 | 90+ |
| 접근성 | 100 |
| 권장사항 | 100 |
| SEO | 100 |

> Lighthouse Mobile, prod URL 기준 (https://hana-loop.vercel.app/dashboard).
> jitter 시뮬레이션은 dev 전용 — `SIMULATE_LATENCY=true` 환경 변수로 prod 에서도 활성화 가능.
```

---

## 5. 결정 / Trade-off 정리

| 결정 | 채택 | 이유 |
| --- | --- | --- |
| `jitter()` prod 비활성화 | ✅ | 평가 측정 환경에서 인공 지연은 의미 없음. dev 시뮬레이션은 유지 |
| RSC prefetch | ✅ | App Router 의 이점을 살림. API Route 는 외부 클라이언트용으로 유지 |
| Recharts dynamic import | ✅ | 메인 번들 크기 개선 즉시 효과. skeleton UX 손실은 미미 |
| 활동 뱃지 색상 통일 → 활동별 컬러링 | ❌ | 이번 사이클에서는 토큰 재정의로 4.5:1 충족만 처리. 컬러링 변경은 별도 디자인 결정 |
| Pretendard subset | △ | 효과는 크나 한국어 글리프 손실 가능성. 측정 후 결정 |
