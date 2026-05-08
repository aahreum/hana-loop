'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/shared/ui/button';

type HeaderProps = {
  title: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
};

export function Header({ title, onMenuClick, actions }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-text">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
