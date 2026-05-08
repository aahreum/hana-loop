'use client';

import { useState } from 'react';
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { mutate: deleteActivity, isPending: isDeleting } = useDeleteActivity();

  function handleDelete(id: string) {
    setDeletingId(id);
    deleteActivity(id, {
      onSuccess: () => {
        toast.success('활동 데이터가 삭제되었습니다.');
        setDeletingId(null);
      },
      onError: (err) => {
        toast.error(err.message ?? '삭제에 실패했습니다.');
        setDeletingId(null);
      },
    });
  }

  return (
    <ActivityTable
      activities={activities}
      onDelete={handleDelete}
      isDeleting={isDeleting}
      deletingId={deletingId}
    />
  );
}
