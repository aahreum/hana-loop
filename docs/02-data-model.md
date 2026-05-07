# 데이터 모델

## 핵심 설계 원칙

1. **활동 데이터와 계산 결과를 분리**: 계산 로직 변경 시 재계산 가능, 감사 추적 가능
2. **배출계수 버전 관리**: `valid_from` / `valid_to`로 과거 계산 재현 가능
3. **Scope 분류 포함**: Scope 1/2/3 구분은 실무 탄소 회계의 핵심
4. **원본 날짜 보존**: `date` (YYYY-MM-DD)를 그대로 저장, `year_month`는 DB generated column으로 파생

## 타입 정의

### 기본 타입 (spec 기준)

```ts
// shared/types/company.ts
type Company = {
  id: string;
  name: string;
  country: string; // ISO 2자리 코드 (예: "KR", "US")
};

// shared/types/emission.ts — API 응답 임베드용 집계 타입
type GhgEmission = {
  yearMonth: string; // "2025-01"
  source: string; // activity.description (예: "한국전력", "플라스틱 1")
  emissions: number; // tCO2e (= emission_kg_co2e / 1000)
  scope: 1 | 2 | 3;
};
// → GET /api/companies/:id 응답에서 Company.emissions[] 로 임베드됨
// → DB에 저장되지 않음. emission_results를 집계하여 변환

// shared/types/post.ts
type Post = {
  id: string;
  title: string;
  resourceUid: string; // Company.id
  dateTime: string; // "YYYY-MM" (예: "2025-01")
  content: string;
  createdAt: string;
};
```

### 확장 타입

```ts
// shared/types/activity.ts
type ActivityType =
  | 'electricity'
  | 'fuel'
  | 'raw_material'
  | 'transport'
  | 'waste';
type Scope = 1 | 2 | 3;

// scope는 클라이언트가 보내지 않음 — RPC(create_activity_with_emission)가
// emission_factors.scope에서 자동 결정하여 저장
type CreateActivityInput = {
  companyId: string;
  date: string; // "YYYY-MM-DD" — Excel 원본 날짜 그대로
  type: ActivityType;
  description: string; // "한국전력", "플라스틱 1", "트럭" 등
  factorCategory: string; // emission_factors.category 참조 (예: "electricity_kepco")
  quantity: number;
  unit: string; // "kWh", "kg", "ton-km" 등
};

type ActivityData = CreateActivityInput & {
  id: string;
  yearMonth: string; // "YYYY-MM" — DB generated column (date에서 자동 파생)
  scope: Scope;       // DB 응답에 포함 — RPC에서 배출계수 기반으로 결정됨
  createdAt: string;
};

// shared/types/factor.ts
type EmissionFactor = {
  id: string;
  category: string; // 머신 키: "electricity_kepco", "raw_material_plastic1"
  name: string; // 레이블: "전기 (한국전력 기본값)"
  activityType: ActivityType;
  factor: number; // 배출계수 (kgCO2e/unit)
  unit: string;
  scope: Scope;
  validFrom: string; // "YYYY-MM"
  validTo: string | null; // null = 현재 유효 계수
  source: string; // "IPCC 2021", "한국 환경부 2023" 등
};

// shared/types/emission.ts
type EmissionResult = {
  id: string;
  activityId: string;
  factorId: string;
  companyId: string;
  yearMonth: string;
  quantity: number;
  factor: number;
  emissionKgCo2e: number; // quantity × factor
  scope: Scope;
  calculatedAt: string;
};
```

## ERD (논리적 구조)

```
companies (1) ──────────< activities (N)
                              │
                              │ factor_category → emission_factors.category
                              ▼
                         emission_factors (1)
                              │
                              │ (계산 결과)
                              ▼
                         emission_results (N)

companies (1) ──────────< posts (N)
```

## DB 스키마 요점

| 테이블             | 주요 컬럼                                                                 | 특이사항                                                                |
| ------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `companies`        | id, name, country                                                         | -                                                                       |
| `emission_factors` | category, name, activity_type, factor, valid_from, valid_to               | valid_to IS NULL = 현재 유효. category별 active 1개 강제 (unique index) |
| `activities`       | date, year_month(generated), type, description, factor_category, quantity | date = YYYY-MM-DD 원본. year_month = 자동 생성. 불변                    |
| `emission_results` | emission_kg_co2e, scope, calculated_at                                    | activity_id UNIQUE. 배출계수 변경 시 재계산 가능                        |
| `posts`            | title, resource_uid, date_time, content                                   | date_time = "YYYY-MM" 형식                                              |

## 계산 공식

```ts
// shared/lib/calculations.ts
calculateEmission(quantity, factor); // → quantity × factor (kgCO2e)
kgToTon(kg); // → kg / 1000 (tCO2e)
calcChangeRate(current, previous); // → 전월 대비 증감률 (%)
```

## Seed Data 배출계수 (CT-045 기준)

| 카테고리              | 계수  | 단위          | Scope |
| --------------------- | ----- | ------------- | ----- |
| electricity_kepco     | 0.456 | kgCO2e/kWh    | 2     |
| raw_material_plastic1 | 2.3   | kgCO2e/kg     | 3     |
| raw_material_plastic2 | 3.2   | kgCO2e/kg     | 3     |
| transport_truck       | 3.5   | kgCO2e/ton-km | 3     |
| fuel_diesel           | 2.68  | kgCO2e/L      | 1     |
| waste_general         | 0.58  | kgCO2e/kg     | 3     |

> electricity_kepco는 2024-01~2024-12 이력(0.459)과 2025-01~현재(0.456) 두 버전이 seed에 포함됨
