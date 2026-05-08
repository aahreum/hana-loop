# HanaLoop Carbon Dashboard

> 기업 탄소 배출량 관리 대시보드 — HanaLoop 프론트엔드 개발자 채용 과제

기업 임원·관리자가 활동 데이터를 입력하면 배출계수 기반으로 탄소 배출량을 자동 계산하고, Scope 1/2/3 기준의 시각화·인사이트·감축 시뮬레이션을 제공하는 웹 애플리케이션입니다.

```
활동 데이터 입력 → 배출계수 조회 → 탄소 배출량 계산 → 결과 저장 → 대시보드 시각화
```

- **과제 원본 스펙**: [`docs/00-assignment.md`](./docs/00-assignment.md)
- **상세 설계 문서**: [`docs/`](./docs/) — 아키텍처·데이터 모델·디자인 시스템·도메인 이해 등 12개 문서

---

## 빠른 시작

### 사전 요구사항

- Node.js 18+
- pnpm 10+
- PostgreSQL (Supabase 프로젝트)

### 환경 변수

루트에 `.env.local` 생성:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

> 모든 DB 접근이 서버(Next.js API Route)에서만 일어나므로 `NEXT_PUBLIC_` prefix가 붙은 브라우저용 키는 필요 없습니다. 자세한 키 선택 기준: [`docs/08-backend-setup.md`](./docs/08-backend-setup.md).

### 실행

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| 명령                 | 설명                        |
| -------------------- | --------------------------- |
| `pnpm dev`           | 개발 서버                   |
| `pnpm build`         | 프로덕션 빌드               |
| `pnpm start`         | 프로덕션 서버               |
| `pnpm test:run`      | 단위 테스트 1회 실행        |
| `pnpm test:coverage` | 커버리지 리포트 생성        |
| `pnpm type-check`    | TypeScript 타입 체크        |
| `pnpm lint`          | ESLint (FSD 경계 규칙 포함) |

### 주요 페이지

| 경로          | 설명                                                            |
| ------------- | --------------------------------------------------------------- |
| `/dashboard`  | KPI · 추이 · 도넛 · 등급 게이지 · 자동 인사이트 · 감축 제안     |
| `/activities` | 활동 데이터 목록 + 입력 폼 (실시간 배출량 미리보기)             |
| `/companies`  | 회사 목록                                                       |
| `/factors`    | 배출계수 (버전 관리 정보 포함)                                  |
| `/docs`       | Swagger UI — `GET /api/docs` 의 OpenAPI JSON 을 인터랙티브 렌더 |

---

## 기술 스택

| 레이어         | 기술                              | 선택 근거                                                          |
| -------------- | --------------------------------- | ------------------------------------------------------------------ |
| 프레임워크     | **Next.js 15** App Router         | RSC + 서버 액션 + API Route를 한 런타임에서                        |
| 언어           | TypeScript (strict)               | 도메인 복잡도 대비 타입 안정성 필수                                |
| 스타일링       | Tailwind CSS v4 (CSS 기반 토큰)   | `tailwind.config` 없이 `globals.css` 의 CSS 변수만으로 일관성 확보 |
| UI             | shadcn/ui (수정 금지)             | 요구사항 — 무거운 UI 라이브러리 금지. headless + 디자인 자유도     |
| 서버 상태      | TanStack Query v5                 | 캐싱·무효화·재시도 표준                                            |
| UI/Filter 상태 | Zustand (+ persist)               | TanStack Query 와 관심사 분리                                      |
| 폼             | React Hook Form + Zod             | 검증·타입 추론·렌더링 격리 한 번에                                 |
| DB             | Supabase (PostgreSQL)             | 가점 요소 충족, 타입 자동 생성, 무료 티어                          |
| API 문서       | zod-to-openapi + swagger-ui-react | Zod 스키마 → OpenAPI 자동 생성 (단일 소스)                         |
| 차트           | Recharts                          | React 친화적, SSR 호환, 번들 크기 적절                             |
| 테스트         | Vitest 4 + @testing-library/react | 빠른 HMR, vite 친화                                                |
| 패키지 관리자  | pnpm                              | 디스크 절감, 워크스페이스 친화                                     |

