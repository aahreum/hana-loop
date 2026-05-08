# 기능 목록 및 구현 범위

## MVP 범위 (반드시 구현)

### 1. 레이아웃

- [x] Navigation Drawer (사이드 네비게이션)
  - 회사 선택 드롭다운 (로딩 중 스피너 표시)
  - 페이지 링크: Dashboard, Activities, Companies, Factors
  - 반응형: 모바일에서 오버레이 방식
- [x] 헤더: 현재 페이지명, 날짜 범위 필터 (대시보드), 활동 추가 버튼 (활동 페이지)

---

### 2. Dashboard 페이지 (`/dashboard`)

**KPI 카드 (4개)**

- [x] 총 탄소 배출량 (tCO2e)
- [x] 전월 대비 증감률 (% + 방향 표시)
- [x] 최대 배출원 (카테고리명)
- [x] Scope별 요약 (Scope 1/2/3)

**차트**

- [x] 월별 배출 추이 (Area Chart — Scope 1/2/3 스택)
- [x] Scope별 비율 (Donut Chart)
- [x] 월별 카테고리 비교 (Stacked Bar Chart)
- [x] 탄소 관리 등급 게이지 (CarbonGauge — 순수 SVG 단일 arc)

**Activity 요약 테이블**

- [x] 최근 10건 활동 데이터

**에러 처리**

- [x] 섹션별 독립 에러 격리 (`QueryErrorCard`) + "다시 시도" 버튼

---

### 3. Activities 페이지 (`/activities`)

**테이블**

- [x] 전체 활동 데이터 목록
- [x] 컬럼: 날짜, 유형, 설명, 활동량, 단위, Scope, 배출계수
- [x] 정렬: 날짜, 유형, 수량, Scope (클릭 시 오름/내림차순 토글)
- [x] 삭제 기능 (행별 Trash 아이콘)

**Activity 입력 폼**

- [x] 날짜 (date picker)
- [x] 활동 유형 선택
- [x] 설명 (자유 텍스트)
- [x] 배출계수 선택 (유형 연동 필터링)
- [x] 활동량 (숫자)
- [x] 단위 (배출계수 선택 시 자동 입력)
- [x] Scope 자동 결정 (유형에 따라 서버에서 처리)
- [x] 배출량 실시간 미리보기 (활동량 입력 시 자동 계산)
- [x] 저장 성공/실패 toast 처리

---

### 4. Backend (Next.js API Routes + Supabase)

- [x] Next.js API Routes (`app/api/**/route.ts`)
- [x] Supabase (PostgreSQL) 연동
- [x] 네트워크 지연 시뮬레이션 (200~800ms)
- [x] 쓰기 작업 실패 확률 (15%)
- [x] Loading / Error 상태 재현 가능
- [ ] Swagger UI (`/docs` 페이지)

---

### 5. 배출계수 관리 (`/factors`)

- [x] 배출계수 목록 테이블
- [x] 버전 정보 (유효 기간) 표시
- [x] 출처(Source) 표시

---

## 가점 요소 (시간이 남으면 구현)

### Excel/CSV Import (가점 높음)

- [ ] Drag & Drop 업로드 영역
- [ ] XLSX 파싱 (활동 데이터 형식)
- [ ] 업로드 전 테이블 미리보기
- [ ] 검증 에러 행 하이라이트
- [ ] 대시보드 즉시 반영

### Companies 페이지 (`/companies`)

- [x] 회사 목록 테이블 (기본 구현)
- [ ] 회사별 배출량 요약 카드
- [ ] 회사 간 비교 차트

### Dark Mode

- [x] CSS 변수 + `<html>` class 기반 토글 (Sun/Moon 헤더 버튼, Zustand persist, 시스템 설정 폴백)

---

## 구현하지 않는 것 (Trade-off 명시)

| 항목           | 미구현 이유                                                       |
| -------------- | ----------------------------------------------------------------- |
| 실제 인증/권한 | 과제 범위 외. 구조적으로 미들웨어 추가 가능하도록 설계            |
| Docker Compose | Supabase 클라우드 사용으로 로컬 DB 불필요. Next.js 단독 실행 가능 |
| Optimistic Update | 실패 시뮬레이션(15%) 환경에서 UX 혼란 유발. toast + invalidate 방식 채택 |
