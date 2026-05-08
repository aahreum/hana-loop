'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Dialog, DialogDescription, DialogTitle } from '@/shared/ui/dialog';
import { AppDialogContent } from '@/shared/ui/app-dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/utils';

type DateRangePickerProps = {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  minDate: string;
  maxDate: string;
  disabled?: boolean;
};

const desktopInputClass =
  'w-[130px] rounded-md border border-border bg-surface pl-2 pr-7 py-1 text-sm text-text cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary';

// 모바일 바텀시트용 — shared Input 의 기본 h-10/px-3/py-2 + 아이콘 자리 pr-10
// text-sm 강제 — native month picker 의 텍스트가 OS system font 영향으로 커지는 것 보정
const mobileInputClass = 'cursor-pointer pr-10 text-sm';

export function DateRangePicker({
  from,
  to,
  onChange,
  minDate,
  maxDate,
  disabled,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  if (disabled) {
    return (
      <div
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
        role="group"
        aria-label="배출량 조회 기간"
      >
        <span className="rounded-md border border-border bg-surface px-2 py-1">
          YYYY.MM
        </span>
        <span aria-hidden className="hidden lg:inline">
          ~
        </span>
        <span className="hidden rounded-md border border-border bg-surface px-2 py-1 lg:inline">
          YYYY.MM
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        className="hidden items-center gap-1.5 text-sm text-muted-foreground lg:flex"
        role="group"
        aria-label="배출량 조회 기간"
      >
        <label htmlFor="date-from" className="sr-only">
          시작 월
        </label>
        <div className="relative">
          <input
            id="date-from"
            type="month"
            value={from}
            min={minDate}
            max={to}
            onChange={(e) => onChange(e.target.value, to)}
            className={desktopInputClass}
          />
          <Calendar
            className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        </div>
        <span aria-hidden>~</span>
        <label htmlFor="date-to" className="sr-only">
          종료 월
        </label>
        <div className="relative">
          <input
            id="date-to"
            type="month"
            value={to}
            min={from}
            max={maxDate}
            onChange={(e) => onChange(from, e.target.value)}
            className={desktopInputClass}
          />
          <Calendar
            className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          aria-label="조회 기간 선택"
          className="gap-1.5 lg:hidden"
        >
          <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span>날짜 선택</span>
        </Button>
        <AppDialogContent
          className={cn(
            // 화면 하단에 붙고 상단만 라운드, 최소 300px 높이
            'fixed inset-x-0 bottom-0 left-0 top-auto w-full max-w-full translate-x-0 translate-y-0',
            'rounded-b-none rounded-t-2xl border-x-0 border-b-0 p-5',
            'min-h-[300px] gap-3',
          )}
        >
          <DialogTitle className="text-base">조회 기간</DialogTitle>
          <DialogDescription className="sr-only">
            시작 월과 종료 월을 선택해 배출량 조회 기간을 변경합니다.
          </DialogDescription>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="date-from-mobile"
                className="mb-1.5 block text-sm font-medium text-text cursor-pointer"
              >
                시작 월
              </label>
              <div className="relative">
                <Input
                  id="date-from-mobile"
                  type="month"
                  value={from}
                  min={minDate}
                  max={to}
                  onChange={(e) => onChange(e.target.value, to)}
                  className={mobileInputClass}
                />
                <Calendar
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="date-to-mobile"
                className="mb-1.5 block text-sm font-medium text-text cursor-pointer"
              >
                종료 월
              </label>
              <div className="relative">
                <Input
                  id="date-to-mobile"
                  type="month"
                  value={to}
                  min={from}
                  max={maxDate}
                  onChange={(e) => onChange(from, e.target.value)}
                  className={mobileInputClass}
                />
                <Calendar
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </AppDialogContent>
      </Dialog>
    </>
  );
}
