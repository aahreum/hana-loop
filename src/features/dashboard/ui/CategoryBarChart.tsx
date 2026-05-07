'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS } from '@/shared/constants/chartColors';

type CategoryBarChartProps = {
  data: Record<string, string | number>[];
  categories: string[];
  categoryLabels: Record<string, string>;
};

export function CategoryBarChart({
  data,
  categories,
  categoryLabels,
}: CategoryBarChartProps) {
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
        <caption>활동 유형별 월별 배출량 (tCO₂e)</caption>
        <thead>
          <tr>
            <th scope="col">월</th>
            {categories.map((cat) => (
              <th key={cat} scope="col">
                {categoryLabels[cat] ?? cat}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={String(row.month)}>
              <td>{String(row.month)}</td>
              {categories.map((cat) => {
                const v = row[cat];
                return (
                  <td key={cat}>
                    {(typeof v === 'number' ? v : 0).toFixed(2)} tCO₂e
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          barSize={40}
          tabIndex={-1}
          margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
        >
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
            cursor={{ fill: 'rgba(100,116,139,0.08)', rx: 4, ry: 4 }}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) => [`${(v as number).toFixed(2)} tCO₂e`, '']}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            iconType="square"
          />
          {categories.map((cat, i) => (
            <Bar
              key={cat}
              dataKey={cat}
              name={categoryLabels[cat] ?? cat}
              stackId="a"
              fill={CHART_COLORS.categories[i % CHART_COLORS.categories.length]}
              radius={i === categories.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
