export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  electricity: '전기',
  raw_material: '원소재',
  transport: '운송',
};

// scope1/2/3는 차트 fill 전용 (GHG Protocol 컨벤션 — 변경 금지).
// 텍스트는 WCAG AA 4.5:1을 충족하는 별도 변형(--scope*-text) 사용.
export const SCOPE_BADGE_CLASSES: Record<number, string> = {
  1: 'text-scope1-text bg-scope1/10 border-scope1/20',
  2: 'text-scope2-text bg-scope2/10 border-scope2/20',
  3: 'text-scope3-text bg-scope3/10 border-scope3/20',
};
