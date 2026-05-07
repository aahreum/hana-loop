'use client';

import { RefreshCw } from 'lucide-react';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { useCompanies } from '@/shared/hooks/useCompanies';
import { CompaniesTable } from '@/features/companies/ui/CompaniesTable';
import { Header } from '@/features/layout/ui/Header';

export default function CompaniesPage() {
  const { toggleSidebar } = useUiStore();
  const { data: companies = [], isLoading, error } = useCompanies();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="기업 관리" onMenuClick={toggleSidebar} />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="rounded-xl bg-surface border border-border">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-text">
              기업 목록
              {companies.length > 0 && (
                <span className="ml-1 text-xs font-normal text-gray-400">
                  ({companies.length}건)
                </span>
              )}
            </h2>
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
              <CompaniesTable companies={companies} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
