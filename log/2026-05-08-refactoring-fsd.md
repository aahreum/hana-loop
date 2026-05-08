# 2026-05-08 대형 FSD 리팩토링 로그

> 목적: 코드 전수 조사 후 `.claude/rules/` 에 정의된 FSD 아키텍처 규칙 및 리액트 코딩 컨벤션 위반 항목 전면 수정

---

## 배경

세션 02에서 신규 규칙 파일 3종을 작성했다:
- `.claude/rules/fsd-architecture.md` — FSD 레이어 의존성, widgets/ 규칙
- `.claude/rules/react-coding-conventions.md` — isPending, page 서버 컴포넌트, JSX 삼항, forwardRef, UI/Container 분리

이 규칙들에 맞추어 기존 코드 전수 조사 후 위반 항목 전체 수정.

---

## 규칙별 위반 항목 & 수정 내용

### 1. `isLoading` → `isPending` (TanStack Query v5)

**규칙**: `isLoading = isPending && isFetching`. retry backoff 구간에서 `isLoading`이 false가 되어 로딩 상태가 사라지는 버그 유발. 항상 `isPending` 사용.

| 파일 | 변경 전 | 변경 후 |
|---|---|---|
| `src/features/dashboard/hooks/useDashboard.ts` | `isLoading: resultsLoading` / `isLoading: activitiesLoading` | `isPending: resultsLoading` / `isPending: activitiesLoading` |
| `src/widgets/layout/hooks/useLayout.ts` | `isLoading: companiesLoading` | `isPending: companiesLoading` |
| `src/app/activities/page.tsx` (→ container로 이동) | `isLoading` | `isPending` |
| `src/app/companies/page.tsx` (→ container로 이동) | `isLoading` | `isPending` |
| `src/app/factors/page.tsx` (→ container로 이동) | `isLoading` | `isPending` |

---

### 2. page.tsx → 서버 컴포넌트 전환

**규칙**: `app/` 의 `page.tsx`는 서버 컴포넌트. 클라이언트 로직은 `container/` 컴포넌트에 위임.

| 파일 | 변경 전 | 변경 후 |
|---|---|---|
| `src/app/dashboard/page.tsx` | `'use client'` + 전체 UI 로직 | 서버 컴포넌트, `<DashboardContainer />` 렌더만 |
| `src/app/activities/page.tsx` | `'use client'` + 전체 UI 로직 | 서버 컴포넌트, `<ActivitiesContainer />` 렌더만 |
| `src/app/companies/page.tsx` | `'use client'` + 전체 UI 로직 | 서버 컴포넌트, `<CompaniesContainer />` 렌더만 |
| `src/app/factors/page.tsx` | `'use client'` + 전체 UI 로직 | 서버 컴포넌트, `<FactorsContainer />` 렌더만 |

---

### 3. UI/Container 분리 — `ui/` 컴포넌트에서 훅 제거

**규칙**: `features/{slice}/ui/` 컴포넌트는 props만 받아 렌더링. 훅·상태 직접 사용 금지.

#### `ActivityTable.tsx`
- **제거**: `useDeleteActivity` hook, `deletingId` 로컬 상태, `toast` 호출
- **추가 props**: `onDelete: (id: string) => void`, `isDeleting: boolean`, `deletingId: string | null`
- 순수 표현 컴포넌트로 전환

#### `ActivityFormDialog.tsx`
- **제거**: `useFactors`, `useCreateActivity` hook import, `handleSubmit` 내부 로직
- **추가 props**: `factors: EmissionFactor[]`, `isSubmitting: boolean`, `onSubmit: (data: CreateActivityInput) => void`
- Dialog 래퍼 역할만 수행

---

### 4. Container 컴포넌트 신규 생성

비즈니스 로직(훅, 상태, toast)을 ui/에서 분리하여 container/로 이동.

#### `src/features/activities/container/`

| 파일 | 역할 |
|---|---|
| `ActivityTableContainer.tsx` | `useDeleteActivity` + `deletingId` 상태 + toast → `<ActivityTable>` 에 props 주입 |
| `ActivityFormDialogContainer.tsx` | `useFactors` + `useCreateActivity` + toast → `<ActivityFormDialog>` 에 props 주입 |
| `ActivitiesContainer.tsx` | `useActivities` + 페이지 레이아웃 + 두 컨테이너 조합. 삼항 체인 → `TableContent` 서브컴포넌트로 분리 |

#### `src/features/dashboard/container/`

| 파일 | 역할 |
|---|---|
| `DashboardContainer.tsx` | `useDashboard` 훅 사용, KPI/차트/활동 섹션별 서브컴포넌트로 삼항 체인 해소 |

서브컴포넌트:
- `KpiSection` — isPending/error/data 3분기 렌더
- `ChartSection` — 공통 로딩/에러/차트 래퍼
- `RecentActivitiesSection` — 최근 활동 목록 렌더

#### `src/features/companies/container/`

