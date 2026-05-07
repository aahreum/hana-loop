'use client';

import { RefreshCw } from 'lucide-react';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { useFactors } from '@/shared/hooks/useFactors';
import { FactorsTable } from '@/features/factors/ui/FactorsTable';
import { Header } from '@/features/layout/ui/Header';

export default function FactorsPage() {
  const { toggleSidebar } = useUiStore();
  const { data: factors = [], isLoading, error } = useFactors();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="배출계수" onMenuClick={toggleSidebar} />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="rounded-xl bg-surface border border-border">
          <div className="border-b border-border px-5 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">
              배출계수 목록
              {factors.length > 0 && (
                <span className="ml-1 text-xs font-normal text-gray-400">
                  ({factors.length}건)
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400">
              출처: 한국환경공단 2023 기준
            </p>
          </div>

          {isLoading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-sm text-gray-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              불러오는 중...
            </div>
          ) : error ? (
            <div className="flex h-48 items-center justify-center text-sm text-error">
              데이터를 불러오지 못했습니다
            </div>
          ) : (
            <div className="p-1">
              <FactorsTable factors={factors} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
