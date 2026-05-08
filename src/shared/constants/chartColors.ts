export const CHART_COLORS = {
  scope1: '#EF4444',
  scope2: '#F59E0B',
  scope3: '#3B82F6',

  // 카테고리 순서: electricity, raw_material, transport
  categories: [
    '#1E40AF', // 전기   — deep navy
    '#22D3EE', // 원소재 — bright cyan
    '#4ADE80', // 운송   — bright green
  ],

  // 탄소 관리 등급 게이지 (E→A, 낮은→높은 점수)
  // WCAG AA 4.5:1 충족하도록 darker 톤 사용 (white text 기준)
  gaugeZones: [
    '#7C3AED', // E — violet-600  (white 5.0:1)
    '#2563EB', // D — blue-600    (white 5.6:1)
    '#0E7490', // C — sky-700     (white 5.5:1)
    '#A16207', // B — yellow-700  (white 5.5:1)
    '#15803D', // A — green-700   (white 5.5:1)
  ],

  trendLine: '#308AF9',
  trendArea: '#DBEAFE',
} as const;
