'use client';

import { NavigationDrawer } from './NavigationDrawer';
import { useLayout } from '../hooks/useLayout';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const {
    sidebarOpen,
    setSidebarOpen,
    desktopSidebarCollapsed,
    toggleDesktopSidebar,
    companies,
    companiesLoading,
    selectedCompanyId,
    setSelectedCompanyId,
  } = useLayout();

  return (
    <div className="flex min-h-screen bg-bg">
      <NavigationDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        desktopCollapsed={desktopSidebarCollapsed}
        onToggleDesktop={toggleDesktopSidebar}
        companies={companies}
        companiesLoading={companiesLoading}
        selectedCompanyId={selectedCompanyId}
        onSelectCompany={setSelectedCompanyId}
      />
      <div className="flex flex-1 flex-col min-w-0">{children}</div>
    </div>
  );
}
