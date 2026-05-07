export const CHART_COLORS = {
  scope1: '#EF4444',
  scope2: '#F59E0B',
  scope3: '#3B82F6',

  // 카테고리 순서: electricity, fuel, raw_material, transport, waste
  categories: [
    '#1E40AF', // 전기  — deep navy
    '#60A5FA', // 연료  — light blue
    '#22D3EE', // 원자재 — bright cyan
    '#4ADE80', // 운송  — bright green
    '#84CC16', // 폐기물 — lime
  ],

  // 탄소 관리 등급 게이지 (E→A, 낮은→높은 점수)
  gaugeZones: [
    '#8B5CF6', // E — violet
    '#3B82F6', // D — blue
    '#0891B2', // C — sky
    '#EAB308', // B — yellow
    '#16A34A', // A — green
  ],

  trendLine: '#308AF9',
  trendArea: '#DBEAFE',
} as const;
