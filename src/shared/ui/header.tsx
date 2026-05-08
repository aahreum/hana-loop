'use client';

import { Menu, PanelLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

type HeaderProps = {
  title: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
};

export function Header({ title, onMenuClick, actions }: HeaderProps) {
  const { desktopSidebarCollapsed, toggleDesktopSidebar } = useUiStore();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-surface px-4 shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label="사이드바 열기"
          className="lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {desktopSidebarCollapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDesktopSidebar}
                aria-label="사이드바 열기"
                className="hidden lg:inline-flex cursor-pointer"
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="border border-border bg-surface text-text shadow-xl"
            >
              사이드바 열기
            </TooltipContent>
          </Tooltip>
        )}

        <h2 className="text-base lg:text-lg font-semibold text-muted-foreground">
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
