# 10. 테스트 전략

> 단위 테스트 범위, 커버리지 결과, 의도적으로 제외된 영역과 그 근거.

---

## 테스트 스택

| 항목       | 도구                                            |
| ---------- | ----------------------------------------------- |
| 러너       | Vitest 4                                        |
| DOM 환경   | `@testing-library/react` + `@testing-library/jest-dom` (UI 테스트 추가 시) |
| 커버리지   | `@vitest/coverage-v8`                           |
| 실행 명령  | `pnpm test:run`, `pnpm test:coverage`           |

설정 위치: `vitest.config.ts` — alias `@` → `./src`, coverage include는 4개 디렉토리(`shared/lib/**`, `shared/hooks/**`, `app/api/**`, `features/**/hooks/**`).

---

## 테스트 범위

### 단위 테스트 작성 — 87 케이스

| 파일                                  | 케이스 수 | 대상                                                       |
| ------------------------------------- | --------- | ---------------------------------------------------------- |
| `shared/lib/calculations.test.ts`     | 18        | `calculateEmission`, `kgToTon`, `formatTon`, `calcChangeRate` |
| `shared/lib/insights.test.ts`         | 45        | `interpretChangeRate`, `interpretTopCategory`, `interpretPeakMonth`, `buildDonutSummary`, `buildDonutInsights`, `buildGradeExplanation`, `buildGradeInsights`, `buildTrendInsights`, `buildReductionSuggestions` |
| `shared/types/activity.test.ts`       | 18        | `ActivityTypeSchema`, `ScopeSchema`, `CreateActivitySchema` (음수/숫자외/필수누락/형식 검증) |
| `shared/types/post.test.ts`           | 6         | `CreatePostSchema`                                         |

### 의도적으로 단위 테스트 제외 — 0% 커버리지 영역

| 영역                          | 이유                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| `app/api/**/route.ts`         | Supabase 클라이언트(체이닝 + RPC) 모킹 비용 ↑. 회귀 방어 가치 < 모킹 유지 비용                       |
| `shared/hooks/**` (TanStack Query) | 훅 자체는 얇은 wrapper. QueryClient + fetch 모킹 셋업 비용 ↑                                    |
| `features/dashboard/hooks/useDashboard.ts` | 통합 훅 — 의존성 7개 모킹 필요. 통합 테스트 영역에 가까움                                |
| `shared/lib/api.ts`           | fetch wrapper. 모킹해서 fetch만 다시 검증하는 셈                                                      |
| `shared/lib/supabase.{ts,server.ts}` | 클라이언트 인스턴스 생성. 사이드이펙트만 있음                                                  |
| Zustand 스토어                | `set` 호출만 있는 단순 액션. 통합 환경에서 검증                                                       |

회귀 보호는 통합 환경(Vercel 프리뷰 + 수동 시나리오 점검)으로 대체.

---

## 커버리지 결과

`pnpm test:coverage` 실행 결과 (2026-05-08 기준):

```
Statements   : 21.83% ( 93/426 )
Branches     : 24.81% ( 68/274 )
Functions    : 18.69% ( 23/123 )
Lines        : 22.64% ( 84/371 )
```

### 모듈별 상세

| 모듈                     | Stmts   | Branch  | Funcs   | Lines   | 비고                                       |
| ------------------------ | ------- | ------- | ------- | ------- | ------------------------------------------ |
| `shared/lib/calculations.ts` | **100%** | **100%** | **100%** | **100%** | 핵심 계산 함수 — 완전 커버                |
| `shared/lib/insights.ts`     | **100%** | 97.01%  | **100%** | **100%** | 자동 인사이트 — 미커버 2줄은 도달 불가 폴백 |
| `shared/lib/api.ts`          | 0%      | 0%      | 0%      | 0%      | 의도적 제외 — fetch wrapper                |
| `shared/hooks/**`            | 0%      | 0%      | 0%      | 0%      | 의도적 제외 — TanStack Query 훅            |
| `app/api/**/route.ts`        | 0%      | 0%      | 0%      | 0%      | 의도적 제외 — Supabase 모킹 비용 ↑         |
| `features/**/hooks/**`       | 0%      | 0%      | 0%      | 0%      | 의도적 제외 — 통합 훅                      |

> `shared/types/**`는 coverage include 밖이지만 18+6 케이스로 검증됨.

---

## 커버리지 해석

전체 21.83%라는 숫자는 "낮음"이 아니라 **의도된 결과**.

- **분모**: vitest config의 coverage include 4개 디렉토리 전체 (426 statements)
- **분자**: 순수 비즈니스 로직(계산식·인사이트) (93 statements)

순수 함수에 한해 거의 100% 커버되었고, I/O 레이어(API/훅/Supabase)는 단위 테스트보다 통합 환경 검증이 더 효과적이라고 판단해 의도적으로 제외.

### 평가 항목 매핑

| 평가 항목                  | 본 전략의 대응                                                                |
| -------------------------- | ----------------------------------------------------------------------------- |
| 코드 품질 (10%)            | 핵심 도메인 로직 단위 테스트 + Zod 스키마 검증으로 회귀 방어                  |
| 소프트웨어 엔지니어링 (20%) | 테스트 가능한 영역과 통합 환경 검증 영역을 분리한 trade-off 설계               |
| 발표 시 trade-off 설명     | "왜 API Route는 테스트 안 했는가" — 모킹 유지 비용 vs 회귀 방어 가치 판단       |

---

## 과제 스펙 "에러 처리 (필수)" 매핑

`docs/00-assignment.md`의 4개 필수 에러 처리 항목이 단위 테스트로 보장됨:

| 스펙 요구           | 검증 위치                                            |
| ------------------- | ---------------------------------------------------- |
| 숫자 외 입력 방지   | `activity.test.ts` — quantity 문자열/NaN/null 거부   |
| 음수 입력 방지      | `activity.test.ts` — quantity 음수/0 거부            |
| 필수값 누락 처리    | `activity.test.ts` — description/factorCategory/unit 빈 문자열 거부 |
| 저장 실패 상태 처리 | API Route `_store.ts`의 `maybeFail()` 15% 확률 시뮬레이션. UI에서 toast로 fallback (수동 검증) |

---

## 향후 추가 고려

- **API Route 통합 테스트**: Supabase test schema + vitest 환경. 비용 vs 가치 평가 후 결정
- **E2E (Playwright)**: 핵심 시나리오 — 활동 입력 → 대시보드 반영. 배포 후 검토
