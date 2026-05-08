'use client';

import { RefreshCw } from 'lucide-react';
import { Header } from '@/shared/ui/header';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { useCompanies } from '@/shared/hooks/useCompanies';
import { CompaniesTable } from '../ui/CompaniesTable';

function CompaniesContent({
  isPending,
  error,
  companies,
}: {
  isPending: boolean;
  error: Error | null;
  companies: ReturnType<typeof useCompanies>['data'];
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
      <CompaniesTable companies={companies ?? []} />
    </div>
  );
}

export function CompaniesContainer() {
  const { toggleSidebar } = useUiStore();
  const { data: companies, isPending, error } = useCompanies();

  return (
    <div className="flex flex-1 flex-col">
      <Header title="기업 관리" onMenuClick={toggleSidebar} />

      <main className="flex-1 p-4 md:p-6">
        <div className="rounded-xl bg-surface border border-border">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-base font-semibold text-text">
              기업 목록
              {companies && companies.length > 0 && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({companies.length}건)
                </span>
              )}
            </h3>
          </div>
          <CompaniesContent
            isPending={isPending}
            error={error}
            companies={companies}
          />
        </div>
      </main>
    </div>
  );
}