---

## 아키텍처

### Feature-Sliced Design (FSD) 4-layer

```
src/app/        → Next.js 라우팅만 (page.tsx, layout.tsx, route.ts)
src/widgets/    → 조합형 UI 블록 (AppShell, NavigationDrawer)
src/features/   → 기능 슬라이스 (dashboard, activities, companies, factors, api-docs)
src/shared/     → 전역 공유 (ui, types, hooks, lib, constants, providers, store)
src/data/       → 정적 Seed (독립 레이어)
```

**의존성 방향 — `eslint-plugin-boundaries` 로 자동 강제**

```
app  →  widgets  →  features  →  shared
                              ↑
                           data (독립)
```

- `widgets/A → widgets/B` 금지 (위젯 간)
- `features/A → features/B` 금지 (슬라이스 간)
- `shared/ → 다른 레이어` 금지

각 슬라이스 내부에는 **`ui/` (props만 받는 순수 렌더링)** 과 **`container/` (훅 연결)** 를 분리하여 비즈니스 로직과 표현을 격리했습니다.

> 자세한 디렉토리 구조: [`docs/01-architecture.md`](./docs/01-architecture.md) · FSD 규칙 원문: [`.claude/rules/fsd-architecture.md`](./.claude/rules/fsd-architecture.md)

### 상태 분리 — 과제 평가의 핵심 항목

```
UI State (Zustand)             → uiStore: sidebar/desktopCollapsed/theme (persist)
Filter State (Zustand)         → filterStore: 선택된 회사 / 날짜 범위
Server State (TanStack Query)  → useCompanies / useActivities / useFactors / useEmissionResults
Form State (React Hook Form)   → features/activities/ui/ActivityForm
```

- 하나의 상태가 여러 종류를 겸하지 않도록 **저장소 자체를 분리**.
- TanStack Query v5 에서 초기 로딩 식별은 반드시 `isPending` (`isLoading` 금지 — `isPending && isFetching` 합성이라 네트워크 단절로 fetch 가 paused 되면 false 가 되어 신뢰 불가).

### 데이터 흐름

```
사용자 입력 (features/activities/ui/ActivityForm)
  → React Hook Form + Zod 검증 (shared/types/activity.ts)
  → ActivityFormDialogContainer (useMutation)
    → shared/lib/api.ts (fetch 래퍼)
      → app/api/activities/route.ts
        → jitter (200~800ms) + maybeFail (15%) 시뮬레이션
        → Supabase RPC: create_activity_with_emission
          → activities + emission_results 트랜잭션 저장
            → onSuccess: QUERY_KEYS.activities invalidate → UI 자동 갱신
            → onError: toast.error
```

### 렌더링 전략

| 컴포넌트                | 전략                              | 이유                                    |
| ----------------------- | --------------------------------- | --------------------------------------- |
| `app/*/page.tsx`        | Server Component                  | 클라이언트 로직 없음, container 에 위임 |
| `features/*/container/` | Client Component                  | 훅·상태 사용                            |
| `features/*/ui/`        | Client Component (props only)     | 인터랙션 필요, 비즈니스 로직 격리       |
| `widgets/layout/`       | Client Component                  | 사이드바 open/close 상태                |
| Swagger UI (`/docs`)    | Client + `dynamic({ ssr:false })` | swagger-ui-react 가 `window` 의존       |

> 추가 성능 포인트: `useMemo` 로 KPI/차트 데이터 변환 격리, `CarbonGauge` 는 순수 SVG 단일 arc 로 DOM 절감, 섹션별 `QueryErrorCard` 로 에러 격리.

---

## 데이터 모델 / ERD

