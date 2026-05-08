# 아키텍처 설계

## 기술 스택

| 레이어      | 기술                              | 선택 이유                                                 |
| ----------- | --------------------------------- | --------------------------------------------------------- |
| 프레임워크  | Next.js 15 App Router             | 요구사항(14+). RSC로 초기 로딩 최적화, 최신 캐싱 API 활용 |
| 언어        | TypeScript                        | 요구사항. 도메인 복잡도 상 타입 안정성 필수               |
| 스타일링    | Tailwind CSS                      | 빠른 반응형 구현, 디자인 토큰 일관성                      |
| UI 컴포넌트 | shadcn/ui                         | 요구사항 허용. Headless + 스타일 자유도                   |
| 상태 관리   | Zustand + TanStack Query          | UI/서버 상태 명확히 분리                                  |
| 폼          | React Hook Form + Zod             | 유효성 검증 + 타입 추론                                   |
| 차트        | Recharts                          | React 친화적, 경량, 커스터마이징 용이                     |
| DB          | Supabase (PostgreSQL)             | 호스팅 PostgreSQL. 무료 티어. 타입 자동 생성              |
| API 문서    | zod-to-openapi + swagger-ui-react | Zod 스키마 → OpenAPI spec 자동 생성. 코드가 곧 문서       |

---

## 프로젝트 구조 (FSD 4-layer)

Feature-Sliced Design 구조. `features/` 간 상호 임포트 금지.

```
src/
├── app/                          # Next.js App Router (서버 컴포넌트, 라우팅만)
│   ├── layout.tsx                # Root layout (AppShell 조합)
│   ├── page.tsx                  # redirect → /dashboard
│   ├── dashboard/page.tsx        # 서버 컴포넌트 → DashboardContainer 렌더
│   ├── activities/page.tsx       # 서버 컴포넌트 → ActivitiesContainer 렌더
│   ├── companies/page.tsx        # 서버 컴포넌트 → CompaniesContainer 렌더
│   ├── factors/page.tsx          # 서버 컴포넌트 → FactorsContainer 렌더
│   ├── docs/page.tsx             # Swagger UI
│   └── api/                      # Next.js API Routes (백엔드)
│       ├── activities/
│       │   ├── route.ts          # GET, POST
│       │   └── [id]/route.ts     # DELETE
│       ├── companies/route.ts    # GET
│       ├── factors/route.ts      # GET
│       └── emission-results/route.ts  # GET
│
├── widgets/                      # 조합형 레이아웃 UI 블록
│   └── layout/
│       ├── hooks/
│       │   └── useLayout.ts      # 회사 목록 로딩
│       └── ui/
│           ├── AppShell.tsx      # 전체 레이아웃 래퍼
│           └── NavigationDrawer.tsx  # 사이드바
│
├── features/                     # 기능 슬라이스 (서로 임포트 금지)
│   ├── dashboard/
│   │   ├── container/
│   │   │   └── DashboardContainer.tsx  # 훅 연결, 섹션별 에러 처리
│   │   ├── hooks/
│   │   │   └── useDashboard.ts   # KPI, 차트 데이터 변환 (useMemo)
│   │   └── ui/                   # props만 받아 렌더링
│   │       ├── KpiCard.tsx
│   │       ├── KpiCardSkeleton.tsx
│   │       ├── EmissionTrendChart.tsx
│   │       ├── ScopeDonutChart.tsx
│   │       ├── CategoryBarChart.tsx
│   │       ├── CarbonGauge.tsx   # 순수 SVG 단일 arc
│   │       └── RecentActivitiesTable.tsx
│   │
│   ├── activities/
│   │   ├── container/
│   │   │   ├── ActivitiesContainer.tsx         # 페이지 전체 로직
│   │   │   ├── ActivityTableContainer.tsx      # 삭제 뮤테이션 + toast
│   │   │   └── ActivityFormDialogContainer.tsx # 생성 뮤테이션 + toast
│   │   └── ui/                   # props만 받아 렌더링
│   │       ├── ActivityForm.tsx
│   │       ├── ActivityFormDialog.tsx
│   │       └── ActivityTable.tsx
│   │
│   ├── companies/
│   │   ├── container/
│   │   │   └── CompaniesContainer.tsx
│   │   └── ui/
│   │       └── CompaniesTable.tsx
│   │
│   └── factors/
│       ├── container/
│       │   └── FactorsContainer.tsx
│       └── ui/
│           └── FactorsTable.tsx
│
├── shared/                       # 전역 공유 (features에서 임포트 가능)
│   ├── ui/                       # shadcn/ui 컴포넌트(수정 금지) + 커스텀 UI
│   │   ├── header.tsx            # 페이지 헤더 (공통)
│   │   ├── query-error-card.tsx  # 에러 격리 + 재시도 버튼
│   │   └── ...                   # shadcn 컴포넌트들
│   │
│   ├── types/                    # Zod 스키마 + z.infer 타입 (유일한 타입 출처)
│   │   ├── activity.ts
│   │   ├── factor.ts
│   │   ├── company.ts
│   │   ├── emission.ts
│   │   └── database.ts
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── calculations.ts
│   │   ├── supabase.server.ts
│   │   ├── openapi.ts
│   │   ├── utils.ts
│   │   └── store/
│   │       ├── filterStore.ts    # 선택된 회사, 날짜 범위
│   │       └── uiStore.ts        # 사이드바 open/close, 테마 (Zustand persist)
│   │
│   ├── constants/
│   │   ├── queryKeys.ts          # QUERY_KEYS (TanStack Query key 상수)
│   │   ├── chartColors.ts        # CHART_COLORS (Scope별, 카테고리별)
│   │   ├── ghgScope.ts           # GHG_SCOPE (활동 유형 → Scope 매핑)
│   │   ├── activityLabels.ts     # ACTIVITY_TYPE_LABELS, SCOPE_BADGE_CLASSES
│   │   └── datasetRange.ts       # DATASET_FROM, DATASET_TO (CT-045 기간)
│   │
│   └── hooks/                    # 전역 서버 상태 훅 (TanStack Query) + UI 훅
│       ├── useActivities.ts      # GET /api/activities + useDeleteActivity
│       ├── useFactors.ts         # GET /api/factors
│       ├── useCompanies.ts       # GET /api/companies
│       ├── useEmissionResults.ts # GET /api/emission-results
│       └── useTheme.ts           # resolvedTheme 계산 (시스템/저장 설정 병합)
│
└── data/
    └── seed.ts                   # Seed 데이터 (정적, 수정 금지)
```

