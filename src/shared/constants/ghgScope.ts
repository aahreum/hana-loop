import type { ActivityType, Scope } from '@/shared/types/activity';

export const GHG_SCOPE: Record<ActivityType, Scope> = {
  electricity: 2,
  fuel: 1,
  raw_material: 3,
  transport: 3,
  waste: 3,
};

export const SCOPE_LABELS: Record<Scope, string> = {
  1: 'Scope 1',
  2: 'Scope 2',
  3: 'Scope 3',
};

export const SCOPE_DESCRIPTIONS: Record<Scope, string> = {
  1: '직접 배출 (연료 연소)',
  2: '간접 배출 (구매 전력)',
  3: '가치사슬 배출 (공급망)',
};
