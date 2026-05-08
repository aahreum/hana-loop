'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  BarChart3,
  Zap,
  TrendingUp,
  Leaf,
  RefreshCw,
  Gauge,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Clock,
} from 'lucide-react';
import { Header } from '@/shared/ui/header';
import { UnitTooltip } from '@/shared/ui/unit-tooltip';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { useFilterStore } from '@/shared/lib/store/filterStore';
import { useDashboard } from '../hooks/useDashboard';
import { KpiCard } from '../ui/KpiCard';
import { KpiCardSkeleton } from '../ui/KpiCardSkeleton';
import { CardSectionHeader } from '../ui/CardSectionHeader';
import { CarbonGradeCard } from '../ui/CarbonGradeCard';
import { InsightList } from '../ui/InsightList';
import { ReductionSuggestionCard } from '../ui/ReductionSuggestionCard';
import { RecentActivitiesTable } from '../ui/RecentActivitiesTable';
import { DateRangePicker } from '../ui/DateRangePicker';
import { QueryErrorCard } from '@/shared/ui/query-error-card';

// Recharts 는 무거운 라이브러리라 메인 번들에서 분리하여 별도 chunk 로 로드.
const ChartSkeleton = () => (
  <div className="flex h-64 items-center justify-center">
    <RefreshCw className="h-6 w-6 animate-spin text-primary-border" />
  </div>
);
const EmissionTrendChart = dynamic(
  () =>
    import('../ui/EmissionTrendChart').then((m) => ({
      default: m.EmissionTrendChart,
    })),
  { loading: ChartSkeleton },
);
const ActivityDonutChart = dynamic(
  () =>
    import('../ui/ActivityDonutChart').then((m) => ({
      default: m.ActivityDonutChart,
    })),
  { loading: ChartSkeleton },
);

type DashboardData = ReturnType<typeof useDashboard>;

function KpiSection({
  isPending,
  resultsError,
  onRetry,
  kpis,
  topCategory,
  insights,
  peakMonthLabel,
  hasData,
  from,
  to,
}: {
  isPending: boolean;
  resultsError: boolean;
  onRetry: () => void;
  kpis: DashboardData['kpis'];
  topCategory: DashboardData['topCategory'];
  insights: DashboardData['insights'];
  peakMonthLabel: string | null;
  hasData: boolean;
  from: string;
  to: string;
}) {
  if (isPending) {
    return (
      <>
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </>
    );
  }
  if (resultsError) {
    return (
      <div className="col-span-2 md:col-span-4">
        <QueryErrorCard
          message="지표 데이터를 불러오지 못했습니다"
          onRetry={onRetry}
        />
      </div>
    );
  }
  return (
    <>
      <KpiCard
        title="총 배출량"
        value={kpis ? kpis.total.toFixed(2) : '—'}
        unit="tCO₂e"
        icon={<BarChart3 className="h-4 w-4" />}
        insight={hasData ? `${from} ~ ${to} 누적` : undefined}
        subtitle={hasData ? undefined : '데이터 없음'}
      />
      <KpiCard
        title="전월 대비"
        value={
          kpis
            ? `${kpis.changeRate > 0 ? '+' : ''}${kpis.changeRate.toFixed(1)}`
            : '—'
        }
        unit="%"
        change={kpis?.changeRate}
        icon={<TrendingUp className="h-4 w-4" />}
        insight={kpis ? insights.changeRate.message : undefined}
        tone={kpis ? insights.changeRate.tone : undefined}
      />
      <KpiCard
        title="최대 배출원"
        value={topCategory?.label ?? '—'}
        unit={topCategory ? `${topCategory.value.toFixed(2)} t` : undefined}
        icon={<Zap className="h-4 w-4" />}
        insight={topCategory ? insights.topCategory.message : undefined}
        tone={topCategory ? insights.topCategory.tone : undefined}
      />
      <KpiCard
        title="최대 배출 시점"
        value={peakMonthLabel ?? '—'}
        icon={<Leaf className="h-4 w-4" />}
        insight={kpis ? '기간 내 가장 많이 배출된 월' : undefined}
        tone={kpis ? insights.peakMonth.tone : undefined}
      />
    </>
  );
}

function ChartSection({
  isPending,
  error,
  onRetry,
  children,
}: {
  isPending: boolean;
  error: boolean;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  if (isPending) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-primary-border" />
      </div>
    );
  }
  if (error) {
    return <QueryErrorCard onRetry={onRetry} />;
  }
  return <>{children}</>;
}

function RecentActivitiesSection({
  isPending,
  activitiesError,
  onRetry,
  recentActivities,
}: {
  isPending: boolean;
  activitiesError: boolean;
  onRetry: () => void;
  recentActivities: DashboardData['recentActivities'];
}) {
  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    );
  }
  if (activitiesError) {
    return (
      <QueryErrorCard
        message="활동 데이터를 불러오지 못했습니다"
        onRetry={onRetry}
      />
    );
  }
  return <RecentActivitiesTable activities={recentActivities} />;
}

