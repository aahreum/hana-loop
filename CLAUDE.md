# CLAUDE.md — HanaLoop Carbon Dashboard 헌법

> **과제 원본 스펙**: [`docs/00-assignment.md`](./docs/00-assignment.md)
> 모든 구현 결정은 이 스펙을 최우선 근거로 삼는다.

> 이 파일은 프로젝트의 모든 기술 규칙을 정의한다.
> 코드 작성 전 반드시 숙지하고, 모든 결정의 근거로 삼는다.
> 규칙이 충돌하거나 모호한 경우, 이 파일의 내용을 우선한다.

---

## 프로젝트 컨텍스트

**HanaLoop Carbon Dashboard** — 기업 탄소 배출량 관리 플랫폼.
경영진과 실무자가 활동 데이터를 입력하고, 배출계수 기반으로 탄소 배출량을
자동 계산하여 Scope 1/2/3 기준으로 시각화한다.

**핵심 흐름**:

```
활동 데이터 입력 → 배출계수 조회 → 배출량 계산 → Supabase 저장 → 대시보드 시각화
```

---

## 기술 스택

| 항목          | 기술                                                   |
| ------------- | ------------------------------------------------------ |
| 프레임워크    | Next.js 15 App Router                                  |
| 언어          | TypeScript (strict)                                    |
| 스타일링      | Tailwind CSS v4 (tailwind.config 없음 — globals.css만) |
| UI            | shadcn/ui (수정 금지)                                  |
| 상태 관리     | Zustand (UI/Filter) + TanStack Query v5 (서버)         |
| 폼            | React Hook Form + Zod                                  |
| DB            | Supabase (PostgreSQL)                                  |
| API 문서      | zod-to-openapi + swagger-ui-react (`/docs`)            |
| 차트          | Recharts                                               |
| 테스트        | Vitest + Testing Library                               |
| 패키지 관리자 | pnpm                                                   |

---

## 아키텍처: FSD (Feature-Sliced Design)

### 레이어 구조

```
app/        → Next.js 라우팅만 (page.tsx, layout.tsx, route.ts)
features/   → 기능 단위 슬라이스
shared/     → 전역 공유 코드
data/       → 정적 Seed 데이터 (수정 금지)
```

### 의존성 방향 (단방향, 위반 시 ESLint 에러)

```
app  →  features  →  shared
                 ↗
           data (독립, 다른 레이어 import 금지)
```

- `features/A`는 `features/B`를 import할 수 없다 (슬라이스 간 금지)
- `shared`는 어떤 레이어도 import할 수 없다
- `data/`는 어떤 레이어도 import할 수 없다

### features/ 내부 구조 규칙

```
features/{slice}/
  ui/     → 컴포넌트. props만 받아서 렌더링. 훅·상태 직접 사용 금지.
  hooks/  → 데이터 페칭, 뮤테이션, 로컬 상태 관리.
```

```tsx
// ✅ 올바른 ui/ 컴포넌트
export function ActivityTable({ activities, onDelete }: ActivityTableProps) {
  return <table>...</table>;
}

// ❌ 금지 — ui/ 안에서 훅 직접 사용
export function ActivityTable() {
  const { data } = useActivities(); // 금지
  ...
}
```

---

## 타입 시스템

### Zod 스키마가 유일한 타입 출처

`shared/types/`의 Zod 스키마에서 `z.infer<>` 로 타입을 파생한다.
별도 `interface` / `type` 선언으로 타입을 중복 정의하지 않는다.

```ts
// ✅ 올바른 방식
export const ActivitySchema = z.object({ ... });
export type ActivityData = z.infer<typeof ActivitySchema>;

// ❌ 금지 — 중복 타입 선언
interface ActivityData { ... }
type ActivityData = { ... }
```

### zod-to-openapi 통합

새로운 Zod 스키마 작성 시 `extendZodWithOpenApi(z)`를 사용해
OpenAPI spec이 자동으로 최신 상태를 유지하도록 한다.
`shared/lib/openapi.ts`에 등록.

---

## 상태 관리

### 서버 상태 — TanStack Query (shared/hooks/)

