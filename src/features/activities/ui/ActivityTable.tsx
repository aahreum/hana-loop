'use client';

import { useState } from 'react';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { ActivityCard } from '@/shared/ui/activity-card';
import { cn } from '@/shared/lib/utils';
import type { ActivityData } from '@/shared/types/activity';
import {
  ACTIVITY_TYPE_LABELS,
  SCOPE_BADGE_CLASSES,
} from '@/shared/constants/activityLabels';

type SortKey = keyof Pick<ActivityData, 'date' | 'type' | 'quantity' | 'scope'>;

type ActivityTableProps = {
  activities: ActivityData[];
  onDelete: (id: string) => void;
  isDeleting: boolean;
  deletingId: string | null;
};

export function ActivityTable({
  activities,
  onDelete,
  isDeleting,
  deletingId,
}: ActivityTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = [...activities].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
    else if (sortKey === 'type') cmp = a.type.localeCompare(b.type);
    else if (sortKey === 'quantity') cmp = a.quantity - b.quantity;
    else if (sortKey === 'scope') cmp = a.scope - b.scope;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp className="h-3 w-3 opacity-30" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        활동 데이터가 없습니다
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-2 lg:hidden">
        {sorted.map((a) => (
          <ActivityCard
            key={a.id}
            activity={a}
            onDelete={onDelete}
            isDeleting={isDeleting}
            deletingId={deletingId}
          />
        ))}
      </ul>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {(
                [
                  { key: 'date', label: '날짜' },
                  { key: 'type', label: '유형' },
                  { key: 'quantity', label: '수량' },
                  { key: 'scope', label: 'Scope' },
                ] as { key: SortKey; label: string }[]
              ).map(({ key, label }) => (
                <th
                  key={key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none"
                  onClick={() => handleSort(key)}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    <SortIcon col={key} />
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                설명
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                배출계수
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sorted.map((a) => (
              <tr
                key={a.id}
                className={cn(
                  'hover:bg-muted/50 transition-colors',
                  deletingId === a.id && 'opacity-50',
                )}
              >
                <td className="px-4 py-3 tabular-nums text-text">{a.date}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-primary-bg px-2 py-0.5 text-xs font-medium text-primary-pressed">
                    {ACTIVITY_TYPE_LABELS[a.type] ?? a.type}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums text-text">
                  {a.quantity.toLocaleString()} {a.unit}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                      SCOPE_BADGE_CLASSES[a.scope] ??
                        'bg-muted text-muted-foreground border-border',
                    )}
                  >
                    Scope {a.scope}
                  </span>
                </td>
                <td className="px-4 py-3 max-w-[200px] truncate text-text">
                  {a.description}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground break-all">
                  {a.factorCategory}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => onDelete(a.id)}
                    disabled={isDeleting}
                    aria-label="활동 데이터 삭제"
                    className="text-muted-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
