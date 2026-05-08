'use client';

import type { LucideIcon } from 'lucide-react';

type CardSectionHeaderProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** 헤더 우측에 배치할 액션 요소 (예: 도움말 툴팁). */
  action?: React.ReactNode;
};

export function CardSectionHeader({
  icon: Icon,
  title,
  description,
  action,
}: CardSectionHeaderProps) {
  return (
    <div className="mb-4 border-b border-border pb-3">
      <div className="flex items-start justify-between gap-3">
        <h4 className="flex items-center gap-2 text-base lg:text-lg font-semibold text-text">
          <Icon className="h-5 w-5 text-muted-foreground" />
          {title}
        </h4>
        {action}
      </div>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
