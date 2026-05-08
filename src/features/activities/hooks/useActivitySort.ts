'use client';

import { useMemo, useState } from 'react';
import type { ActivityData } from '@/shared/types/activity';

export type ActivitySortKey = 'date' | 'type' | 'quantity' | 'scope';
export type ActivitySortDir = 'asc' | 'desc';

// 정렬 상태를 표/카드 뷰가 공유하기 위한 view-state 훅.
// 정렬 로직만 담아 ActivityTable.ui 안에서 호출 가능 (서버 상태/뮤테이션 없음).
export function useActivitySort(activities: ActivityData[]) {
  const [sortKey, setSortKey] = useState<ActivitySortKey>('date');
  const [sortDir, setSortDir] = useState<ActivitySortDir>('desc');

  function handleSort(key: ActivitySortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function toggleDir() {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }

  const sorted = useMemo(() => {
    return [...activities].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortKey === 'type') cmp = a.type.localeCompare(b.type);
      else if (sortKey === 'quantity') cmp = a.quantity - b.quantity;
      else if (sortKey === 'scope') cmp = a.scope - b.scope;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [activities, sortKey, sortDir]);

  return { sorted, sortKey, sortDir, handleSort, setSortKey, toggleDir };
}
