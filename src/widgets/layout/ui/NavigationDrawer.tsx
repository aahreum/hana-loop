'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Activity,
  FlaskConical,
  Building2,
  X,
  ChevronDown,
  Loader2,
  PanelLeft,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
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
  desktopCollapsed: boolean;
  onToggleDesktop: () => void;
  companies: Company[];
  companiesLoading: boolean;
  selectedCompanyId: string | null;
  onSelectCompany: (id: string) => void;
};

export function NavigationDrawer({
  open,
  onClose,
  desktopCollapsed,
  onToggleDesktop,
  companies,
  companiesLoading,
  selectedCompanyId,
  onSelectCompany,
}: NavigationDrawerProps) {
  const pathname = usePathname();

  // 데스크탑(>=lg) 여부 추적 — 사이드바가 화면에 보이는지 판정해
  // 보이지 않을 때만 inert로 자식 포커스를 함께 차단한다.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isHidden = isDesktop ? desktopCollapsed : !open;

  // 부모가 onClose 를 메모이제이션하지 않을 수 있으므로 ref 로 최신 참조만 유지.
  // 이렇게 하면 isDesktop / open 가 바뀔 때만 keydown 리스너를 재등록한다.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isDesktop || !open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktop, open]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden cursor-pointer"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        aria-label="주 탐색"
        inert={isHidden}
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-sidebar-bg text-sidebar-text transition-transform duration-200',
          'lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
          desktopCollapsed && 'lg:hidden',
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
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleDesktop}
                  aria-label="사이드바 닫기"
                  className="hidden rounded-md p-1 text-sidebar-muted hover:text-sidebar-text hover:bg-white/10 lg:inline-flex cursor-pointer"
                >
                  <PanelLeft className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="border border-border bg-surface text-text shadow-xl"
              >
                사이드바 닫기
              </TooltipContent>
            </Tooltip>
            <button
              onClick={onClose}
              aria-label="사이드바 닫기"
              className="rounded-md p-1 text-sidebar-muted hover:text-sidebar-text hover:bg-white/10 lg:hidden cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-3 py-3 border-b border-white/10">
          {companiesLoading ? (
            <>
              <p
                className="mb-1.5 block text-xs font-medium text-sidebar-muted uppercase tracking-wider"
                aria-hidden
              >
                기업 선택
              </p>
              <div className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 border border-white/20">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sidebar-muted" />
                <span className="text-sm text-sidebar-muted">로딩 중...</span>
              </div>
            </>
          ) : (
            <>
              <label
                htmlFor="company-select"
                className="mb-1.5 block text-xs font-medium text-sidebar-muted uppercase tracking-wider cursor-pointer"
              >
                기업 선택
              </label>
              {/* relative scope 를 select 에만 한정해야 ChevronDown 의
                  top-1/2 가 select 높이 기준으로 정렬된다. */}
              <div className="relative">
                <select
                  id="company-select"
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
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-muted"
                  aria-hidden
                />
              </div>
            </>
          )}
        </div>

        <nav
          aria-label="페이지 탐색"
          className="flex-1 overflow-y-auto px-2 py-3"
        >
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
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
                      if (!isDesktop) onClose();
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
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
