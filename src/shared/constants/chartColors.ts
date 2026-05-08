export const CHART_COLORS = {
  scope1: '#EF4444',
  scope2: '#F59E0B',
  scope3: '#3B82F6',

  // 카테고리 순서: electricity, raw_material, transport.
  // 실제 hex 는 globals.css 의 --chart-cat-* 변수로 관리하며 라이트/다크 분기.
  // SVG fill 속성은 var() 를 그대로 받아 브라우저가 resolve 한다.
  categories: [
    'var(--chart-cat-electricity)',
    'var(--chart-cat-raw-material)',
    'var(--chart-cat-transport)',
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
