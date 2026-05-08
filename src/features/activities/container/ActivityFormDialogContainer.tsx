'use client';

import { toast } from 'sonner';
import { useCreateActivity } from '@/shared/hooks/useActivities';
import { useFactors } from '@/shared/hooks/useFactors';
import { ActivityFormDialog } from '../ui/ActivityFormDialog';
import type { CreateActivityInput } from '@/shared/types/activity';

type ActivityFormDialogContainerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
};

export function ActivityFormDialogContainer({
  open,
  onOpenChange,
  companyId,
}: ActivityFormDialogContainerProps) {
  const { data: factors = [] } = useFactors();
  const { mutate: create, isPending } = useCreateActivity();

  function handleSubmit(data: CreateActivityInput) {
    create(data, {
      onSuccess: () => {
        toast.success('활동 데이터가 저장되었습니다.');
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message ?? '저장에 실패했습니다. 다시 시도해주세요.');
      },
    });
  }

  return (
    <ActivityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      companyId={companyId}
      factors={factors}
      isSubmitting={isPending}
      onSubmit={handleSubmit}
    />
  );
}
