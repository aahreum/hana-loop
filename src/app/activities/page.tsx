'use client';

import { useState } from 'react';
import { Plus, Leaf, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { useFilterStore } from '@/shared/lib/store/filterStore';
import { useActivities } from '@/shared/hooks/useActivities';
import { ActivityTable } from '@/features/activities/ui/ActivityTable';
import { ActivityFormDialog } from '@/features/activities/ui/ActivityFormDialog';
import { Header } from '@/features/layout/ui/Header';

export default function ActivitiesPage() {
  const { toggleSidebar } = useUiStore();
  const { selectedCompanyId } = useFilterStore();
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    data: activities = [],
    isLoading,
    error,
  } = useActivities({
    companyId: selectedCompanyId ?? undefined,
  });

  const noCompany = !selectedCompanyId;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header
        title="활동 데이터"
        onMenuClick={toggleSidebar}
        actions={
          !noCompany && (
            <Button
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              활동 추가
            </Button>
          )
        }
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {noCompany ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <Leaf className="h-10 w-10 text-primary-border" />
            <p className="text-base font-medium text-gray-700">
              사이드바에서 기업을 선택하세요
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-surface border border-border">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-text">
                활동 목록{' '}
                {activities.length > 0 && (
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    ({activities.length}건)
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
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm font-medium text-error">
                  데이터를 불러오지 못했습니다
                </p>
                <p className="text-xs text-gray-400">{error.message}</p>
              </div>
            ) : (
              <div className="p-1">
                <ActivityTable activities={activities} />
              </div>
            )}
          </div>
        )}
      </main>

      {selectedCompanyId && (
        <ActivityFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          companyId={selectedCompanyId}
        />
      )}
    </div>
  );
}
