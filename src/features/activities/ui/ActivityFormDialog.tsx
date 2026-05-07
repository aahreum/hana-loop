'use client';

import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { ActivityForm } from './ActivityForm';
import { useCreateActivity } from '@/shared/hooks/useActivities';
import { useFactors } from '@/shared/hooks/useFactors';
import type { CreateActivityInput } from '@/shared/types/activity';

type ActivityFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
};

export function ActivityFormDialog({
  open,
  onOpenChange,
  companyId,
}: ActivityFormDialogProps) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>활동 데이터 입력</DialogTitle>
        </DialogHeader>
        <ActivityForm
          companyId={companyId}
          factors={factors}
          isSubmitting={isPending}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