```ts
// ✅ 올바른 방식 — QUERY_KEYS 상수 필수 사용
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

export function useActivities(params?: ActivityQueryParams) {
  return useQuery({
    queryKey: QUERY_KEYS.activitiesFiltered(params ?? {}),
    queryFn: () => api.getActivities(params),
  });
}

// ❌ 금지 — 인라인 string key
useQuery({ queryKey: ['activities'] });
```

### UI/Filter 상태 — Zustand

```ts
// shared/lib/store/ 또는 features/{slice}/hooks/ 내부에 위치
// UI State: drawer, modal open/close
// Filter State: 선택된 회사, 날짜 범위, 카테고리 필터
```

### Form 상태 — React Hook Form (features/{slice}/ui/ 내부)

```ts
// ✅ 올바른 방식
const { register, handleSubmit } = useForm<CreateActivityInput>({
  resolver: zodResolver(CreateActivitySchema),
});

// ❌ 금지 — 폼에 useState 직접 사용
const [quantity, setQuantity] = useState('');
```

---

## API 패턴

### 클라이언트 → API Route → Supabase

```
features/{slice}/hooks/ (useMutation)
  → shared/lib/api.ts (fetch 함수)
    → app/api/**/route.ts (Next.js API Route)
      → shared/lib/supabase.server.ts
        → Supabase (PostgreSQL)
```

### API Route 작성 규칙

```ts
// app/api/activities/route.ts

// 1. 지연 시뮬레이션 — 모든 엔드포인트에 적용
const jitter = () => new Promise<void>((res) => setTimeout(res, 200 + Math.random() * 600));

// 2. 쓰기 실패 시뮬레이션 — POST/DELETE에만 적용 (15%)
const maybeFail = () => Math.random() < 0.15;

// 3. supabaseAdmin (서버 전용) 사용 — supabase (브라우저용) 금지
import { supabaseAdmin } from '@/shared/lib/supabase.server';

// 4. 에러 응답 형식 통일
return NextResponse.json({ error: '...' }, { status: 500 });
```

### Supabase 규칙

- 클라이언트 컴포넌트에서 `supabaseAdmin` import 절대 금지
- `supabase` (브라우저 클라이언트)는 실시간 구독 등 필요한 경우에만 사용
- 모든 DB 쿼리는 API Route를 통해서만

---

## 디자인 시스템

### 컬러 — CSS 변수만 사용

```tsx
// ✅ 올바른 방식
<div className="bg-surface text-text border-border" />
<div className="bg-primary text-white" />

// ❌ 금지 — 하드코딩 색상
<div className="bg-[#10B981]" />
<div style={{ color: '#0F172A' }} />
```

### 차트 색상 — CHART_COLORS 상수 사용

```ts
// ✅ 올바른 방식
import { CHART_COLORS } from '@/shared/constants/chartColors';
<Bar fill={CHART_COLORS.scope1} />

// ❌ 금지
<Bar fill="#EF4444" />
```

### Tailwind 설정 수정 금지

- `tailwind.config.*` 파일 없음 — Tailwind v4는 CSS 기반 설정
- 새로운 디자인 토큰은 `src/app/globals.css`의 `:root`와 `@theme inline` 블록에만 추가
- Scope 색상(`--scope1/2/3`)은 절대 변경 금지 — GHG Protocol 컬러 컨벤션

### shadcn/ui 컴포넌트

- `src/shared/ui/`에 설치된 shadcn/ui 컴포넌트는 내부 코드 수정 금지
- 스타일 커스터마이징은 props(className)로만

---

## 탄소 도메인 규칙

### 단위 통일

- **입력/계산**: `kgCO2e`
- **대시보드 표시**: `tCO2e` (kgCO2e ÷ 1000)
- `shared/lib/calculations.ts`의 `kgToTon()` 함수 반드시 사용

### Scope 자동 결정

```ts
// shared/constants/ghgScope.ts의 GHG_SCOPE 매핑 사용
// 사용자가 Scope를 직접 선택하지 않음 — 활동 유형에서 자동 결정
import { GHG_SCOPE } from '@/shared/constants/ghgScope';
const scope = GHG_SCOPE[activityType]; // 자동 결정
```

### 활동 데이터와 계산 결과 분리

- `activities` 테이블: 원본 활동 데이터 (불변)
- `emission_results` 테이블: 계산 결과 (배출계수 변경 시 재계산 가능)
- API Route에서 활동 데이터 저장 시 계산 결과도 동시에 저장