```
companies (1) ──────────< activities (N)
                              │
                              │ factor_category → emission_factors.category
                              ▼
                         emission_factors (1)
                              │
                              │ (RPC: create_activity_with_emission)
                              ▼
                         emission_results (N)

companies (1) ──────────< posts (N)
```

| 테이블             | 핵심 컬럼                                                                 | 특이사항                                                           |
| ------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `companies`        | id, name, country                                                         | —                                                                  |
| `emission_factors` | category, name, activity_type, factor, valid_from, valid_to               | `valid_to IS NULL` = 현재 유효. category별 active 1개 강제         |
| `activities`       | date, year_month(generated), type, description, factor_category, quantity | `date` = YYYY-MM-DD 원본 보존. `year_month` 는 자동 파생. **불변** |
| `emission_results` | emission_kg_co2e, scope, calculated_at                                    | activity_id UNIQUE. 배출계수 변경 시 재계산 가능                   |
| `posts`            | title, resource_uid, date_time, content                                   | `date_time` = "YYYY-MM"                                            |

### 핵심 설계 원칙

1. **활동 데이터와 계산 결과 분리** — 배출계수가 개정되어도 원본을 유지한 채 재계산 가능 (감사 추적)
2. **배출계수 버전 관리** — `valid_from`/`valid_to` 로 과거 시점의 계산을 그대로 재현
3. **Scope 자동 결정** — 활동 유형(전기/원소재/운송)에서 RPC 가 자동 결정해 입력 오류 방지
4. **단위 통일** — 입력·계산은 `kgCO2e`, 대시보드 표시는 `tCO2e` (÷1000)

### 계산 공식

```
배출량 (kgCO2e) = 활동량 × 배출계수
```

> 상세 도메인 이해(Scope 1/2/3, GHG Protocol, Net Zero): [`docs/09-carbon-domain.md`](./docs/09-carbon-domain.md) · 데이터 모델 전문: [`docs/02-data-model.md`](./docs/02-data-model.md)

---

## 핵심 기능

### 대시보드 (`/dashboard`)

> "현재 상태 → 원인 파악 → 개선 방향" 으로 흐르는 의사결정 보조 대시보드. 단순 시각화가 아닌 비전문가도 즉시 해석 가능한 정보 구성.

- **KPI 카드 4종** — 총 배출량 / 전월 대비 증감률 / 최대 배출원 / 최대 배출 시점. 톤 시스템(`good`/`warn`/`neutral`)으로 stripe·아이콘·해석 문구가 자동 컬러링.
- **활동 유형별 도넛** — 전기/원소재/운송 비중 + 계산식(`?`) 툴팁 + 자동 요약.
- **월별 추이 stacked area** — 활동 유형별 누적 + 자동 분석 (증가 / 안정 / 감소 추세 최대 3개).
- **탄소 관리 등급 게이지** — 0–100 점 단일 SVG arc + 등급 사유 + 업계 평균 비교.
- **감축 제안 카드** — 활동별 절감 시뮬레이션 (월/연 tCO₂e). "연간 X tCO₂e 감소 가능" 구간 자동 강조.
- **자동 인사이트** — `shared/lib/insights.ts` 룰 기반 메시지 생성. `\d+%[↓↑]?` 패턴 자동 `<strong>` 강조.

### 활동 관리 (`/activities`)

- 정렬 가능 테이블(날짜/유형/수량/Scope 클릭 토글) + 행별 삭제.
- 활동 입력 폼 — React Hook Form + Zod, 활동량 입력 시 **실시간 배출량 미리보기**, 단위는 배출계수 선택 시 자동 입력, Scope 는 서버에서 자동 결정.
- 모바일에서는 바텀시트 다이얼로그.

### 에러 / 로딩 UX

- **섹션별 독립 에러 격리** — `QueryErrorCard` + 재시도 버튼으로 한 섹션 실패가 페이지 전체를 죽이지 않음.
- **15% 쓰기 실패 시뮬레이션** 환경에서도 toast 폴백으로 일관된 UX.
- **Skeleton 로딩** — KPI / 차트별 전용 skeleton.

