'use client';

import { CHART_COLORS } from '@/shared/constants/chartColors';

const W = 260;
const H = 160;
const CX = W / 2; // 130
const CY = H - 20; // 140
const R = 95;
const TRACK_W = 22;

const LX = CX - R; // 35  — arc left end
const RX = CX + R; // 225 — arc right end

const GRADE_ZONES = [
  { label: 'E', name: '위험', color: CHART_COLORS.gaugeZones[0] },
  { label: 'D', name: '주의', color: CHART_COLORS.gaugeZones[1] },
  { label: 'C', name: '보통', color: CHART_COLORS.gaugeZones[2] },
  { label: 'B', name: '우수', color: CHART_COLORS.gaugeZones[3] },
  { label: 'A', name: '최우수', color: CHART_COLORS.gaugeZones[4] },
] as const;

function getGrade(score: number) {
  if (score >= 80) return GRADE_ZONES[4];
  if (score >= 60) return GRADE_ZONES[3];
  if (score >= 40) return GRADE_ZONES[2];
  if (score >= 20) return GRADE_ZONES[1];
  return GRADE_ZONES[0];
}

function arcPoint(score: number) {
  // angleDeg: score 0 → 180° (left), score 100 → 0° (right)
  const angleDeg = 180 - (score / 100) * 180;
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + R * Math.cos(rad),
    y: CY - R * Math.sin(rad),
    angleDeg,
  };
}

type CarbonGaugeProps = {
  score: number;
};

export function CarbonGauge({ score }: CarbonGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const grade = getGrade(clamped);
  const { x: nx, y: ny, angleDeg } = arcPoint(clamped);

  // SVG arc sweep=1 (clockwise in SVG) goes from left → top → right
  // large-arc is always 0 since span is always ≤ 180°
  const trackPath = `M ${LX} ${CY} A ${R} ${R} 0 0 1 ${RX} ${CY}`;
  const filledPath =
    clamped >= 100
      ? trackPath
      : `M ${LX} ${CY} A ${R} ${R} 0 0 1 ${nx.toFixed(2)} ${ny.toFixed(2)}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxWidth: W, height: H }}
        role="img"
        aria-label={`탄소 관리 등급: ${clamped}점 (100점 만점). 등급 ${grade.label} — ${grade.name}. 기간 내 배출량 감축 추세 기반 점수.`}
      >
        <defs>
          {/* gradientUnits="userSpaceOnUse": LX→RX 범위에 고정 */}
          <linearGradient
            id="gaugeGrad"
            gradientUnits="userSpaceOnUse"
            x1={LX}
            y1="0"
            x2={RX}
            y2="0"
          >
            <stop offset="0%" stopColor="var(--brand-green)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
        </defs>

        {/* Background track — single arc path */}
        <path
          d={trackPath}
          fill="none"
          stroke="var(--border)"
          strokeWidth={TRACK_W}
          strokeLinecap="round"
        />

        {/* Filled gradient arc — single arc path */}
        {clamped > 0 && (
          <path
            d={filledPath}
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth={TRACK_W}
            strokeLinecap="round"
          />
        )}

        {/* Arrow indicator at current score position */}
        <polygon
          points="0,-13 -7,8 7,8"
          fill="white"
          transform={`translate(${nx.toFixed(2)},${ny.toFixed(2)}) rotate(${90 - angleDeg})`}
        />

        {/* E / A end labels — centered on arc rounded caps */}
        <text
          x={LX}
          y={CY}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={11}
          fontWeight={600}
          fontFamily="var(--font-pretendard)"
        >
          E
        </text>
        <text
          x={RX}
          y={CY}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={11}
          fontWeight={600}
          fontFamily="var(--font-pretendard)"
        >
          A
        </text>

        {/* Score text */}
        <text
          x={CX}
          y={CY - 30}
          textAnchor="middle"
          fill="var(--text)"
          fontSize={34}
          fontWeight={700}
          fontFamily="var(--font-pretendard)"
        >
          {clamped}
        </text>
        <text
          x={CX}
          y={CY - 10}
          textAnchor="middle"
          fill="var(--gray-500)"
          fontSize={11}
          fontFamily="var(--font-pretendard)"
        >
          / 100
        </text>
      </svg>

      <span
        className="rounded-full px-4 py-1 text-sm font-semibold text-white"
        style={{ background: grade.color }}
      >
        등급 {grade.label} — {grade.name}
      </span>
    </div>
  );
}
