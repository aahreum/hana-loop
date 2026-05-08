'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

type QueryErrorCardProps = {
  message?: string;
  onRetry: () => void;
  className?: string;
};

export function QueryErrorCard({
  message = '데이터를 불러오지 못했습니다',
  onRetry,
  className,
}: QueryErrorCardProps) {
  return (
    <div
      className={cn(
        'flex h-64 flex-col items-center justify-center gap-3 text-center',
        className,
      )}
    >
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm font-medium text-text">{message}</p>
      <p className="text-xs text-muted-foreground">
        네트워크 오류 또는 서버 문제가 발생했습니다
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="mt-1 gap-1.5 cursor-pointer"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        다시 시도
      </Button>
    </div>
  );
}
