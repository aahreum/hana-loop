'use client';

import Link from 'next/link';
import { BarChart3, Zap, TrendingUp, Leaf, RefreshCw } from 'lucide-react';
import { Header } from '@/shared/ui/header';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { useFilterStore } from '@/shared/lib/store/filterStore';
import { useDashboard } from '../hooks/useDashboard';
import { KpiCard } from '../ui/KpiCard';
import { KpiCardSkeleton } from '../ui/KpiCardSkeleton';
import { EmissionTrendChart } from '../ui/EmissionTrendChart';
import { ScopeDonutChart } from '../ui/ScopeDonutChart';
import { CategoryBarChart } from '../ui/CategoryBarChart';
import { CarbonGauge } from '../ui/CarbonGauge';
import { RecentActivitiesTable } from '../ui/RecentActivitiesTable';
import { QueryErrorCard } from '@/shared/ui/query-error-card';
import { DATASET_FROM, DATASET_TO } from '@/shared/constants/datasetRange';

const ACTIVITY_CATEGORIES = [
  'electricity',
  'fuel',
  'raw_material',
  'transport',
  'waste',
];

type DashboardData = ReturnType<typeof useDashboard>;

function KpiSection({
  isPending,
  resultsError,
  onRetry,
  kpis,
  topSource,
  hasData,
  from,
  to,
}: {
  isPending: boolean;
  resultsError: boolean;
  onRetry: () => void;
  kpis: DashboardData['kpis'];
  topSource: DashboardData['topSource'];
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
        subtitle={hasData ? `${from} ~ ${to}` : '데이터 없음'}
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
        subtitle="직전 월 대비 증감"
      />
      <KpiCard
        title="최대 배출원"
        value={topSource?.name ?? '—'}
        unit={topSource ? `${topSource.value.toFixed(2)} t` : undefined}
        icon={<Zap className="h-4 w-4" />}
        subtitle={topSource ? '기간 내 최대' : '데이터 없음'}
      />
      <KpiCard
        title="Scope 1 / 2 / 3"
        value={kpis ? `${kpis.byScope[1].toFixed(1)}` : '—'}
        unit="tCO₂e"
        icon={<Leaf className="h-4 w-4" />}
        subtitle={
          kpis
            ? `S2: ${kpis.byScope[2].toFixed(1)} / S3: ${kpis.byScope[3].toFixed(1)} tCO₂e`
            : '데이터 없음'
        }
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
    topSource,
    trendData,
    scopeData,
    categoryBarData,
    recentActivities,
    emissionScore,
    activityTypeLabels,
  } = useDashboard();

  const noCompany = !selectedCompanyId;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header
        title="대시보드"
        onMenuClick={toggleSidebar}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {noCompany ? (
                <span className="w-[130px] rounded-md border border-border bg-surface px-2 py-1 text-sm text-muted-foreground">
                  YYYY.MM
                </span>
              ) : (
                <input
                  type="month"
                  value={from}
                  min={DATASET_FROM}
                  max={to}
                  onChange={(e) => setDateRange(e.target.value, to)}
                  className="w-[130px] rounded-md border border-border bg-surface px-2 py-1 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                />
              )}
              <span>~</span>
              {noCompany ? (
                <span className="w-[130px] rounded-md border border-border bg-surface px-2 py-1 text-sm text-muted-foreground">
                  YYYY.MM
                </span>
              ) : (
                <input
                  type="month"
                  value={to}
                  min={from}
                  max={DATASET_TO}
                  onChange={(e) => setDateRange(from, e.target.value)}
                  className="w-[130px] rounded-md border border-border bg-surface px-2 py-1 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                />
              )}
            </div>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
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
          <div className="space-y-6">
            {/* KPI Cards */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                주요 지표
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <KpiSection
                  isPending={isPending}
                  resultsError={resultsError}
                  onRetry={() => void refetchResults()}
                  kpis={kpis}
                  topSource={topSource}
                  hasData={hasData}
                  from={from}
                  to={to}
                />
              </div>
            </section>

            {/* Charts Row 1: Gauge + Trend */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl bg-surface border border-border p-5">
                <h3 className="text-sm font-semibold text-text">
                  탄소 관리 등급
                </h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  기간 내 배출량 감축 추세 기반
                </p>
                <ChartSection
                  isPending={isPending}
                  error={resultsError}
                  onRetry={() => void refetchResults()}
                >
                  <CarbonGauge score={emissionScore} />
                </ChartSection>
              </div>

              <div className="col-span-2 rounded-xl bg-surface border border-border p-5">
                <h3 className="mb-4 text-sm font-semibold text-text">
                  월별 배출량 추이
                </h3>
                <ChartSection
                  isPending={isPending}
                  error={resultsError}
                  onRetry={() => void refetchResults()}
                >
                  <EmissionTrendChart data={trendData} />
                </ChartSection>
              </div>
            </section>

            {/* Charts Row 2: Scope Donut + Category Bar */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl bg-surface border border-border p-5">
                <h3 className="mb-4 text-sm font-semibold text-text">
                  Scope별 비율
                </h3>
                <ChartSection
                  isPending={isPending}
                  error={resultsError}
                  onRetry={() => void refetchResults()}
                >
                  <ScopeDonutChart data={scopeData} />
                </ChartSection>
              </div>

              <div className="col-span-2 rounded-xl bg-surface border border-border p-5">
                <h3 className="mb-4 text-sm font-semibold text-text">
                  활동 유형별 월별 배출량
                </h3>
                <ChartSection
                  isPending={isPending}
                  error={resultsError || activitiesError}
                  onRetry={() => {
                    void refetchResults();
                    void refetchActivities();
                  }}
                >
                  <CategoryBarChart
                    data={categoryBarData}
                    categories={ACTIVITY_CATEGORIES}
                    categoryLabels={activityTypeLabels}
                  />
                </ChartSection>
              </div>
            </section>

            {/* Recent Activities */}
            <section className="rounded-xl bg-surface border border-border p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text">
                  최근 활동 데이터
                </h3>
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
