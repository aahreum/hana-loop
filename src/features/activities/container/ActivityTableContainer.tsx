'use client';

import { toast } from 'sonner';
import { useDeleteActivity } from '@/shared/hooks/useActivities';
import { ActivityTable } from '../ui/ActivityTable';
import type { ActivityData } from '@/shared/types/activity';

type ActivityTableContainerProps = {
  activities: ActivityData[];
};

export function ActivityTableContainer({
  activities,
}: ActivityTableContainerProps) {
  const { mutate: deleteActivity } = useDeleteActivity();

  function handleDelete(id: string) {
    // 낙관적 업데이트 — 행이 즉시 사라지고, 실패 시 훅 onError 에서 캐시 롤백.
    deleteActivity(id, {
      onSuccess: () => toast.success('활동 데이터가 삭제되었습니다.'),
      onError: (err) =>
        toast.error(err.message ?? '삭제에 실패해 이전 상태로 복원했습니다.'),
    });
  }

  return <ActivityTable activities={activities} onDelete={handleDelete} />;
}
