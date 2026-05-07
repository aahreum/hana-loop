'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type ScopeDataPoint = {
  name: string;
  value: number;
  fill: string;
};

type ScopeDonutChartProps = {
  data: ScopeDataPoint[];
};

function CenterLabel({
  cx,
  cy,
  total,
}: {
  cx: number;
  cy: number;
  total: number;
}) {
  return (
    <g>
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill="var(--text)"
        fontSize={22}
        fontWeight={700}
        fontFamily="var(--font-pretendard)"
      >
        {total.toFixed(1)}
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fill="var(--gray-500)"
        fontSize={11}
        fontFamily="var(--font-pretendard)"
      >
        tCO₂e 합계
      </text>
    </g>
  );
}

export function ScopeDonutChart({ data }: ScopeDonutChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        데이터가 없습니다
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <>
      {/* 스크린리더용 목록 */}
      <p className="sr-only">
        Scope별 탄소 배출량 합계: {total.toFixed(2)} tCO₂e.{' '}
        {data
          .map(
            (d) =>
              `${d.name}: ${d.value.toFixed(2)} tCO₂e (${((d.value / total) * 100).toFixed(1)}%)`,
          )
          .join(', ')}
      </p>

      <ResponsiveContainer width="100%" height={260}>
        <PieChart tabIndex={-1}>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={({ cx, cy }) => (
              <CenterLabel cx={cx} cy={cy} total={total} />
            )}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) => {
              const n = v as number;
              return [
                `${n.toFixed(2)} tCO₂e (${total > 0 ? ((n / total) * 100).toFixed(1) : 0}%)`,
                '',
              ];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </>
  );
}
