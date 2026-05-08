# 성능 / 접근성 감사

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

### 초기 LCP 11초의 원인 분해

```
0ms   브라우저: /dashboard 요청
~50ms HTML 응답 (서버 컴포넌트지만 데이터 fetch 없음 — 빈 껍데기)
~1500ms JS chunks 다운로드 (chunks/463 950ms 평가, b907077a 464ms 평가, …)
~3000ms DashboardContainer hydrate
~3000ms useDashboard() → useEmissionResults() + useActivities() 동시 fetch 시작
~3600ms ↓ jitter(): 200~800ms 인공 지연
~4000ms ↓ Supabase round-trip (Vercel → Supabase region)
~4500ms fetch 응답 → useMemo 계산 (kpis, categoryTrendData, insights 등)
~5000ms Recharts mount → SVG 그리기
~11000ms LCP 발생
```

핵심 원인: **클라이언트 워터폴 + jitter 인공 지연 + 큰 클라이언트 번들**. 아래 개선으로 모두 해결됨.

---

## 적용된 개선 (✅ 완료)

### 1. RSC prefetch + HydrationBoundary

**PR #34** — `app/(app)/dashboard/page.tsx` 를 async 서버 컴포넌트로 전환.

```tsx
export default async function DashboardPage() {
  const queryClient = new QueryClient();
  const companies = await fetchCompaniesServer();
  queryClient.setQueryData(QUERY_KEYS.companies, companies);
  // ... activities, emission_results 도 첫 회사 기준 prefetch

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContainer />
    </HydrationBoundary>
  );
}
```

- 서버에서 `supabaseAdmin` 직접 호출 (jitter 우회) → HTML 에 데이터 직렬화
- 클라이언트는 fetch 없이 첫 렌더부터 데이터 보유
- queryKey 가 클라이언트 훅과 정확히 매칭되도록 `useEmissionResults` 안에서 빈 문자열 → undefined 정규화 (PR #40)

**효과**: LCP 의 클라이언트 워터폴 구간(~2초) 제거.

### 2. Recharts 코드 분할

**PR #34** — `EmissionTrendChart`, `ActivityDonutChart` 를 `next/dynamic` 으로 분리.

```tsx
const EmissionTrendChart = dynamic(
  () => import('../ui/EmissionTrendChart').then((m) => ({ default: m.EmissionTrendChart })),
  { loading: ChartSkeleton },
);
```

- ssr 옵션 기본값 유지 — chunk 분리 효과는 동일하고 SSR 빈 영역 CLS 우려 회피
- KPI 카드/텍스트 인사이트는 즉시 렌더, 차트는 별도 chunk

**효과**: dashboard 메인 번들 `129 kB → 14.5 kB` (-89%) / First Load `286 kB → 172 kB` (-40%). TBT 160ms → 117ms.

### 3. 다크 모드 활동 뱃지 대비 (접근성 96 → 100)

**PR #34** — `globals.css` 의 다크 모드 블록 두 곳에 `--primary-pressed: #93c5fd` (blue-300) 재정의.

이전: 라이트 토큰(`#1060cf`)이 다크 모드에서도 그대로 사용 → `bg-primary-bg` (어두운 배경) 위 어두운 파랑 → WCAG AA 4.5:1 미달.

수정 후: `--scope*-text` 와 같은 light/dark 분기 정책 적용 → 4.5:1+ 충족.

### 4. 모바일 viewport 손실 회복

**PR #36** — `body { overflow-x: clip }` 으로 NavigationDrawer 의 `fixed -translate-x-full` 누설 차단.

**PR #38** — `scrollbar-gutter: stable` 을 `@media (min-width: 1024px)` 로 한정.
- 모바일은 스크롤바가 hidden 인데 gutter 가 17.5px 예약되어 viewport 가 줄어드는 부작용
- iPhone 14 414px → 396.5px 손실분이 모바일 바텀시트 폭에도 반영되던 문제 해결

### 5. 데이터 기반 동적 기간 범위

**PR #40** — `DATASET_FROM/TO` hardcoded 상수 제거. `useEmissionResults` 응답의 `yearMonth` 에서 min/max 추출. 추가 round-trip 0.

---

## 의도적 미적용 (Trade-off)

| 항목 | 결정 | 이유 |
| --- | --- | --- |
| **`jitter()` prod 비활성화** | ❌ | 과제 스펙이 200~800ms 지연 + 10~20% 실패 시뮬레이션 요구. Loading/Error UX 가 평가 항목. RSC prefetch 만 jitter 우회로 절충 — 첫 LCP 는 빠르고, 사용자 인터랙션은 시뮬레이션 유지 |
| **Pretendard subset (2MB → 200KB)** | ❌ | FCP 0.9s 가 이미 Good 등급. 한국어 글리프 손실 위험 대비 효과 불확실 |
| **`modularizeImports` (lucide-react)** | ❌ | 사용 안 하는 JS 항목이 점수에 미치는 영향이 적고 (성능 95 도달), 트리쉐이킹 정상화는 Next.js 기본값으로도 충분 |
| **Supabase preconnect 힌트** | ❌ | TTFB 7ms 로 이미 Good. 추가 효과 미미 |
| **활동 유형별 뱃지 컬러링** | ❌ | 다크 모드 토큰 재정의로 4.5:1 충족 완료. 활동별 색상은 도넛 차트와의 매칭 등 별도 디자인 결정 영역 |

> 미적용 항목들은 모두 "현재 점수가 충분히 높아 추가 비용 대비 효과가 작음" 또는 "과제 스펙과 충돌"이 이유. 향후 데이터셋 규모가 커지거나 평가 환경이 바뀌면 재검토.

---

## 잔여 항목 — Speed Index 5.3s

| 지표 | 값 | 등급 |
| --- | --- | --- |
| Speed Index | 5.3s | 🟡 Needs Improvement |

**원인**: jitter (사용자 인터랙션 fetch 200~800ms 지연) 가 dashboard 의 점진적 페인트 속도에 영향. 차트가 fetch 완료 후 그려지므로 Speed Index 측정에 잡힘.

**대응**: 과제 스펙 요구사항이라 의도된 수치. jitter 를 끄면 즉시 < 2s 로 떨어지지만 Loading/Error UX 시연 가치가 사라짐. Trade-off 표의 "jitter prod 비활성화" 결정과 동일 맥락.

---

## 측정 / 검증 절차

```bash
# Lighthouse CLI 로 prod URL 측정 (3회 평균 권장)
pnpm dlx @lhci/cli autorun \
  --collect.url=https://hana-loop.vercel.app/dashboard \
  --collect.numberOfRuns=3
```

Chrome DevTools Lighthouse 탭 (Mobile, Throttling: Slow 4G) 으로도 동일 측정 가능.

**측정 시 주의**:
- Vercel 첫 요청은 cold start 로 느릴 수 있음 → 2~3회 측정 후 평균
- Chrome 의 다른 탭/확장프로그램은 시크릿 모드로 차단
