'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS } from '@/shared/constants/chartColors';

type TrendPoint = Record<string, string | number>;

type EmissionTrendChartProps = {
  data: TrendPoint[];
  /** Stacked area에 그릴 활동 유형 키 순서. */
  categories: readonly string[];
  /** 활동 키 → 표시 라벨. */
  categoryLabels: Record<string, string>;
};

export function EmissionTrendChart({
  data,
  categories,
  categoryLabels,
}: EmissionTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        데이터가 없습니다
      </div>
    );
  }

  return (
    <>
      {/* 스크린리더용 데이터 테이블 */}
      <table className="sr-only">
        <caption>월별 활동 유형별 탄소 배출량 추이 (tCO₂e)</caption>
        <thead>
          <tr>
            <th scope="col">월</th>
            {categories.map((c) => (
              <th key={c} scope="col">
                {categoryLabels[c] ?? c}
              </th>
            ))}
            <th scope="col">합계</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={String(d.month)}>
              <td>{String(d.month)}</td>
              {categories.map((c) => (
                <td key={c}>{((d[c] as number) ?? 0).toFixed(2)} tCO₂e</td>
              ))}
              <td>{((d.total as number) ?? 0).toFixed(2)} tCO₂e</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
          tabIndex={-1}
        >
          <defs>
            {categories.map((c, i) => {
              const color =
                CHART_COLORS.categories[i % CHART_COLORS.categories.length];
              return (
                <linearGradient
                  key={c}
                  id={`gradCat-${c}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.55} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: 'var(--gray-500)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--gray-500)' }}
            tickLine={false}
            axisLine={false}
            unit=" t"
            width={52}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v, name) => [
              `${(v as number).toFixed(2)} tCO₂e`,
              String(name),
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            iconType="circle"
          />
          {categories.map((c, i) => {
            const color =
              CHART_COLORS.categories[i % CHART_COLORS.categories.length];
            return (
              <Area
                key={c}
                type="monotone"
                dataKey={c}
                stackId="1"
                name={categoryLabels[c] ?? c}
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#gradCat-${c})`}
                activeDot={{ r: 4 }}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
}