### 다크 모드

- CSS 변수 + `<html>` class 토글, Zustand `persist` 로 사용자 선택 저장, `prefers-color-scheme` 폴백.
- 차트 fill 컬러를 라이트/다크 모드별 분기 (`--chart-cat-*`) — 라이트는 deep tone, 다크는 lighter tone 으로 가독성 확보.

### 접근성 (WCAG AA)

- 모든 아이콘 버튼에 `aria-label`, 폼 요소에 `<label htmlFor>`, 활성 메뉴 `aria-current="page"`.
- 색 대비 4.5:1 충족 — Scope 텍스트는 별도 `--scope*-text` 토큰으로 분리해 차트 fill 의 GHG Protocol 컨벤션을 깨지 않으면서 가독성 보장.
- 사이드바 비표시 시 `inert` 로 자식 포커스 차단 (matchMedia 분기).

### API 문서 (`/docs`)

Zod 스키마에서 OpenAPI 3.0 spec 을 자동 생성하여 인터랙티브 Swagger UI 로 노출.

```
shared/types/*.ts (Zod)  → shared/lib/openapi.ts (registry)
                         → /api/docs (force-static JSON)
                         → /docs (swagger-ui-react)
```

자세한 동작 흐름·트러블슈팅: [`docs/11-swagger-and-openapi.md`](./docs/11-swagger-and-openapi.md)

> 전체 기능 목록·구현 범위: [`docs/03-features.md`](./docs/03-features.md)

---

## 디자인 시스템

- **CSS 변수 단일 소스** — 모든 색상·spacing 은 `src/app/globals.css` 의 `:root` / `@theme inline` 블록에서만 관리. 컴포넌트는 `text-text` / `bg-surface` 같은 시맨틱 토큰만 사용 (하드코딩 hex 금지).
- **Pretendard Variable** — `next/font/local` 로 단일 woff2 self-host. 빌드 타임 메트릭 분석으로 CLS 0, weight별 별도 파일 불필요 (~3MB 절감).
- **GHG Scope 컬러 컨벤션** — `--scope1: #ef4444` (빨강) / `--scope2: #f59e0b` (주황) / `--scope3: #3b82f6` (파랑) 는 GHG Protocol 표준이라 변경 금지.
- **반응형** — < 768px Drawer 오버레이, 768~1280px 2열 KPI, > 1280px 4열 KPI. `lg` 분기점에서 카드뷰/테이블뷰 토글.
- **인터랙티브 cursor 베이스라인** — shadcn 기반 컴포넌트(`Button`, `SelectTrigger`, `DialogClose`, `Label`)에 `cursor-pointer` 를 baseline 클래스로 박아 호출부에서 중복 지정 불필요. native date input 의 `::-webkit-calendar-picker-indicator` 는 `globals.css` 에서 전역 처리.

> 컬러 팔레트·타이포그래피·컴포넌트 규칙 전문: [`docs/05-design-system.md`](./docs/05-design-system.md)

---

## 테스트

- **단위 테스트 87 케이스** — 핵심 비즈니스 로직(`calculations`, `insights`)과 Zod 스키마(`activity`, `post`) 100% 커버.
- **의도적 제외 영역** — `app/api/**` (Supabase 모킹 비용 > 회귀 방어 가치), `shared/hooks/**` (TanStack Query 얇은 wrapper), `shared/lib/api.ts` (fetch wrapper), Zustand 스토어. 통합 환경(Vercel 프리뷰 + 수동 시나리오)으로 대체.
- 과제 스펙 "에러 처리 (필수)" 4개 항목(숫자 외 / 음수 / 필수 누락 / 저장 실패)이 단위 테스트로 보장됨.

```bash
pnpm test:run        # 87 케이스 실행
pnpm test:coverage   # 커버리지 리포트
```

