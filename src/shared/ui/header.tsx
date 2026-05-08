'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

type HeaderProps = {
  title: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
};

export function Header({ title, onMenuClick, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-surface px-4 shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold text-muted-foreground">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
