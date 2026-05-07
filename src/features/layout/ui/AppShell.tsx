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
    companies,
    selectedCompanyId,
    setSelectedCompanyId,
  } = useLayout();

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <NavigationDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onSelectCompany={setSelectedCompanyId}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  );
}