| 모듈                         | Stmts    | 비고             |
| ---------------------------- | -------- | ---------------- |
| `shared/lib/calculations.ts` | **100%** | 핵심 계산 함수   |
| `shared/lib/insights.ts`     | **100%** | 자동 인사이트 룰 |

> 테스트 전략·커버리지 해석·trade-off: [`docs/10-testing.md`](./docs/10-testing.md)

---

## 주요 설계 결정 (Trade-off)

> 발표 시 "왜 그렇게 설계했는가" 의 근거. 자세한 가정·질문 사항: [`docs/07-assumptions-and-questions.md`](./docs/07-assumptions-and-questions.md).

| 결정                                       | 대안                                 | 선택 이유 / Trade-off                                                                                          |
| ------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| **Next.js API Routes + Supabase**          | Fake API 만 사용                     | 실제 영속성 + PostgreSQL 가점. 세팅 비용은 ~30분 추가지만 구조가 실서비스와 동일.                              |
| **Zod 스키마 단일 출처**                   | 타입과 검증과 OpenAPI 분리           | 타입 + 검증 + API 문서가 하나의 스키마에서 파생. 중복 0. 학습 곡선만 약간 있음.                                |
| **`activities` ↔ `emission_results` 분리** | `activities` 안에 emission 컬럼 포함 | 배출계수 개정 시 재계산 가능 + 감사 추적. 데이터 양은 약간 늘어남. 실무 탄소 회계 표준.                        |
| **배출계수 `valid_from` / `valid_to`**     | 단일 레코드 갱신                     | 과거 시점 계산을 그대로 재현. 규제 감사 대응 필수. 구현 복잡도 ↑ 만큼 가치가 큼.                               |
| **Scope 자동 결정 (RPC 내부)**             | 사용자가 폼에서 선택                 | 입력 오류 차단. Scope 는 활동 유형으로 결정되는 종속값이라 입력받을 이유 없음.                                 |
| **TanStack Query + Zustand 분리**          | Context API 단일 사용                | 서버 상태와 UI/Filter 상태의 캐싱·동기화 정책이 완전히 다름. 분리해야 둘 다 단순해짐.                          |
| **Optimistic Update 미채택**               | useMutation onMutate                 | `maybeFail` 15% 환경에서 낙관적 갱신 후 롤백이 잦으면 오히려 UX 혼란. toast + invalidate 가 더 명확.           |
| **Recharts**                               | Visx, Chart.js                       | React 컴포넌트 모델 친화 + SSR 호환. 깊은 커스터마이징은 일부 제한.                                            |
| **shadcn/ui**                              | MUI / Ant Design                     | 과제 제약(무거운 UI 라이브러리 금지). headless + 스타일 자유도. 초기 셋업 시간만 약간.                         |
| **CSS 변수 + Tailwind v4**                 | tailwind.config 기반 토큰            | 다크/라이트 모드 분기·런타임 토글이 자연스러움. 시맨틱 토큰만 노출하여 하드코딩 차단.                          |
| **route group `(app)` 으로 `/docs` 격리**  | 조건부 layout                        | swagger-ui-react 의 라이트 테마와 사이드바(다크) 충돌 방지. layout 트리 분리가 표준적.                         |
| **API Route 단위 테스트 의도적 제외**      | 3종 세트 (200/400/500)               | Supabase chain·RPC 모킹 비용이 높고 모킹된 테스트는 실제 마이그레이션 버그를 못 잡음. 통합 환경 검증으로 대체. |
| **Excel Import / Docker Compose 미구현**   | 가점 요소 추구                       | 마감 시간 내 핵심 평가 항목(설계 트레이드오프·UI/UX 완성도)에 집중하기 위해 의도적 보류.                       |

---

## AI 활용 내역

본 과제는 Anthropic Claude Code 와 페어 프로그래밍 방식으로 진행했습니다.

### AI 가 주도한 영역

