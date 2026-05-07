# 기능 목록 및 구현 범위

## MVP 범위 (반드시 구현)

### 1. 레이아웃

- [ ] Navigation Drawer (사이드 네비게이션)
  - 회사 선택 드롭다운
  - 페이지 링크: Dashboard, Activities, Companies, Factors
  - 반응형: 모바일에서 오버레이 방식
- [ ] 헤더: 현재 페이지명, 날짜 범위 필터

---

### 2. Dashboard 페이지 (`/dashboard`)

**KPI 카드 (4개)**

- [ ] 총 탄소 배출량 (tCO2e)
- [ ] 전월 대비 증감률 (% + 방향 표시)
- [ ] 최대 배출원 (카테고리명)
- [ ] Scope별 요약 (Scope 1/2/3)

**차트**

- [ ] 월별 배출 추이 (Line Chart)
- [ ] 카테고리별 비율 (Donut Chart)
- [ ] 월별 카테고리 비교 (Stacked Bar Chart)

**Activity 요약 테이블**

- [ ] 최근 5건 활동 데이터
- [ ] 날짜 / 유형 / 활동량 / 배출량 표시

---

### 3. Activities 페이지 (`/activities`)

**테이블**

- [ ] 전체 활동 데이터 목록
- [ ] 컬럼: 날짜, 유형, 설명, 활동량, 단위, 배출량(kgCO2e), Scope
- [ ] 필터: 날짜 범위, 유형, Scope
- [ ] 정렬: 날짜, 배출량

**Activity 입력 폼**

- [ ] 날짜 (yearMonth picker)
- [ ] 활동 유형 선택
- [ ] 설명 (자유 텍스트)
- [ ] 활동량 (숫자, 양수만)
- [ ] 단위 선택
- [ ] Scope 자동 결정 (유형에 따라)
- [ ] 배출량 실시간 미리보기 (활동량 입력 시 자동 계산)
- [ ] 저장 성공/실패 처리

**에러 처리**

- [ ] 숫자 외 입력 방지
- [ ] 음수 방지
- [ ] 필수값 누락 표시
- [ ] 저장 실패 시 toast + 재시도 버튼

---

### 4. Backend (Next.js API Routes + Supabase)

- [ ] Next.js API Routes (`app/api/**/route.ts`)
- [ ] Supabase (PostgreSQL) 연동
- [ ] 네트워크 지연 시뮬레이션 (200~800ms) — API Route 레이어에서 적용
- [ ] 쓰기 작업 실패 확률 (15%) — API Route 레이어에서 적용
- [ ] Loading / Error 상태 재현 가능
- [ ] Optimistic Update + 실패 시 롤백
- [ ] Swagger UI (`/docs` 페이지)

---

### 5. 배출계수 관리 (`/factors`)

- [ ] 배출계수 목록 테이블
- [ ] 버전 정보 (유효 기간) 표시
- [ ] 출처(Source) 표시

---

## 가점 요소 (시간이 남으면 구현)

### Excel/CSV Import (가점 높음)

- [ ] Drag & Drop 업로드 영역
- [ ] CSV 파싱 (활동 데이터 형식)
- [ ] 업로드 전 테이블 미리보기
- [ ] 검증 에러 행 하이라이트

### Companies 페이지 (`/companies`)

- [ ] 회사 목록
- [ ] 회사별 배출량 요약 카드
- [ ] 회사 간 비교 차트

### Post/Notes 기능

- [ ] 특정 월에 메모 첨부
- [ ] 이슈 기록 (예: "이번 달 공장 증설로 배출량 급증")

### Dark Mode

- [ ] Tailwind `dark:` 클래스 기반

---

## 구현하지 않는 것 (Trade-off 명시)

| 항목           | 미구현 이유                                                       |
| -------------- | ----------------------------------------------------------------- |
| 실제 인증/권한 | 과제 범위 외. 구조적으로 미들웨어 추가 가능하도록 설계            |
| Docker Compose | Supabase 클라우드 사용으로 로컬 DB 불필요. Next.js 단독 실행 가능 |
