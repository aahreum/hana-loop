# 과제 스펙 — Frontend Developer 과제: 탄소 배출 대시보드

> 이 문서는 HanaLoop로부터 제공받은 원본 과제 요구사항입니다.
> 모든 설계 결정의 최우선 근거이며, CLAUDE.md와 충돌 시 이 문서를 기준으로 합니다.

---

## 과제 목적

- 실제 서비스 수준을 고려한 웹 애플리케이션 설계 및 구현 능력
- 좋은 개발 및 UI/UX 관행 적용 능력
- 단순 기능 구현이 아닌 **제품적 사고(Product Thinking)와 디자인 판단 능력**

> 기능 수보다 "왜 그렇게 설계했는지"에 대한 고민과 trade-off를 더 중요하게 봄

---

## 구현 요구사항

기본 웹 기반 **탄소(온실가스) 배출 대시보드**:

- Navigation Drawer (사이드 네비게이션)
- Main Content Area (메인 콘텐츠 영역)
- 배출 데이터 시각화

대상 사용자: 기업 임원 및 관리자 — 탄소 배출량 파악 + 탄소세 계획

---

## 핵심 흐름

```
활동 데이터 입력 → 배출계수 조회 → 탄소 배출량 계산 → 결과 저장 → 대시보드 시각화
```

---

## 데이터 모델 (제공 spec)

```ts
type Company = {
  id: string;
  name: string;
  country: string; // Country.code
  emissions: GhgEmission[];
};

type GhgEmission = {
  yearMonth: string; // "2025-01"
  source: string; // gasoline, lpg, diesel 등
  emissions: number; // CO2 배출량 (톤 단위)
};

type Post = {
  id: string;
  title: string;
  resourceUid: string; // Company.id
  dateTime: string; // "2024-02"
  content: string;
};
```

---

## Fake Backend 요구사항

직접 구현해야 하는 API 모듈:

- 네트워크 지연 (200~800ms)
- 쓰기 작업 실패 확률 (10~20%)

```ts
// lib/api.ts 예시 구조
let _companies = [...companies];
let _posts = [...posts];
const jitter = () => 200 + Math.random() * 600;
const maybeFail = () => Math.random() < 0.15;
```

테스트 대상: Loading 상태 / Error 상태 / Partial Failure / Rollback 처리

---

## 평가 항목

| 항목                      | 비율 |
| ------------------------- | ---- |
| 창의성과 문제 해결 사고   | 25%  |
| UI/UX 디자인 및 미적 감각 | 25%  |
| UI 엔지니어링             | 20%  |
| 소프트웨어 엔지니어링     | 20%  |
| 코드 품질                 | 10%  |

### UI 엔지니어링 세부

- 반응형 레이아웃
- Loading/Error 상태 처리
- **Layout/UI State, Filter State, Data State 분리** ← 중요

---

## 추천 구현 범위 (MVP)

### 1. Dashboard 페이지

- KPI 카드 (총 배출량, 전월 대비 증감률, 최대 배출원, Scope별)
- 월별 배출량 추이 라인 차트
- 카테고리별 비율 파이/도넛 차트
- 월별 카테고리 비교 Stacked Bar Chart
- Activity 데이터 테이블

### 2. Activity 입력 폼

입력 항목: 날짜 / 활동 유형 / 설명 / 활동량 / 단위

### 3. 에러 처리 (필수)

- 숫자 외 입력 방지
- 음수 입력 방지
- 필수값 누락 처리
- 저장 실패 상태 처리

---

## 추가 가점 요소

| 항목                        | 설명                                                                       |
| --------------------------- | -------------------------------------------------------------------------- |
| **Excel Import**            | 제공된 Excel 데이터 drag & drop → CSV/XLSX 파싱 → 테이블 preview → DB 저장 |
| **PostgreSQL 연동**         | Supabase / Prisma / PostgreSQL                                             |
| **ERD / 스키마 다이어그램** | README에 포함                                                              |
| Docker Compose              | 즉시 실행 가능한 환경                                                      |
| OpenAPI / Swagger           | 백엔드 협업 관점                                                           |

---

## 기술 제약

- Next.js 14+ App Router, React 18, TypeScript
- MUI / Ant Design 같은 무거운 UI 라이브러리 **금지**
- shadcn/ui, headless UI 같은 경량 유틸 **허용**
- 기본적인 디자인 시스템 필수

---

## 제출물

- 실행 가능한 Next.js 앱
- README (프로젝트 소개, 실행 방법, 테스트 방법)
- 권장 추가: 가정 및 설계 결정, 아키텍처 설명, 상태 관리 및 데이터 흐름, 렌더링 최적화, trade-off, 디자인 의도

---

## 발표 시 필수 설명 항목

- 상태를 왜 그렇게 분리했는가
- 테이블 구조를 왜 그렇게 설계했는가
- 차트를 왜 그렇게 구성했는가
- 어떤 trade-off가 있었는가
- AI를 어디에 활용했고 어떤 부분은 직접 판단했는가

---

## 제한 시간

- 집중 작업량: **8~12시간**
- 총 수행 기간: **3일 이내**
- 전체적인 디자인은 본인의 창작이어야 함
