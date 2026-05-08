'use client';

import { useEffect } from 'react';
import { NavigationDrawer } from './NavigationDrawer';
import { useLayout } from '../hooks/useLayout';
import { useTheme } from '@/shared/hooks/useTheme';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const {
    sidebarOpen,
    setSidebarOpen,
    companies,
    companiesLoading,
    selectedCompanyId,
    setSelectedCompanyId,
  } = useLayout();

  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    if (theme !== null) {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <NavigationDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        companies={companies}
        companiesLoading={companiesLoading}
        selectedCompanyId={selectedCompanyId}
        onSelectCompany={setSelectedCompanyId}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  );
}
