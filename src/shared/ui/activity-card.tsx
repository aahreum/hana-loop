'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import type { ActivityData } from '@/shared/types/activity';
import {
  ACTIVITY_TYPE_LABELS,
  SCOPE_BADGE_CLASSES,
} from '@/shared/constants/activityLabels';

type ActivityCardProps = {
  activity: ActivityData;
  onDelete?: (id: string) => void;
};

const TYPE_BADGE_CLASS =
  'inline-flex items-center rounded-full bg-primary-bg px-2 py-0.5 text-xs font-medium text-primary-pressed shrink-0';

const scopeBadgeClass = (scope: ActivityData['scope']) =>
  cn(
    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
    SCOPE_BADGE_CLASSES[scope] ??
      'bg-muted text-muted-foreground border-border',
  );

export function ActivityCard({ activity, onDelete }: ActivityCardProps) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-border bg-background p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className={TYPE_BADGE_CLASS}>
              {ACTIVITY_TYPE_LABELS[activity.type] ?? activity.type}
            </span>
            <span className="truncate text-sm text-text">
              {activity.description}
            </span>
          </div>
          <span className={scopeBadgeClass(activity.scope)}>
            Scope {activity.scope}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="tabular-nums text-sm text-muted-foreground">
            {activity.date}
          </span>
          <span className="tabular-nums text-sm font-medium text-text whitespace-nowrap">
            {activity.quantity.toLocaleString()} {activity.unit}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>배출계수</span>
          <span className="font-mono">{activity.factorCategory}</span>
        </div>
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => onDelete(activity.id)}
          aria-label="활동 데이터 삭제"
          className="shrink-0 text-muted-foreground"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </li>
  );
}