---

## 레이어 의존성 규칙

```
app  →  widgets  →  features  →  shared
                              ↑
                           data (독립)

widgets/A    ✗→  widgets/B    (위젯 간 임포트 금지)
features/A   ✗→  features/B   (슬라이스 간 임포트 금지)
features/*   ✓→  shared/*
widgets/*    ✓→  features/*, shared/*
app/*        ✓→  widgets/*, features/*, shared/*
shared/*     ✗→  다른 레이어 (금지)
```

ESLint `eslint-plugin-boundaries`로 자동 강제.

### FSD에서 entity 레이어를 제외한 이유

이 프로젝트의 도메인 엔티티(Activity, Factor, Company)는 DB 타입과 1:1 대응이 단순하고, 엔티티 간 관계 로직이 복잡하지 않습니다. `shared/types/`의 Zod 스키마가 타입 + 검증 + API 문서의 단일 소스 역할을 하므로 entity 레이어를 별도로 두는 오버헤드 없이 동일한 목적을 달성합니다.

---

## UI / Container 분리 패턴

`features/{slice}/ui/` 컴포넌트는 props만 받아 렌더링. 훅·비즈니스 로직 직접 사용 금지.
`features/{slice}/container/`에서 훅을 연결하고 ui/에 props 주입.

```tsx
// ui/ — 순수 렌더링
export function ActivityTable({ activities, onDelete, isDeleting, deletingId }: Props) { ... }

// container/ — 훅 연결
export function ActivityTableContainer({ activities }: Props) {
  const { mutate: deleteActivity, isPending } = useDeleteActivity();
  return <ActivityTable activities={activities} onDelete={deleteActivity} isDeleting={isPending} ... />;
}
```

---

## 상태 분리 전략

```
UI State (Zustand — shared/lib/store/)
├── uiStore: 사이드바 open/close, 테마 ('light'|'dark'|null, localStorage persist)
└── filterStore: 선택된 회사 ID, 날짜 범위

Server State (TanStack Query — shared/hooks/)
├── useCompanies
├── useActivities
├── useFactors
└── useEmissionResults

Form State (React Hook Form — features/activities/ui/ActivityForm)
```

TanStack Query v5: 초기 로딩 상태는 반드시 `isPending` 사용 (`isLoading` 금지).

---

## 데이터 흐름

```
사용자 입력 (features/activities/ui/ActivityForm)
  → React Hook Form + Zod 검증 (shared/types/activity.ts)
  → features/activities/container/ActivityFormDialogContainer (useMutation)
    → shared/hooks/useActivities (useCreateActivity)
      → shared/lib/api.ts (fetch 호출)
        → app/api/activities/route.ts
          → 지연 시뮬레이션 (200~800ms) + 실패 확률 (15%)
          → Supabase (PostgreSQL)
            → 성공: QUERY_KEYS.activities invalidate → UI 자동 갱신
            → 실패: toast.error
```

---

## 렌더링 전략

| 컴포넌트                | 전략                    | 이유                              |
| ----------------------- | ----------------------- | --------------------------------- |
| `app/*/page.tsx`        | Server Component        | 클라이언트 로직 없음, container에 위임 |
| `features/*/container/` | Client Component        | 훅·상태 사용                      |
| `features/*/ui/`        | Client Component (props only) | 인터랙션 필요                |
| `widgets/layout/`       | Client Component        | 사이드바 open/close 상태          |
| Swagger UI (`/docs`)    | Client Component        | swagger-ui-react가 CSR 전용       |

---

## 성능 최적화 포인트

- `useMemo`: `features/dashboard/hooks/useDashboard.ts`에서 KPI·차트 데이터 변환 (필터 변경 시에만 재계산)
- CarbonGauge: 순수 SVG 단일 arc path (Recharts PieChart 대비 DOM 요소 수십 배 절감)
- `QUERY_KEYS` 상수: 타입 안전한 query key로 잘못된 invalidation 방지
- `QueryErrorCard`: 섹션별 독립 에러 격리로 전체 페이지 crash 방지
