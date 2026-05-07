# 아키텍처 설계

## 기술 스택

| 레이어 | 기술 | 선택 이유 |
|--------|------|----------|
| 프레임워크 | Next.js 15 App Router | 요구사항(14+). RSC로 초기 로딩 최적화, 최신 캐싱 API 활용 |
| 언어 | TypeScript | 요구사항. 도메인 복잡도 상 타입 안정성 필수 |
| 스타일링 | Tailwind CSS | 빠른 반응형 구현, 디자인 토큰 일관성 |
| UI 컴포넌트 | shadcn/ui | 요구사항 허용. Headless + 스타일 자유도 |
| 상태 관리 | Zustand + TanStack Query | UI/서버 상태 명확히 분리 |
| 폼 | React Hook Form + Zod | 유효성 검증 + 타입 추론 |
| 차트 | Recharts | React 친화적, 경량, 커스터마이징 용이 |
| DB | Supabase (PostgreSQL) | 호스팅 PostgreSQL. 무료 티어. 타입 자동 생성 |
| API 문서 | zod-to-openapi + swagger-ui-react | Zod 스키마 → OpenAPI spec 자동 생성. 코드가 곧 문서 |

---

## 프로젝트 구조 (FSD, entity 레이어 제외)

Feature-Sliced Design 3-layer 구조. `features/` 간 상호 임포트 금지.

```
src/
├── app/                          # Next.js App Router (라우팅만)
│   ├── layout.tsx                # Root layout (Drawer 조합)
│   ├── page.tsx                  # redirect → /dashboard
│   ├── dashboard/page.tsx
│   ├── activities/page.tsx
│   ├── companies/page.tsx
│   ├── factors/page.tsx
│   ├── docs/page.tsx             # Swagger UI
│   └── api/                      # Next.js API Routes (백엔드)
│       ├── activities/
│       │   ├── route.ts          # GET, POST
│       │   └── [id]/route.ts     # DELETE
│       ├── companies/route.ts    # GET
│       ├── factors/route.ts      # GET
│       └── emission-results/route.ts  # GET
│
├── features/                     # 기능 슬라이스 (서로 임포트 금지)
│   ├── dashboard/
│   │   ├── ui/                   # KPI 카드, 차트, 요약 테이블 (props만, 훅 금지)
│   │   │   ├── KpiCard.tsx
│   │   │   ├── EmissionTrendChart.tsx
│   │   │   ├── CategoryDonutChart.tsx
│   │   │   ├── ScopedBarChart.tsx
│   │   │   └── ActivitySummaryTable.tsx
│   │   └── hooks/
│   │       └── useDerivedEmissions.ts  # 차트용 데이터 변환 (useMemo 포함)
│   │
│   ├── activities/
│   │   ├── ui/                   # 폼, 테이블, 다이얼로그 (props만, 훅 금지)
│   │   │   ├── ActivityForm.tsx
│   │   │   ├── ActivityFormDialog.tsx
│   │   │   └── ActivityTable.tsx
│   │   └── hooks/
│   │       ├── useCreateActivity.ts
│   │       └── useDeleteActivity.ts
│   │
│   ├── companies/
│   │   ├── ui/
│   │   │   ├── CompanyCard.tsx
│   │   │   └── CompanySelector.tsx   # Drawer용 회사 선택 드롭다운
│   │   └── hooks/
│   │       └── useCompanyFilter.ts
│   │
│   └── factors/
│       └── ui/
│           └── FactorsTable.tsx
│
├── shared/                       # 전역 공유 (features에서 임포트 가능)
│   ├── ui/                       # shadcn/ui 컴포넌트 (수정 금지)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   └── toast.tsx
│   │
│   ├── types/                    # Zod 스키마 + z.infer 타입 (유일한 타입 출처)
│   │   ├── activity.ts           # CreateActivitySchema, ActivitySchema
│   │   ├── factor.ts             # EmissionFactorSchema
│   │   ├── company.ts            # CompanySchema
│   │   ├── emission.ts           # EmissionResultSchema
│   │   └── database.ts           # Supabase 자동 생성 타입
│   │
│   ├── lib/
│   │   ├── api.ts                # fetch → API Routes 호출 (전체 엔드포인트)
│   │   ├── calculations.ts       # 배출량 계산 순수 함수
│   │   ├── supabase.ts           # Supabase 브라우저 클라이언트
│   │   ├── supabase.server.ts    # Supabase 서버 전용 클라이언트
│   │   ├── openapi.ts            # zod-to-openapi spec 생성
│   │   └── utils.ts              # cn(), formatNumber() 등
│   │
│   ├── constants/
│   │   ├── queryKeys.ts          # QUERY_KEYS (TanStack Query key 상수)
│   │   ├── chartColors.ts        # CHART_COLORS (Scope별, 카테고리별)
│   │   └── ghgScope.ts           # GHG_SCOPE (Scope 1/2/3 매핑 테이블)
│   │
│   └── hooks/                    # 전역 서버 상태 훅 (TanStack Query)
│       ├── useActivities.ts      # GET /api/activities
│       ├── useEmissionFactors.ts # GET /api/factors
│       ├── useCompanies.ts       # GET /api/companies
│       └── useEmissionResults.ts # GET /api/emission-results
│
└── data/
    └── seed.ts                   # Seed 데이터 (정적, 수정 금지)
```

