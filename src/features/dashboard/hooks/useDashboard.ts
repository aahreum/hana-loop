'use client';

import { useMemo } from 'react';
import { useEmissionResults } from '@/shared/hooks/useEmissionResults';
import { useActivities } from '@/shared/hooks/useActivities';
import { useFilterStore } from '@/shared/lib/store/filterStore';
import { kgToTon, calcChangeRate } from '@/shared/lib/calculations';
import { CHART_COLORS } from '@/shared/constants/chartColors';
import type { Scope } from '@/shared/types/activity';

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  electricity: '전기',
  fuel: '연료',
  raw_material: '원자재',
  transport: '운송',
  waste: '폐기물',
};

export function useDashboard() {
  const { selectedCompanyId, from, to } = useFilterStore();

  const { data: results = [], isLoading: resultsLoading } = useEmissionResults({
    companyId: selectedCompanyId ?? undefined,
    from,
    to,
  });

  const { data: activities = [], isLoading: activitiesLoading } = useActivities(
    {
      companyId: selectedCompanyId ?? undefined,
    },
  );

  const isLoading = resultsLoading || activitiesLoading;

  const kpis = useMemo(() => {
    if (results.length === 0) return null;

    const totalKg = results.reduce((s, r) => s + r.emissionKgCo2e, 0);
    const total = kgToTon(totalKg);

    // 당월 vs 전월
    const months = [...new Set(results.map((r) => r.yearMonth))].sort();
    const lastMonth = months[months.length - 1];
    const prevMonth = months[months.length - 2];

    const currentMonthKg = results
      .filter((r) => r.yearMonth === lastMonth)
      .reduce((s, r) => s + r.emissionKgCo2e, 0);
    const prevMonthKg = results
      .filter((r) => r.yearMonth === prevMonth)
      .reduce((s, r) => s + r.emissionKgCo2e, 0);

    const changeRate = prevMonth
      ? calcChangeRate(currentMonthKg, prevMonthKg)
      : 0;

    // Scope별 합계
    const byScope = results.reduce(
      (acc, r) => {
        acc[r.scope] = (acc[r.scope] ?? 0) + r.emissionKgCo2e;
        return acc;
      },
      {} as Record<Scope, number>,
    );

    return {
      total,
      changeRate,
      byScope: {
        1: kgToTon(byScope[1] ?? 0),
        2: kgToTon(byScope[2] ?? 0),
        3: kgToTon(byScope[3] ?? 0),
      } as Record<Scope, number>,
    };
  }, [results]);

  // 월별 추이 데이터 (scope별 합계)
  const trendData = useMemo(() => {
    const byMonth: Record<string, Record<Scope, number>> = {};
    for (const r of results) {
      if (!byMonth[r.yearMonth]) byMonth[r.yearMonth] = { 1: 0, 2: 0, 3: 0 };
      byMonth[r.yearMonth][r.scope] =
        (byMonth[r.yearMonth][r.scope] ?? 0) + r.emissionKgCo2e;
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, scopes]) => ({
        month,
        scope1: kgToTon(scopes[1] ?? 0),
        scope2: kgToTon(scopes[2] ?? 0),
        scope3: kgToTon(scopes[3] ?? 0),
        total: kgToTon((scopes[1] ?? 0) + (scopes[2] ?? 0) + (scopes[3] ?? 0)),
      }));
  }, [results]);

  // Scope 도넛 차트 데이터
  const scopeData = useMemo(() => {
    if (!kpis) return [];
    return [
      { name: 'Scope 1', value: kpis.byScope[1], fill: CHART_COLORS.scope1 },
      { name: 'Scope 2', value: kpis.byScope[2], fill: CHART_COLORS.scope2 },
      { name: 'Scope 3', value: kpis.byScope[3], fill: CHART_COLORS.scope3 },
    ].filter((d) => d.value > 0);
  }, [kpis]);

  // 활동 유형별 월별 바 차트 데이터
  const categoryBarData = useMemo(() => {
    const byMonth: Record<string, Record<string, number>> = {};
    for (const a of activities) {
      if (!byMonth[a.yearMonth])
        byMonth[a.yearMonth] = {
          electricity: 0,
          fuel: 0,
          raw_material: 0,
          transport: 0,
          waste: 0,
        };
    }
    for (const r of results) {
      const act = activities.find((a) => a.id === r.activityId);
      if (!act) continue;
      if (!byMonth[r.yearMonth]) continue;
      byMonth[r.yearMonth][act.type] =
        (byMonth[r.yearMonth][act.type] ?? 0) + kgToTon(r.emissionKgCo2e);
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, cats]) => ({ month, ...cats }));
  }, [results, activities]);

  // 최대 배출원 (activity description 기준)
  const topSource = useMemo(() => {
    const byActivity: Record<string, number> = {};
    for (const r of results) {
      const act = activities.find((a) => a.id === r.activityId);
      if (!act) continue;
      const label = ACTIVITY_TYPE_LABELS[act.type] ?? act.type;
      byActivity[label] = (byActivity[label] ?? 0) + r.emissionKgCo2e;
    }
    const sorted = Object.entries(byActivity).sort(([, a], [, b]) => b - a);
    return sorted[0]
      ? { name: sorted[0][0], value: kgToTon(sorted[0][1]) }
      : null;
  }, [results, activities]);

  // 배출량 감축 추세 기반 탄소 관리 점수 (0–100)
  const emissionScore = useMemo(() => {
    if (trendData.length < 2) return 50;
    const n = trendData.length;
    const firstHalf = trendData.slice(0, Math.ceil(n / 2));
    const secondHalf = trendData.slice(Math.floor(n / 2));
    const firstAvg =
      firstHalf.reduce((s, d) => s + d.total, 0) / firstHalf.length;
    const lastAvg =
      secondHalf.reduce((s, d) => s + d.total, 0) / secondHalf.length;
    if (firstAvg === 0 && lastAvg === 0) return 50;
    if (firstAvg === 0) return 20;
    const changeRate = (lastAvg - firstAvg) / firstAvg;
    const raw = Math.round(50 - changeRate * 50);
    return Math.max(0, Math.min(100, raw));
  }, [trendData]);

  const recentActivities = useMemo(
    () =>
      [...activities].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [activities],
  );

  return {
    isLoading,
    hasData: results.length > 0,
    kpis,
    topSource,
    trendData,
    scopeData,
    categoryBarData,
    recentActivities,
    emissionScore,
    activityTypeLabels: ACTIVITY_TYPE_LABELS,
  };
}