### 배출계수 버전 관리

- 현재 유효한 계수: `validTo IS NULL`인 레코드
- 과거 계수 조회: `validFrom <= yearMonth AND (validTo IS NULL OR validTo >= yearMonth)`

---

## 코딩 컨벤션

### Named export 필수

```ts
// ✅ 올바른 방식
export function KpiCard(props: KpiCardProps) { ... }
export const useCreateActivity = () => { ... };

// ❌ 금지 — default export (page.tsx, layout.tsx, route.ts 제외)
export default function KpiCard() { ... }
```

### 컴포넌트 파일 구조

```tsx
// 1. import
// 2. 타입 정의
// 3. 컴포넌트 함수
// 4. export (named)
```

### 금지 사항

| 금지                                     | 이유                                    |
| ---------------------------------------- | --------------------------------------- |
| `console.log`                            | `console.warn` / `console.error`만 허용 |
| `any` 타입                               | TypeScript strict 모드 위반             |
| 하드코딩 색상                            | 다크모드 대응 불가                      |
| 인라인 Query Key string                  | 타입 안전성 없음, 오타 위험             |
| `interface`로 중복 타입                  | Zod 스키마가 단일 소스                  |
| `features/A`에서 `features/B` import     | FSD 규칙 위반                           |
| `shared/`에서 다른 레이어 import         | FSD 규칙 위반                           |
| `supabaseAdmin` 클라이언트 컴포넌트 사용 | 서비스 롤 키 노출                       |

---

## 테스트 규칙

### 커버리지 대상

- `src/shared/lib/**` (계산 함수, API 클라이언트)
- `src/shared/hooks/**` (TanStack Query 훅)
- `src/app/api/**` (API Route Handler)
- `src/features/**/hooks/**` (Feature 훅)

### API Route 테스트 3종 세트

```ts
describe('POST /api/activities', () => {
  it('성공 시 201과 생성된 데이터 반환', async () => { ... });
  it('필수값 누락 시 400 반환', async () => { ... });
  it('DB 에러 시 500 반환', async () => { ... });
});
```

### 계산 함수 단위 테스트 필수

```ts
// shared/lib/calculations.ts의 모든 함수는 단위 테스트 필수
describe('calculateEmission', () => {
  it('활동량 × 배출계수를 반환한다', () => {
    expect(calculateEmission(110, 0.4567)).toBeCloseTo(50.24);
  });
});
```

---

## Git 워크플로우

> 작업 완료 후 PR 생성은 반드시 `/ship` 커맨드를 사용한다.
> `/ship`은 CI 검증 → 이슈 생성 → 브랜치/커밋 → PR 생성 → 위키 작성 → CI 모니터링을 순서대로 실행한다.
> 상세 절차는 `.claude/commands/ship.md` 참조.

### 커밋 형식

```
type: subject #이슈번호

예시:
feat: add KPI cards with Suspense boundary #3
fix: correct emission calculation for Scope 3 #12
design: update sidebar color to emerald-900 #7
test: add unit tests for calculateEmission #15
```

타입: `feat` `fix` `docs` `style` `refactor` `perf` `test` `chore` `ci` `build` `revert` `design`

### 브랜치 형식

```
type/#이슈번호-설명 (소문자, 하이픈 구분)

예시:
feat/#3-implement-dashboard-charts
fix/#12-fix-emission-calculation-bug
design/#7-update-kpi-card-layout
```

### 커밋 단위

기능 단위로 커밋. 파일 단위 커밋 금지.
한 커밋에 한 가지 의미 있는 변경사항만.

---

## 파일 추가 시 체크리스트

새 파일을 추가하기 전:

- [ ] 위치가 FSD 레이어 규칙에 맞는가?
- [ ] `features/` 내부라면 `ui/`와 `hooks/`가 분리되어 있는가?
- [ ] 타입이 `shared/types/`의 Zod 스키마에서 파생되는가?
- [ ] 색상이 CSS 변수(`text-text`, `bg-surface` 등)를 사용하는가?
- [ ] Query Key가 `QUERY_KEYS` 상수를 사용하는가?
- [ ] Named export를 사용하는가?
- [ ] 새로운 계산 로직이라면 단위 테스트가 있는가?
