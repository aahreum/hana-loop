# 구현 계획

## 시간 배분 (총 10시간 기준)

| 단계 | 작업 | 예상 시간 |
|------|------|----------|
| 1 | 프로젝트 세팅 | 0.5h |
| 2 | Supabase 스키마 + 타입 + API Routes + OpenAPI | 1.5h |
| 3 | 레이아웃 (Drawer + 헤더) | 1h |
| 4 | Dashboard 페이지 | 2.5h |
| 5 | Activities 페이지 + 폼 | 2.5h |
| 6 | Factors 페이지 | 0.5h |
| 7 | 반응형 + 에러/로딩 처리 | 1h |
| 8 | README 작성 + 정리 | 0.5h |

---

## 단계별 구현 순서

### 1단계: 프로젝트 세팅 (0.5h)

```bash
npx create-next-app@15 hanaloop-dashboard \
  --typescript --tailwind --app --src-dir

cd hanaloop-dashboard

# 의존성 설치
npm install zustand @tanstack/react-query react-hook-form zod recharts
npm install @hookform/resolvers
npm install @supabase/supabase-js
npm install @asteasolutions/zod-to-openapi swagger-ui-react swagger-ui-dist
npm install -D @types/swagger-ui-react
npx shadcn@latest init
npx shadcn@latest add button input select card badge toast dialog
```

`.env.local` 생성:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Git 초기화 후 첫 커밋.

---

### 2단계: Supabase 스키마 + 타입 + API Routes + OpenAPI (1.5h)

**순서:**
1. Supabase Dashboard → SQL Editor에서 스키마 실행 (`08-backend-setup.md` 참고)
2. `npx supabase gen types typescript ...` → `src/types/database.ts` 자동 생성
3. `src/types/` — 도메인 타입 정의 (database.ts 기반으로 확장)
4. `src/lib/supabase.ts` / `src/lib/supabase.server.ts` — 클라이언트 생성
5. `src/app/api/**/route.ts` — API Routes 구현 (지연/실패 시뮬레이션 포함)
6. `src/lib/calculations/emissions.ts` — 순수 계산 함수
7. `src/lib/validations/activity.ts` — Zod 스키마 (`zod-to-openapi` 형식)
8. `src/lib/openapi.ts` — Zod 스키마에서 OpenAPI spec 자동 생성
9. `src/app/docs/page.tsx` — Swagger UI 렌더링
10. `src/lib/api/` — API 클라이언트 함수 (fetch → API Routes 호출)

---

### 3단계: 레이아웃 (1h)

**순서:**
1. `src/components/layout/NavigationDrawer.tsx`
   - 링크 목록, 회사 선택 드롭다운
   - 모바일 오버레이 처리
2. `src/components/layout/Header.tsx`
   - 페이지 제목, 날짜 범위 필터
3. `src/app/layout.tsx` — Drawer + Header 통합
4. `src/lib/store/uiStore.ts` — drawer open 상태
5. `src/lib/store/filterStore.ts` — 선택 회사, 날짜 범위

---

### 4단계: Dashboard 페이지 (2.5h)

**순서:**
1. KPI 카드 컴포넌트 4개 (Suspense로 감싸기)
2. `src/lib/hooks/useEmissions.ts` — TanStack Query 훅
3. 월별 추이 Line Chart
4. 카테고리별 Donut Chart
5. Stacked Bar Chart
6. Activity 요약 테이블 (최근 5건)
7. `src/app/dashboard/page.tsx` — 조합

---

### 5단계: Activities 페이지 + 폼 (2.5h)

**순서:**
1. `src/lib/hooks/useActivities.ts`
2. Activity 테이블 (필터 + 정렬)
3. Activity 입력 폼 컴포넌트
   - React Hook Form + Zod
   - 배출량 실시간 미리보기
   - 저장 Mutation (Optimistic Update)
4. 에러 Toast
5. `src/app/activities/page.tsx`

---

### 6단계: Factors 페이지 (0.5h)

1. 배출계수 테이블 (카테고리, 계수, 단위, 유효기간, 출처)
2. `src/app/factors/page.tsx`

---

### 7단계: 반응형 + 에러/로딩 처리 (1h)

1. 모바일 반응형 점검 (Drawer 오버레이, 카드 그리드)
2. `ErrorBoundary` 컴포넌트
3. 스켈레톤 로딩 (KPI 카드, 차트)
4. Toast 시스템 통합

---

### 8단계: README + 정리 (1h)

1. README.md 작성
2. Git 커밋 히스토리 정리 (의미 있는 단위로)
3. 최종 동작 확인

---

## Git 커밋 전략

의미 있는 단위로 커밋 (기능 단위):

```
feat: initialize Next.js 15 project with TypeScript and Tailwind
feat: set up Supabase schema and auto-generated types
feat: add domain types and Zod validation schemas
feat: implement Next.js API routes with delay and failure simulation
feat: generate OpenAPI spec from Zod schemas and add Swagger UI
feat: add emission calculation utilities
feat: add navigation drawer and header layout
feat: implement dashboard KPI cards with suspense
feat: add monthly emission trend line chart
feat: add category breakdown donut chart
feat: add stacked bar chart for monthly category comparison
feat: implement activities table with filter and sort
feat: add activity input form with real-time emission preview
feat: add optimistic update with rollback on failure
feat: add emission factors management page
fix: mobile responsive layout for drawer
feat: add skeleton loading and error boundary
docs: write README with architecture explanation
```

---

## 설계 결정 및 Trade-off 기록

| 결정 | 이유 | Trade-off |
|------|------|----------|
| Next.js API Routes + Supabase | 실제 영속성, 가점 요소 충족 | Fake API 대비 세팅 시간 추가 (~30분) |
| zod-to-openapi로 Swagger 자동 생성 | Zod 스키마가 유효성 검증 + API 문서의 단일 소스 | 스키마 작성 방식이 일반 Zod와 다소 다름 |
| Recharts 선택 | React 친화적, SSR 이슈 없음 | Visx보다 커스터마이징 제한적 |
| Zustand로 UI/Filter 상태 분리 | TanStack Query와 역할 명확히 구분 | Context API보다 boilerplate 줄어듦 |
| ActivityData와 EmissionResult 분리 | 계산 로직 변경 시 재계산 가능, 감사 추적 | 데이터 양 증가 |
| 배출계수 버전 관리 (validFrom/validTo) | 과거 계산 재현, 규정 변경 대응 | 구현 복잡도 증가 |
| shadcn/ui 선택 | MUI 금지 조건, Headless로 디자인 자유도 확보 | 초기 컴포넌트 셋업 시간 필요 |
