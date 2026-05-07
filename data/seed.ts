// 정적 Seed 데이터 — 수정 금지. Supabase 초기 삽입용.
// SQL: supabase/seed.sql 에서 INSERT로 변환하여 사용.

import type { Company } from '@/shared/types/company';
import type { EmissionFactor } from '@/shared/types/factor';
import type { ActivityData } from '@/shared/types/activity';

export const companies: Company[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Acme Corp',
    country: 'KR',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'GreenTech Inc',
    country: 'KR',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

export const emissionFactors: EmissionFactor[] = [
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    category: 'electricity',
    factor: 0.4567,
    unit: 'kgCO2e/kWh',
    scope: 2,
    validFrom: '2024-01',
    validTo: null,
    source: '한국 환경부 2023',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000002',
    category: 'fuel',
    factor: 2.68,
    unit: 'kgCO2e/L',
    scope: 1,
    validFrom: '2024-01',
    validTo: null,
    source: 'IPCC 2021',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000003',
    category: 'raw_material',
    factor: 2.3,
    unit: 'kgCO2e/kg',
    scope: 3,
    validFrom: '2024-01',
    validTo: null,
    source: 'Ecoinvent 3.9',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000004',
    category: 'transport',
    factor: 0.092,
    unit: 'kgCO2e/ton-km',
    scope: 3,
    validFrom: '2024-01',
    validTo: null,
    source: '국토부 2023',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000005',
    category: 'waste',
    factor: 0.58,
    unit: 'kgCO2e/kg',
    scope: 3,
    validFrom: '2024-01',
    validTo: null,
    source: '환경부 폐기물통계 2023',
  },
];

export const activities: ActivityData[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    companyId: '00000000-0000-0000-0000-000000000001',
    yearMonth: '2025-01',
    type: 'electricity',
    description: '한국전력',
    quantity: 11000,
    unit: 'kWh',
    scope: 2,
    createdAt: '2025-01-31T00:00:00.000Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    companyId: '00000000-0000-0000-0000-000000000001',
    yearMonth: '2025-01',
    type: 'raw_material',
    description: '플라스틱(HDPE)',
    quantity: 2300,
    unit: 'kg',
    scope: 3,
    createdAt: '2025-01-31T00:00:00.000Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    companyId: '00000000-0000-0000-0000-000000000001',
    yearMonth: '2025-01',
    type: 'transport',
    description: '5톤 트럭',
    quantity: 4100,
    unit: 'ton-km',
    scope: 3,
    createdAt: '2025-01-31T00:00:00.000Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    companyId: '00000000-0000-0000-0000-000000000001',
    yearMonth: '2025-02',
    type: 'electricity',
    description: '한국전력',
    quantity: 10500,
    unit: 'kWh',
    scope: 2,
    createdAt: '2025-02-28T00:00:00.000Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000005',
    companyId: '00000000-0000-0000-0000-000000000001',
    yearMonth: '2025-02',
    type: 'fuel',
    description: '경유',
    quantity: 800,
    unit: 'L',
    scope: 1,
    createdAt: '2025-02-28T00:00:00.000Z',
  },
];
