'use client';

import { useMemo } from 'react';
import { useEmissionResults } from '@/shared/hooks/useEmissionResults';
import { useActivities } from '@/shared/hooks/useActivities';
import { useFilterStore } from '@/shared/lib/store/filterStore';
import { kgToTon, calcChangeRate } from '@/shared/lib/calculations';
import { CHART_COLORS } from '@/shared/constants/chartColors';
import { ACTIVITY_TYPE_LABELS } from '@/shared/constants/activityLabels';
import {
  interpretChangeRate,
  interpretTopCategory,
  interpretPeakMonth,
  buildDonutInsights,
  buildTrendInsights,
  buildGradeInsights,
  buildReductionSuggestions,
  type CategoryShare,
  type CategoryTrend,
} from '@/shared/lib/insights';
import type { Scope } from '@/shared/types/activity';

const ACTIVITY_TYPES = ['electricity', 'raw_material', 'transport'] as const;

export function useDashboard() {
  const { selectedCompanyId, from, to } = useFilterStore();

  const {
    data: results = [],
    isPending: resultsLoading,
    isError: resultsError,
    refetch: refetchResults,
  } = useEmissionResults({
    companyId: selectedCompanyId ?? undefined,
    from,
    to,
  });

  const {
    data: activities = [],
    isPending: activitiesLoading,
    isError: activitiesError,
    refetch: refetchActivities,
  } = useActivities({
    companyId: selectedCompanyId ?? undefined,
  });

  const isPending = resultsLoading || activitiesLoading;

  // 활동 ID → 활동 유형 lookup (find 반복 제거)
  const activityTypeById = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of activities) map.set(a.id, a.type);
    return map;
  }, [activities]);

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
      lastMonth: lastMonth ?? null,
      currentMonthTon: kgToTon(currentMonthKg),
      byScope: {
        1: kgToTon(byScope[1] ?? 0),
        2: kgToTon(byScope[2] ?? 0),
        3: kgToTon(byScope[3] ?? 0),
      } as Record<Scope, number>,
    };
  }, [results]);

  // 활동 유형별 월별 추이 (stacked area용)
  type CategoryTrendRow = {
    month: string;
    total: number;
  } & Record<(typeof ACTIVITY_TYPES)[number], number>;

  const categoryTrendData = useMemo<CategoryTrendRow[]>(() => {
    const byMonth: Record<string, Record<string, number>> = {};
    for (const r of results) {
      if (!byMonth[r.yearMonth]) {
        byMonth[r.yearMonth] = {
          electricity: 0,
          raw_material: 0,
          transport: 0,
        };
      }
    }
    for (const r of results) {
      const type = activityTypeById.get(r.activityId);
      if (!type || !byMonth[r.yearMonth]) continue;
      byMonth[r.yearMonth][type] =
        (byMonth[r.yearMonth][type] ?? 0) + kgToTon(r.emissionKgCo2e);
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, cats]) => {
        const total = Object.values(cats).reduce((s, v) => s + v, 0);
        return {
          month,
          electricity: cats.electricity ?? 0,
          raw_material: cats.raw_material ?? 0,
          transport: cats.transport ?? 0,
          total,
        };
      });
  }, [results, activityTypeById]);

  // 활동 유형별 합계 (도넛 차트용)
  const categoryShares = useMemo<CategoryShare[]>(() => {
    const byType: Record<string, number> = {};
    for (const r of results) {
      const type = activityTypeById.get(r.activityId);
      if (!type) continue;
      byType[type] = (byType[type] ?? 0) + r.emissionKgCo2e;
    }
    const total = Object.values(byType).reduce((s, v) => s + v, 0);
    if (total === 0) return [];
    return ACTIVITY_TYPES.filter((t) => (byType[t] ?? 0) > 0).map((t) => ({
      type: t,
      label: ACTIVITY_TYPE_LABELS[t] ?? t,
      value: kgToTon(byType[t] ?? 0),
      share: (byType[t] ?? 0) / total,
    }));
  }, [results, activityTypeById]);

  // 도넛 차트 데이터 — 색상은 ACTIVITY_TYPES 원본 순서 기준으로 고정
  // (필터된 배열 index를 쓰면 0값 활동이 빠질 때 색이 밀려서 trend 차트와 어긋남)
  const activityDonutData = useMemo(() => {
    return categoryShares.map((c) => {
      const originalIndex = ACTIVITY_TYPES.indexOf(
        c.type as (typeof ACTIVITY_TYPES)[number],
      );
      const colorIndex = originalIndex >= 0 ? originalIndex : 0;
      return {
        name: c.label,
        type: c.type,
        value: c.value,
        share: c.share,
        fill: CHART_COLORS.categories[colorIndex],
      };
    });
  }, [categoryShares]);

  // 최대 배출 활동 (CategoryShare로 통일)
  const topCategory = useMemo<CategoryShare | null>(() => {
    if (categoryShares.length === 0) return null;
    return [...categoryShares].sort((a, b) => b.value - a.value)[0] ?? null;
  }, [categoryShares]);

  // 활동별 변화율 (최근월 vs 직전월) — 트렌드 인사이트용
  const categoryTrends = useMemo<CategoryTrend[]>(() => {
    if (categoryTrendData.length < 2) return [];
    const last = categoryTrendData[categoryTrendData.length - 1];
    const prev = categoryTrendData[categoryTrendData.length - 2];
    if (!last || !prev) return [];
    return ACTIVITY_TYPES.map((t) => {
      const recent = (last[t] as number) ?? 0;
      const previous = (prev[t] as number) ?? 0;
      return {
        type: t,
        label: ACTIVITY_TYPE_LABELS[t] ?? t,
        recentTotal: recent,
        previousTotal: previous,
        changeRate: previous > 0 ? ((recent - previous) / previous) * 100 : 0,
      };
    }).filter((c) => c.recentTotal > 0 || c.previousTotal > 0);
  }, [categoryTrendData]);

  // 응답 데이터에서 동적으로 추출하는 사용 가능 기간 — DateRangePicker 의 min/max 로 사용.
  // 필터(from/to) 영향을 받지 않는 activities 를 기준으로 — 사용자가 범위를 좁혀도
  // picker 의 선택 가능 영역은 데이터셋 전체를 유지해야 한다.
  const dateRange = useMemo(() => {
    if (activities.length === 0) return null;
    let min = activities[0]!.yearMonth;
    let max = activities[0]!.yearMonth;
    for (const a of activities) {
      if (a.yearMonth < min) min = a.yearMonth;
      if (a.yearMonth > max) max = a.yearMonth;
    }
    return { min, max };
  }, [activities]);

  // 연중 최대 배출 월
  const peakMonth = useMemo(() => {
    if (categoryTrendData.length === 0) return null;
    let max = -Infinity;
    let target: string | null = null;
    for (const row of categoryTrendData) {
      if (row.total > max) {
        max = row.total;
        target = row.month;
      }
    }
    return target;
  }, [categoryTrendData]);

  // 배출량 감축 추세 기반 탄소 관리 점수 (0–100)
  const emissionScore = useMemo(() => {
    if (categoryTrendData.length < 2) return 50;
    const n = categoryTrendData.length;
    const firstHalf = categoryTrendData.slice(0, Math.ceil(n / 2));
    const secondHalf = categoryTrendData.slice(Math.floor(n / 2));
    const firstAvg =
      firstHalf.reduce((s, d) => s + d.total, 0) / firstHalf.length;
    const lastAvg =
      secondHalf.reduce((s, d) => s + d.total, 0) / secondHalf.length;
    if (firstAvg === 0 && lastAvg === 0) return 50;
    if (firstAvg === 0) return 20;
    const changeRate = (lastAvg - firstAvg) / firstAvg;
    const raw = Math.round(50 - changeRate * 50);
    return Math.max(0, Math.min(100, raw));
  }, [categoryTrendData]);

  // 인사이트 문구 패키지
  const insights = useMemo(() => {
    const totalChangeRate = kpis?.changeRate ?? 0;
    const recentMonthByType: Record<string, number> = {};
    if (categoryTrendData.length > 0) {
      const last = categoryTrendData[categoryTrendData.length - 1];
      if (last) {
        for (const t of ACTIVITY_TYPES) {
          recentMonthByType[t] = (last[t] as number) ?? 0;
        }
      }
    }
    return {
      changeRate: interpretChangeRate(totalChangeRate),
      topCategory: interpretTopCategory(topCategory),
      peakMonth: interpretPeakMonth(peakMonth),
      donut: buildDonutInsights(topCategory),
      trend: buildTrendInsights({
        categoryTrends,
        peakMonth,
        totalChangeRate,
      }),
      grade: buildGradeInsights({
        score: emissionScore,
        totalChangeRate,
        topCategory,
      }),
      reductionSuggestions: buildReductionSuggestions(recentMonthByType),
    };
  }, [
    kpis?.changeRate,
    emissionScore,
    topCategory,
    categoryTrends,
    peakMonth,
    categoryTrendData,
  ]);

  const recentActivities = useMemo(
    () =>
      [...activities].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [activities],
  );

  return {
    isPending,
    resultsError,
    activitiesError,
    refetchResults,
    refetchActivities,
    hasData: results.length > 0,
    kpis,
    topCategory,
    categoryTrendData,
    activityDonutData,
    activityTypes: ACTIVITY_TYPES,
    activityTypeLabels: ACTIVITY_TYPE_LABELS,
    peakMonth,
    dateRange,
    recentActivities,
    emissionScore,
    insights,
  };
}
