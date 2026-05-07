'use client';

import { useEffect } from 'react';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { useFilterStore } from '@/shared/lib/store/filterStore';
import { useCompanies } from '@/shared/hooks/useCompanies';

export function useLayout() {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUiStore();
  const { selectedCompanyId, setSelectedCompanyId } = useFilterStore();
  const { data: companies = [] } = useCompanies();

  // 기업 목록 로드 후 첫 번째 기업 자동 선택
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId, setSelectedCompanyId]);

  return {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    companies,
    selectedCompanyId,
    setSelectedCompanyId,
  };
}
