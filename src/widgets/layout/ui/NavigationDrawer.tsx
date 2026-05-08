'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  FlaskConical,
  Building2,
  X,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Company } from '@/shared/types/company';

const NAV_ITEMS = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/activities', label: '활동 데이터', icon: Activity },
  { href: '/factors', label: '배출계수', icon: FlaskConical },
  { href: '/companies', label: '기업 관리', icon: Building2 },
] as const;

type NavigationDrawerProps = {
  open: boolean;
  onClose: () => void;
  companies: Company[];
  companiesLoading: boolean;
  selectedCompanyId: string | null;
  onSelectCompany: (id: string) => void;
};

export function NavigationDrawer({
  open,
  onClose,
  companies,
  companiesLoading,
  selectedCompanyId,
  onSelectCompany,
}: NavigationDrawerProps) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-sidebar-bg text-sidebar-text transition-transform duration-200',
          'lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white text-xs font-bold shrink-0"
              style={{ background: 'var(--brand-gradient)' }}
            >
              H
            </div>
            <h1 className="text-base font-semibold tracking-tight">HanaLoop</h1>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-sidebar-muted hover:text-sidebar-text hover:bg-white/10 lg:hidden cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3 py-3 border-b border-white/10">
          <p className="mb-1.5 text-xs font-medium text-sidebar-muted uppercase tracking-wider">
            기업 선택
          </p>
          <div className="relative">
            {companiesLoading ? (
              <div className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 border border-white/20">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sidebar-muted" />
                <span className="text-sm text-sidebar-muted">로딩 중...</span>
              </div>
            ) : (
              <>
                <select
                  value={selectedCompanyId ?? ''}
                  onChange={(e) => onSelectCompany(e.target.value)}
                  className="w-full rounded-md bg-white/10 px-3 py-2 text-sm text-sidebar-text border border-white/20 focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    기업을 선택하세요
                  </option>
                  {companies.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      className="bg-gray-800 text-white"
                    >
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronLeft className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 -rotate-90 h-4 w-4 text-sidebar-muted" />
              </>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'text-white'
                        : 'text-sidebar-muted hover:bg-white/10 hover:text-sidebar-text',
                    )}
                    style={
                      active
                        ? { background: 'var(--brand-gradient)' }
                        : undefined
                    }
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-sidebar-muted">
            탄소 배출 관리 플랫폼 v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
