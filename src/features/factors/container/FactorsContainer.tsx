'use client';

import { RefreshCw } from 'lucide-react';
import { Header } from '@/shared/ui/header';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { useFactors } from '@/shared/hooks/useFactors';
import { FactorsTable } from '../ui/FactorsTable';

function FactorsContent({
  isPending,
  error,
  factors,
}: {
  isPending: boolean;
  error: Error | null;
  factors: ReturnType<typeof useFactors>['data'];
}) {
  if (isPending) {
    return (
      <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        불러오는 중...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-error">
        데이터를 불러오지 못했습니다
      </div>
    );
  }
  return (
    <div className="p-1">
      <FactorsTable factors={factors ?? []} />
    </div>
  );
}

export function FactorsContainer() {
  const { toggleSidebar } = useUiStore();
  const { data: factors, isPending, error } = useFactors();

  return (
    <div className="flex flex-1 flex-col">
      <Header title="배출계수" onMenuClick={toggleSidebar} />

      <main className="flex-1 p-4 md:p-6">
        <div className="rounded-xl bg-surface border border-border">
          <div className="border-b border-border px-5 py-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-text">
              배출계수 목록
              {factors && factors.length > 0 && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({factors.length}건)
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              출처: 한국환경공단 2023 기준
            </p>
          </div>
          <FactorsContent
            isPending={isPending}
            error={error}
            factors={factors}
          />
        </div>
      </main>
    </div>
  );
}
