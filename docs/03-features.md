# 기능 목록 및 구현 범위

## MVP 범위 (반드시 구현)

### 1. 레이아웃

- [x] Navigation Drawer (사이드 네비게이션)
  - 회사 선택 드롭다운 (로딩 중 스피너 표시)
  - 페이지 링크: Dashboard, Activities, Companies, Factors
  - 반응형: 모바일에서 오버레이 방식
  - **데스크탑 접기/펴기 토글** — PanelLeft 아이콘 + Tooltip, 상태 Zustand persist (`desktopSidebarCollapsed`)
- [x] 헤더: 현재 페이지명, 날짜 범위 필터 (대시보드), 활동 추가 버튼 (활동 페이지)
  - 사이드바 접힘 시 헤더 좌측에 PanelLeft 펼치기 버튼 노출
- [x] **DateRangePicker (Popover)** — 트리거 버튼(현재 범위 표시) + Popover 안에 From/To 직접 선택 + Preset 4개(`전체` / `최근 1개월` / `3개월` / `6개월`)
  - 데이터셋 범위는 `useEmissionResults` 응답에서 동적 추출 (`yearMonth` min/max). hardcoded 상수 없음
  - 빈 from/to = "전체 기간". preset "전체" 클릭 시 빈 값으로 reset → 서버 응답 동적 범위 그대로 사용

### 접근성 (a11y)

- [x] 모든 아이콘 전용 버튼에 `aria-label` 부여 (햄버거, X, PanelLeft, ThemeToggle 등)
- [x] 폼 요소에 `<label htmlFor>` 또는 `aria-label` (회사 select, 날짜 input × 2)
- [x] 색 대비 WCAG AA 4.5:1 충족 — gauge zone darker 톤, `--scope*-text` 라이트/다크 분기, 활동 뱃지 `text-primary-pressed`
- [x] 사이드바 비표시 시 `inert` 속성 — 자식 포커스 차단 (matchMedia로 데스크탑/모바일 분기)
- [x] 활성 메뉴 `aria-current="page"`, 장식 아이콘 `aria-hidden`, `<aside aria-label>`, `<nav aria-label>`

---

### 2. Dashboard 페이지 (`/dashboard`)

> 정보 흐름: **현재 상태 → 원인 파악 → 개선 방향**.
> 데이터 시각화 중심이 아니라 비전문가도 즉시 해석 가능한 의사결정 보조 대시보드.

**1. 현재 상태 — KPI 카드 (4개)**

- [x] 총 배출량 (tCO₂e) — 누적 + 기간 표시
- [x] 전월 대비 증감률 (% + 방향 + 톤 stripe + 해석 문구)
- [x] 최대 배출원 (활동명 + 비중 해석 — "배출량의 X%가 ○○에서 발생")
- [x] 최대 배출 시점 (월 + "기간 내 가장 많이 배출된 월")
- [x] tCO₂e 단위 보조 툴팁 (의미 + 실생활 비교)
- [x] 톤 기반 시각 강조: warn = red 아이콘+stripe, good = green, neutral = gray

**2. 원인 파악 — 원인 분석**

- [x] 활동 유형별 비중 도넛 (전기/원소재/운송 — Scope에서 활동 중심으로 전환. 과제 스펙 기반 3개 카테고리)
- [x] 도넛 카드에 "계산식 ?" 툴팁: `배출량 = 활동량 × 배출계수` 공식 안내 (활동량 ≠ 최대 배출원 명시)
- [x] 도넛 하단 요약 인사이트: 최대 활동 비중 자동 메시지
- [x] 월별 배출량 추이 — 활동 유형별 stacked area (전체 흐름 + 원인 동시 파악)
- [x] 추이 차트 하단 자동 분석 (최대 3개): 증가 활동 / 안정 유지 / 감소 추세
- [x] 도넛/추이 차트 색상 일치 (`ACTIVITY_TYPES` 원본 인덱스 기준 고정)

**3. 개선 방향 — 개선 포인트**

- [x] 탄소 관리 등급 게이지 (CarbonGauge — 순수 SVG 단일 arc, 0–100점)
- [x] 등급 분석 인사이트: 등급 사유 + 업계 평균 비교 (변화율 + 최대 활동 비중 휴리스틱)
- [x] 감축 제안 카드 — 활동별 절감 시뮬레이션 (월/연 tCO₂e 절감 예상치)
- [x] 메시지 안 "연간 X tCO₂e 감소 가능" 구간을 trend-down(green) + bold로 자동 강조

**4. 최근 활동 데이터**

- [x] 최근 10건 활동 데이터 + 활동 페이지로 이동 링크
- [x] Scope 컬럼 헤더 도움말 툴팁 (Scope 1/2/3 정의 인라인 설명)

**자동 인사이트 (`shared/lib/insights.ts`)**

- [x] 룰 기반 메시지 생성 — 데이터 변동에 따라 항상 최신 상태 유지
- [x] tone(`good`/`warn`/`neutral`) 시스템으로 시각적 톤 일관성 확보
- [x] InsightList에서 `\d+%[↓↑]?` 패턴 자동 감지 → `<strong>` 강조

**에러 처리**

- [x] 섹션별 독립 에러 격리 (`QueryErrorCard`) + "다시 시도" 버튼

---

### 3. Activities 페이지 (`/activities`)

**테이블**

- [x] 전체 활동 데이터 목록
- [x] 컬럼: 날짜, 유형, 설명, 활동량, 단위, Scope, 배출계수
- [x] 정렬: 날짜, 유형, 수량, Scope (데스크탑은 컬럼 헤더 클릭, 모바일 카드 뷰는 상단 Select + 방향 토글 버튼). 정렬 상태는 `useActivitySort` hook 으로 추출되어 두 뷰가 동일 상태 공유
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
| ~~Optimistic Update 전체 미채택~~ | 삭제는 채택(클릭 즉시 행 제거 + 실패 시 캐시 스냅샷 롤백). 생성은 jitter 동안 폼 dialog 가 닫히지 않아 dim 효과가 없으므로 invalidate 방식 유지 |