| 파일 | 역할 |
|---|---|
| `CompaniesContainer.tsx` | `useCompanies` + 레이아웃. `CompaniesContent` 서브컴포넌트로 삼항 체인 해소. `text-gray-400` → `text-muted-foreground` 수정 |

#### `src/features/factors/container/`

| 파일 | 역할 |
|---|---|
| `FactorsContainer.tsx` | `useFactors` + 레이아웃. `FactorsContent` 서브컴포넌트로 삼항 체인 해소. `text-gray-400` → `text-muted-foreground` 수정 |

---

### 5. JSX 삼항 체인(중첩 삼항) 제거

**규칙**: `a ? b : c ? d : e` 패턴 금지. 서브컴포넌트 early return으로 대체.

적용된 패턴:
```tsx
// Before (anti-pattern)
{isLoading ? <Skeleton /> : error ? <ErrorUI /> : <Content />}

// After
function SomeSection({ isPending, error, ... }) {
  if (isPending) return <Skeleton />;
  if (error) return <ErrorUI />;
  return <Content />;
}
```

수정 파일: `ActivitiesContainer`, `CompaniesContainer`, `FactorsContainer`, `DashboardContainer` (섹션별 서브컴포넌트 4개)

---

### 6. 하드코딩 색상 → CSS 변수

**규칙**: `text-gray-400` 등 하드코딩 Tailwind 색상 금지. CSS 변수 기반 토큰 사용.

| 파일 | 변경 전 | 변경 후 |
|---|---|---|
| `companies/page.tsx` (→ container) | `text-gray-400` (2곳) | `text-muted-foreground` |
| `factors/page.tsx` (→ container) | `text-gray-400` (3곳) | `text-muted-foreground` |

---

### 7. `widgets/` 레이어 신설 + `features/layout/` 삭제

**규칙**: Header, Sidebar, AppShell 같은 조합형 레이아웃 UI는 `widgets/` 레이어에 위치.

#### 신규 생성
- `src/widgets/layout/hooks/useLayout.ts` — 회사 목록 로딩 로직
- `src/widgets/layout/ui/NavigationDrawer.tsx` — 사이드바 UI
- `src/widgets/layout/ui/AppShell.tsx` — 전체 레이아웃 래퍼

#### Header → shared/ui로 이동
- `src/shared/ui/header.tsx` — 순수 UI (lucide + button만 의존). `features/`와 `widgets/` 양쪽에서 import 가능하도록 `shared/`에 배치

#### 삭제
- `src/features/layout/` 전체 디렉토리 (hooks/useLayout, ui/AppShell, ui/Header, ui/NavigationDrawer)

#### 영향받은 import 경로 수정
| 파일 | 변경 전 | 변경 후 |
|---|---|---|
| `src/app/layout.tsx` | `@/features/layout/ui/AppShell` | `@/widgets/layout/ui/AppShell` |
| 각 container 파일들 | `@/features/layout/ui/Header` | `@/shared/ui/header` |

---

### 8. ErrorBoundary / QueryErrorCard 추가

- `src/shared/ui/query-error-card.tsx` 신규 생성
- 섹션별 독립 에러 격리 + "다시 시도" 버튼
- `DashboardContainer` 내 5개 섹션에 적용

---

## 파일 변경 요약

### 신규 생성 (13개)
```
src/shared/ui/header.tsx
src/shared/ui/query-error-card.tsx
src/widgets/layout/hooks/useLayout.ts
src/widgets/layout/ui/AppShell.tsx
src/widgets/layout/ui/NavigationDrawer.tsx
src/features/activities/container/ActivityTableContainer.tsx
src/features/activities/container/ActivityFormDialogContainer.tsx
src/features/activities/container/ActivitiesContainer.tsx
src/features/dashboard/container/DashboardContainer.tsx
src/features/companies/container/CompaniesContainer.tsx
src/features/factors/container/FactorsContainer.tsx
.claude/rules/fsd-architecture.md
.claude/rules/react-coding-conventions.md
```

### 수정 (9개)
```
src/features/activities/ui/ActivityTable.tsx       — 훅 제거, props 추가
src/features/activities/ui/ActivityFormDialog.tsx  — 훅 제거, props 추가
src/features/dashboard/hooks/useDashboard.ts       — isLoading → isPending
src/app/dashboard/page.tsx                         — 서버 컴포넌트화
src/app/activities/page.tsx                        — 서버 컴포넌트화
src/app/companies/page.tsx                         — 서버 컴포넌트화
src/app/factors/page.tsx                           — 서버 컴포넌트화
src/app/layout.tsx                                 — AppShell import 경로
CLAUDE.md                                          — FSD/컨벤션 rules 참조 링크
```

### 삭제 (4개)
```
src/features/layout/hooks/useLayout.ts
src/features/layout/ui/AppShell.tsx
src/features/layout/ui/Header.tsx
src/features/layout/ui/NavigationDrawer.tsx
```

---

## 검증

```
pnpm type-check  → ✅ 0 errors
pnpm lint        → ✅ 0 errors (prettier 3건 자동 수정 후)
```