export function DashboardContainer() {
  const { toggleSidebar } = useUiStore();
  const { selectedCompanyId, from, to, setDateRange } = useFilterStore();
  const {
    isPending,
    resultsError,
    activitiesError,
    refetchResults,
    refetchActivities,
    hasData,
    kpis,
    topCategory,
    categoryTrendData,
    activityDonutData,
    activityTypes,
    activityTypeLabels,
    peakMonth,
    dateRange,
    recentActivities,
    emissionScore,
    insights,
  } = useDashboard();

  const peakMonthLabel = peakMonth
    ? `${parseInt(peakMonth.split('-')[1] ?? '0', 10)}월`
    : null;

  const noCompany = !selectedCompanyId;

  return (
    <div className="flex flex-1 flex-col">
      <Header
        title="대시보드"
        onMenuClick={toggleSidebar}
        actions={
          <DateRangePicker
            from={from}
            to={to}
            onChange={setDateRange}
            minDate={dateRange?.min ?? ''}
            maxDate={dateRange?.max ?? ''}
            disabled={noCompany}
          />
        }
      />

      <main className="flex-1 p-4 md:p-6">
        {noCompany ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <Leaf className="h-10 w-10 text-primary-border" />
            <p className="text-base font-medium text-text">
              사이드바에서 기업을 선택하세요
            </p>
            <p className="text-sm text-muted-foreground">
              기업을 선택하면 탄소 배출 현황을 확인할 수 있습니다
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* 1. 현재 상태 — KPI Cards */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm lg:text-base font-semibold uppercase tracking-wider text-muted-foreground">
                  현재 상태
                </h3>
                <UnitTooltip
                  label="tCO₂e란?"
                  description="이산화탄소 환산톤 (tonne CO₂ equivalent)"
                  comparison="1tCO₂e ≈ 승용차 약 4,400km 주행 시 발생하는 온실가스 양"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <KpiSection
                  isPending={isPending}
                  resultsError={resultsError}
                  onRetry={() => void refetchResults()}
                  kpis={kpis}
                  topCategory={topCategory}
                  insights={insights}
                  peakMonthLabel={peakMonthLabel}
                  hasData={hasData}
                  from={from}
                  to={to}
                />
              </div>
            </section>

            {/* 2. 원인 분석 — 활동 도넛 + Stacked area trend */}
            <section>
              <h3 className="mb-3 text-sm lg:text-base font-semibold uppercase tracking-wider text-muted-foreground">
                원인 파악
              </h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-surface border border-border p-5">
                  <CardSectionHeader
                    icon={PieChartIcon}
                    title="활동 유형별 비중"
                    description="어떤 활동에서 가장 많이 발생하는가"
                    action={
                      <UnitTooltip
                        label="계산식"
                        description="배출량 = 활동량 × 배출계수"
                        comparison="활동량이 많아도 배출계수가 낮으면 최대 배출원이 아닐 수 있습니다"
                      />
                    }
                  />
                  <ChartSection
                    isPending={isPending}
                    error={resultsError || activitiesError}
                    onRetry={() => {
                      void refetchResults();
                      void refetchActivities();
                    }}
                  >
                    <ActivityDonutChart data={activityDonutData} />
                    {insights.donut.length > 0 && (
                      <div className="mt-4 border-t border-border pt-4">
                        <InsightList title="요약" insights={insights.donut} />
                      </div>
                    )}
                  </ChartSection>
                </div>

                <div className="col-span-1 lg:col-span-2 rounded-xl bg-surface border border-border p-5">
                  <CardSectionHeader
                    icon={LineChartIcon}
                    title="월별 배출량 추이"
                    description="활동 유형별로 쌓아 본 시간 흐름"
                  />
                  <ChartSection
                    isPending={isPending}
                    error={resultsError || activitiesError}
                    onRetry={() => {
                      void refetchResults();
                      void refetchActivities();
                    }}
                  >
                    <EmissionTrendChart
                      data={categoryTrendData}
                      categories={activityTypes}
                      categoryLabels={activityTypeLabels}
                    />
                    {insights.trend.length > 0 && (
                      <div className="mt-4 border-t border-border pt-4">
                        <InsightList
                          title="자동 분석"
                          insights={insights.trend}
                        />
                      </div>
                    )}
                  </ChartSection>
                </div>
              </div>
            </section>

            {/* 3. 개선 포인트 — 등급 + 감축 제안 */}
            <section>
              <h3 className="mb-3 text-sm lg:text-base font-semibold uppercase tracking-wider text-muted-foreground">
                개선 방향
              </h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-surface border border-border p-5">
                  <CardSectionHeader
                    icon={Gauge}
                    title="탄소 관리 등급"
                    description="기간 내 배출량 감축 추세 기반"
                  />
                  <ChartSection
                    isPending={isPending}
                    error={resultsError}
                    onRetry={() => void refetchResults()}
                  >
                    <CarbonGradeCard
                      score={emissionScore}
                      insights={insights.grade}
                    />
                  </ChartSection>
                </div>

                <div className="col-span-1 h-full lg:col-span-2">
                  <ChartSection
                    isPending={isPending}
                    error={resultsError || activitiesError}
                    onRetry={() => {
                      void refetchResults();
                      void refetchActivities();
                    }}
                  >
                    <ReductionSuggestionCard
                      suggestions={insights.reductionSuggestions}
                    />
                  </ChartSection>
                </div>
              </div>
            </section>

            {/* 4. 최근 활동 데이터 */}
            <section className="rounded-xl bg-surface border border-border p-5">
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-border pb-3">
                <h4 className="flex items-center gap-2 text-base lg:text-lg font-semibold text-text">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  최근 활동 데이터
                </h4>
                <Link
                  href="/activities"
                  className="text-xs font-medium text-primary hover:text-primary-hover"
                >
                  전체 보기 →
                </Link>
              </div>
              <RecentActivitiesSection
                isPending={isPending}
                activitiesError={activitiesError}
                onRetry={() => void refetchActivities()}
                recentActivities={recentActivities}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
