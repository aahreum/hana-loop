'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { ActivityForm } from './ActivityForm';
import { cn } from '@/shared/lib/utils';
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
      <DialogContent
        className={cn(
          // 모바일 바텀시트: 화면 하단에 붙고 상단만 라운드
          'left-0 top-auto bottom-0 max-w-full translate-x-0 translate-y-0',
          'rounded-b-none rounded-t-2xl border-x-0 border-b-0',
          // lg 이상: 가운데 모달 복귀
          'lg:left-[50%] lg:top-[50%] lg:bottom-auto',
          'lg:max-w-lg lg:translate-x-[-50%] lg:translate-y-[-50%]',
          'lg:rounded-lg lg:border',
          // 공통 — viewport 초과 방지 + 내부 스크롤. bg-surface 로 조회기간 dialog 와 톤 통일
          'max-h-[90dvh] overflow-y-auto bg-surface',
        )}
      >
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