- **Boilerplate 생성** — Zod 스키마, TanStack Query 훅, shadcn/ui 호출부, Vitest 테스트 케이스 1차 작성.
- **반복 패턴 적용** — API Route 5개의 jitter/maybeFail/에러 응답 형태 통일.
- **문서 초안** — `docs/` 의 각 설계 문서 1차 작성.
- **타입 추론** — 복잡한 제네릭 / `z.infer` 체이닝 / TanStack Query v5 마이그레이션 (`isLoading` → `isPending`).

### 사람이 주도한 영역

- **도메인 / 정보 구조 결정** — 대시보드의 "현재 → 원인 → 개선" 정보 흐름, KPI 4종 선정, 자동 인사이트 룰 설계.
- **디자인 의사결정** — 컬러 팔레트, 톤 시스템(`good`/`warn`/`neutral`), 헤딩 계층, KPI 카드 stripe 패턴, 사이드바 다크 + 본문 라이트의 시각적 위계.
- **Trade-off 판단** — Optimistic Update 채택 여부, API Route 테스트 제외 결정, Excel Import 보류, route group 분리 시점.
- **FSD 경계 결정** — `widgets/` vs `features/` 분류 기준, Container 생성 기준, 슬라이스 분리 단위.
- **설계 헌법 작성** — [`CLAUDE.md`](./CLAUDE.md) 가 프로젝트 규칙의 단일 소스. AI 협업 일관성을 코드 외부에 명문화.

### 협업 도구

- **`CLAUDE.md`** — 기술 스택·아키텍처·금지 사항·코딩 컨벤션·도메인 규칙을 한 파일에 정리. 모든 AI 작업이 이 파일을 우선 근거로 삼음.
- **`.claude/rules/`** — FSD 아키텍처, React 코딩 컨벤션, 위키 동기화 규칙을 분리.
- **`/ship` slash command** — CI 검증 → 이슈 → 브랜치 → 커밋 → PR → 위키 → CI 모니터링을 표준화한 자체 워크플로우.

> 결과적으로 AI 는 **속도**를, 사람은 **방향**을 책임지는 분담입니다. 모든 디자인 / 트레이드오프 결정은 직접 판단했고, AI는 그 결정을 일관되게 반영하는 데 활용했습니다.

---

## 더 읽을거리

| 주제                                 | 문서                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| 과제 원본 스펙                       | [`docs/00-assignment.md`](./docs/00-assignment.md)                               |
| 과제 개요 / 평가 기준                | [`docs/00-overview.md`](./docs/00-overview.md)                                   |
| 아키텍처 (FSD · 상태 · 렌더링)       | [`docs/01-architecture.md`](./docs/01-architecture.md)                           |
| 데이터 모델 / ERD / 계산 공식        | [`docs/02-data-model.md`](./docs/02-data-model.md)                               |
| 기능 목록 / 미구현 항목              | [`docs/03-features.md`](./docs/03-features.md)                                   |
| 구현 계획 / Trade-off 기록           | [`docs/04-implementation-plan.md`](./docs/04-implementation-plan.md)             |
| 디자인 시스템                        | [`docs/05-design-system.md`](./docs/05-design-system.md)                         |
| API 클라이언트 / TanStack Query 패턴 | [`docs/06-api-client.md`](./docs/06-api-client.md)                               |
| 가정 사항 / 설계 결정 근거           | [`docs/07-assumptions-and-questions.md`](./docs/07-assumptions-and-questions.md) |
| 백엔드 셋업 (Supabase · API Route)   | [`docs/08-backend-setup.md`](./docs/08-backend-setup.md)                         |
| 탄소 회계 도메인 이해                | [`docs/09-carbon-domain.md`](./docs/09-carbon-domain.md)                         |
| 테스트 전략 / 커버리지               | [`docs/10-testing.md`](./docs/10-testing.md)                                     |
| Swagger UI / OpenAPI 동작            | [`docs/11-swagger-and-openapi.md`](./docs/11-swagger-and-openapi.md)             |
| 프로젝트 헌법 (AI 협업 규칙)         | [`CLAUDE.md`](./CLAUDE.md)                                                       |
