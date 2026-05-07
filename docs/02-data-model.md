# 데이터 모델

## 핵심 설계 원칙

1. **활동 데이터와 계산 결과를 분리**: 계산 로직 변경 시 재계산 가능, 감사 추적 가능
2. **배출계수 버전 관리**: `valid_from` / `valid_to`로 과거 계산 재현 가능
3. **Scope 분류 포함**: Scope 1/2/3 구분은 실무 탄소 회계의 핵심

## 타입 정의

### 제공된 기본 타입

```ts
// types/company.ts
type Company = {
  id: string;
  name: string;
  country: string; // Country.code (e.g. "KR", "US")
  emissions: GhgEmission[];
};

// types/emission.ts
type GhgEmission = {
  yearMonth: string;   // "2025-01"
  source: string;      // "gasoline" | "lpg" | "diesel" | "electricity" | ...
  emissions: number;   // CO2 배출량 (톤 단위)
};

// types/post.ts
type Post = {
  id: string;
  title: string;
  resourceUid: string; // Company.id
  dateTime: string;    // "2024-02"
  content: string;
};
```

### 확장 타입

```ts
// types/activity.ts
type ActivityType = "electricity" | "raw_material" | "transport" | "fuel" | "waste";

type Scope = 1 | 2 | 3;

type ActivityData = {
  id: string;
  companyId: string;
  yearMonth: string;       // "2025-01"
  type: ActivityType;
  description: string;     // "한국전력", "플라스틱1", "트럭" 등
  quantity: number;        // 활동량
  unit: string;            // "kWh", "kg", "ton-km" 등
  scope: Scope;
  createdAt: string;
};

// types/factor.ts
type EmissionFactor = {
  id: string;
  category: string;        // "electricity", "plastic1" 등
  factor: number;          // 배출계수 (kgCO2e/unit)
  unit: string;
  scope: Scope;
  validFrom: string;       // "2024-01"
  validTo: string | null;  // null = 현재 유효
  source: string;          // 출처 (e.g. "IPCC 2021", "환경부")
};

// types/result.ts
type EmissionResult = {
  id: string;
  activityId: string;
  factorId: string;
  companyId: string;
  yearMonth: string;
  quantity: number;
  factor: number;
  emissionKgCO2e: number;  // quantity × factor
  scope: Scope;
  calculatedAt: string;
};
```

## ERD (논리적 구조)

```
Company (1) ──────< ActivityData (N)
                        │
                        │ factorId
                        ▼
                   EmissionFactor (1)
                        │
                        │ (계산 결과)
                        ▼
                   EmissionResult (N)

Company (1) ──────< Post (N)
```

## 계산 공식

```ts
// lib/calculations/emissions.ts
export function calculateEmission(
  quantity: number,
  factor: number
): number {
  return quantity * factor; // 단위: kgCO2e
}

export function kgToTon(kg: number): number {
  return kg / 1000;
}
```

## Seed Data 구조

### 배출계수 예시

| 카테고리 | 계수 | 단위 | Scope |
|----------|------|------|-------|
| 전기(한국) | 0.4567 | kgCO2e/kWh | 2 |
| 플라스틱(일반) | 2.3 | kgCO2e/kg | 3 |
| 경유 | 2.68 | kgCO2e/L | 1 |
| 트럭(육상) | 0.092 | kgCO2e/ton-km | 3 |
| LNG | 2.2 | kgCO2e/kg | 1 |

### 활동 데이터 예시

| 날짜 | 회사 | 유형 | 설명 | 활동량 | 단위 | 배출량(kgCO2e) |
|------|------|------|------|--------|------|----------------|
| 2025-01 | Acme Corp | 전기 | 한국전력 | 110 | kWh | 50.24 |
| 2025-01 | Acme Corp | 원소재 | 플라스틱1 | 230 | kg | 529 |
| 2025-01 | Acme Corp | 운송 | 트럭 | 41 | ton-km | 3.77 |
