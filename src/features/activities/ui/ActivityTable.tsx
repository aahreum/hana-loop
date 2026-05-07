'use client';

import { useState } from 'react';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { useDeleteActivity } from '@/shared/hooks/useActivities';
import type { ActivityData } from '@/shared/types/activity';

const TYPE_LABELS: Record<string, string> = {
  electricity: '전기',
  fuel: '연료',
  raw_material: '원자재',
  transport: '운송',
  waste: '폐기물',
};

const SCOPE_BADGE: Record<number, string> = {
  1: 'text-scope1 bg-scope1/10 border-scope1/20',
  2: 'text-scope2 bg-scope2/10 border-scope2/20',
  3: 'text-scope3 bg-scope3/10 border-scope3/20',
};

type SortKey = keyof Pick<ActivityData, 'date' | 'type' | 'quantity' | 'scope'>;

type ActivityTableProps = {
  activities: ActivityData[];
};

export function ActivityTable({ activities }: ActivityTableProps) {
  const { mutate: del, isPending: isDeleting } = useDeleteActivity();
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  function handleDelete(id: string) {
    if (isDeleting) return;
    setDeletingId(id);
    del(id, {
      onSuccess: () => {
        toast.success('활동 데이터가 삭제되었습니다.');
        setDeletingId(null);
      },
      onError: (err) => {
        toast.error(err.message ?? '삭제에 실패했습니다. 다시 시도해주세요.');
        setDeletingId(null);
      },
    });
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
      <div className="flex h-40 items-center justify-center text-sm text-gray-400">
        활동 데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-gray-50/50">
            {(
              [
                { key: 'date', label: '날짜' },
                { key: 'type', label: '유형' },
              ] as { key: SortKey; label: string }[]
            )
              .concat([
                { key: 'quantity' as SortKey, label: '수량' },
                { key: 'scope' as SortKey, label: 'Scope' },
              ])
              .map(({ key, label }) => (
                <th
                  key={key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 cursor-pointer select-none"
                  onClick={() => handleSort(key)}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    <SortIcon col={key} />
                  </div>
                </th>
              ))}
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              설명
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              배출계수
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
              관리
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {sorted.map((a) => (
            <tr
              key={a.id}
              className={cn(
                'hover:bg-gray-50/50 transition-colors',
                deletingId === a.id && 'opacity-50',
              )}
            >
              <td className="px-4 py-3 tabular-nums text-gray-700">{a.date}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-primary-bg px-2 py-0.5 text-xs font-medium text-primary">
                  {TYPE_LABELS[a.type] ?? a.type}
                </span>
              </td>
              <td className="px-4 py-3 tabular-nums text-gray-700">
                {a.quantity.toLocaleString()} {a.unit}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                    SCOPE_BADGE[a.scope] ??
                      'bg-gray-100 text-gray-600 border-gray-200',
                  )}
                >
                  Scope {a.scope}
                </span>
              </td>
              <td className="px-4 py-3 max-w-[200px] truncate text-gray-700">
                {a.description}
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {a.factorCategory}
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(a.id)}
                  disabled={isDeleting}
                  className="h-7 w-7 text-gray-400 hover:text-error hover:bg-error-bg"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