---

## 레이어 의존성 규칙

```
app  →  features  →  shared
 ↑          ↑
 └──────────┘
  (단방향, 역방향 금지)

features/dashboard  ✗→  features/activities  (슬라이스 간 임포트 금지)
features/*          ✓→  shared/*
app/*               ✓→  features/*, shared/*
```

### FSD에서 entity 레이어를 제외한 이유

이 프로젝트의 도메인 엔티티(Activity, Factor, Company)는 DB 타입과 1:1 대응이 단순하고, 엔티티 간 관계 로직이 복잡하지 않습니다. `shared/types/`의 Zod 스키마가 타입 + 검증 + API 문서의 단일 소스 역할을 하므로 entity 레이어를 별도로 두는 오버헤드 없이 동일한 목적을 달성합니다.

---

## 상태 분리 전략

```
UI State (Zustand — shared/lib/store 또는 features 내 지역 상태)
├── drawer open/close
├── modal open/close
└── 선택된 회사 ID

Filter State (Zustand)
├── 날짜 범위 (yearMonth from/to)
├── 활동 유형 필터
└── Scope 필터

Server State (TanStack Query — shared/hooks/)
├── companies
├── activities
├── emission_factors    ← staleTime 길게 (자주 안 바뀜)
└── emission_results

Form State (React Hook Form — features/activities/ui/)
└── ActivityForm 내부
```

---

## 데이터 흐름

```
사용자 입력 (features/activities/ui/ActivityForm)
  → React Hook Form + Zod 검증 (shared/types/activity.ts)
  → features/activities/hooks/useCreateActivity (useMutation)
    → shared/lib/api.ts (fetch 호출)
      → app/api/activities/route.ts
        → 지연 시뮬레이션 (200~800ms) + 실패 확률 (15%)
        → Supabase (PostgreSQL)
          → 성공: QUERY_KEYS.activities invalidate → UI 자동 갱신
          → 실패: Toast + Optimistic Update 롤백
```

---

## 렌더링 전략

| 컴포넌트 | 전략 | 이유 |
|----------|------|------|
| Dashboard 차트 | Client Component + dynamic import | 인터랙션 필요, SSR 불필요 |
| KPI 카드 | Client Component + Suspense | 데이터 로딩 경계 분리 |
| Navigation Drawer | Client Component | open/close 상태 |
| Activity 테이블 | Client Component | 필터·정렬 인터랙션 |
| Swagger UI (`/docs`) | Client Component | swagger-ui-react가 CSR 전용 |

---

## 성능 최적화 포인트

- `useMemo`: `features/dashboard/hooks/useDerivedEmissions.ts`에서 차트 데이터 변환 메모이제이션 (필터 변경 시에만 재계산)
- `dynamic import`: Recharts (SSR 불필요, 번들 지연 로딩)
- TanStack Query `staleTime`:
  - `emission_factors`: 5분 (규정이 자주 안 바뀜)
  - `activities`: 30초
- React `Suspense` + `ErrorBoundary`: KPI 카드, 차트 단위로 로딩/에러 경계 분리
- `QUERY_KEYS` 상수: 타입 안전한 query key로 잘못된 invalidation 방지
