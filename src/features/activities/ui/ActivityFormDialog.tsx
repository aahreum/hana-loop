'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { ActivityForm } from './ActivityForm';
import type { CreateActivityInput } from '@/shared/types/activity';
import type { EmissionFactor } from '@/shared/types/factor';

type ActivityFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  factors: EmissionFactor[];
  isSubmitting: boolean;
  onSubmit: (data: CreateActivityInput) => void;
};

export function ActivityFormDialog({
  open,
  onOpenChange,
  companyId,
  factors,
  isSubmitting,
  onSubmit,
}: ActivityFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>활동 데이터 입력</DialogTitle>
        </DialogHeader>
        <ActivityForm
          companyId={companyId}
          factors={factors}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
