'use client';

import type { ComponentProps } from 'react';
import { DialogContent } from '@/shared/ui/dialog';
import { cn } from '@/shared/lib/utils';

// shadcn DialogContent 의 기본값(bg-background, grid layout) 대신
// 디자인 시스템에 맞게 bg-surface + flex column 을 강제하는 wrapper.
// shadcn 원본은 수정하지 않고, 모든 다이얼로그·바텀시트는 이 컴포넌트를 사용한다.
// className 을 추가로 넘기면 뒤에 병합되어 케이스별 override 도 가능.

export function AppDialogContent({
  className,
  ...props
}: ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn('bg-surface flex flex-col', className)}
      {...props}
    />
  );
}
