'use client';

import { Trash2, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { ActivityCard } from '@/shared/ui/activity-card';
import { cn } from '@/shared/lib/utils';
import type { ActivityData } from '@/shared/types/activity';
import {
  ACTIVITY_TYPE_LABELS,
  SCOPE_BADGE_CLASSES,
} from '@/shared/constants/activityLabels';
import {
  useActivitySort,
  type ActivitySortKey,
} from '../hooks/useActivitySort';

const SORT_OPTIONS: { key: ActivitySortKey; label: string }[] = [
  { key: 'date', label: '날짜' },
  { key: 'type', label: '유형' },
  { key: 'quantity', label: '수량' },
  { key: 'scope', label: 'Scope' },
];

type ActivityTableProps = {
  activities: ActivityData[];
  onDelete: (id: string) => void;
};

export function ActivityTable({ activities, onDelete }: ActivityTableProps) {
  const { sorted, sortKey, sortDir, handleSort, setSortKey, toggleDir } =
    useActivitySort(activities);

  function SortIcon({ col }: { col: ActivitySortKey }) {
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
      {/* 모바일 카드 뷰 — 테이블 헤더가 없으므로 정렬 컨트롤을 별도 노출 */}
      <div className="lg:hidden">
        <div className="mb-2 flex items-center justify-end gap-2">
          <Select
            value={sortKey}
            onValueChange={(v) => setSortKey(v as ActivitySortKey)}
          >
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(({ key, label }) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {label}순
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="iconSm"
            onClick={toggleDir}
            aria-label={sortDir === 'asc' ? '오름차순' : '내림차순'}
          >
            <ArrowUpDown
              className={cn(
                'h-3.5 w-3.5 transition-transform',
                sortDir === 'asc' && 'rotate-180',
              )}
            />
          </Button>
        </div>
        <ul className="space-y-2">
          {sorted.map((a) => (
            <ActivityCard key={a.id} activity={a} onDelete={onDelete} />
          ))}
        </ul>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {SORT_OPTIONS.map(({ key, label }) => (
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
              <tr key={a.id} className="hover:bg-muted/50 transition-colors">
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
