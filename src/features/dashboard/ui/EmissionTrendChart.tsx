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

type TrendPoint = {
  month: string;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
};

type EmissionTrendChartProps = {
  data: TrendPoint[];
};

export function EmissionTrendChart({ data }: EmissionTrendChartProps) {
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
        <caption>월별 Scope별 탄소 배출량 추이 (tCO₂e)</caption>
        <thead>
          <tr>
            <th scope="col">월</th>
            <th scope="col">Scope 1 (직접 배출)</th>
            <th scope="col">Scope 2 (전력 사용)</th>
            <th scope="col">Scope 3 (가치사슬)</th>
            <th scope="col">합계</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{d.month}</td>
              <td>{d.scope1.toFixed(2)} tCO₂e</td>
              <td>{d.scope2.toFixed(2)} tCO₂e</td>
              <td>{d.scope3.toFixed(2)} tCO₂e</td>
              <td>{d.total.toFixed(2)} tCO₂e</td>
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
            <linearGradient id="gradScope1" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={CHART_COLORS.scope1}
                stopOpacity={0.25}
              />
              <stop
                offset="95%"
                stopColor={CHART_COLORS.scope1}
                stopOpacity={0}
              />
            </linearGradient>
            <linearGradient id="gradScope2" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={CHART_COLORS.scope2}
                stopOpacity={0.25}
              />
              <stop
                offset="95%"
                stopColor={CHART_COLORS.scope2}
                stopOpacity={0}
              />
            </linearGradient>
            <linearGradient id="gradScope3" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={CHART_COLORS.scope3}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={CHART_COLORS.scope3}
                stopOpacity={0}
              />
            </linearGradient>
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
            formatter={(v) => [`${(v as number).toFixed(2)} tCO₂e`, '']}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            iconType="circle"
          />
          <Area
            type="monotone"
            dataKey="scope1"
            name="Scope 1"
            stroke={CHART_COLORS.scope1}
            strokeWidth={2}
            fill="url(#gradScope1)"
            dot={{ r: 3, fill: CHART_COLORS.scope1 }}
            activeDot={{ r: 5 }}
          />
          <Area
            type="monotone"
            dataKey="scope2"
            name="Scope 2"
            stroke={CHART_COLORS.scope2}
            strokeWidth={2}
            fill="url(#gradScope2)"
            dot={{ r: 3, fill: CHART_COLORS.scope2 }}
            activeDot={{ r: 5 }}
          />
          <Area
            type="monotone"
            dataKey="scope3"
            name="Scope 3"
            stroke={CHART_COLORS.scope3}
            strokeWidth={2}
            fill="url(#gradScope3)"
            dot={{ r: 3, fill: CHART_COLORS.scope3 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
}
