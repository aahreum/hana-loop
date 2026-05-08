'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { cn } from '@/shared/lib/utils';

type DateRangePickerProps = {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  minDate: string;
  maxDate: string;
  disabled?: boolean;
};

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
        <input
          id="date-from"
          type="month"
          value={from}
          min={minDate}
          max={to}
          onChange={(e) => onChange(e.target.value, to)}
          className="w-[130px] rounded-md border border-border bg-surface px-2 py-1 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        />
        <span aria-hidden>~</span>
        <label htmlFor="date-to" className="sr-only">
          종료 월
        </label>
        <input
          id="date-to"
          type="month"
          value={to}
          min={from}
          max={maxDate}
          onChange={(e) => onChange(from, e.target.value)}
          className="w-[130px] rounded-md border border-border bg-surface px-2 py-1 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="조회 기간 선택"
          className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-sm text-text hover:bg-muted cursor-pointer lg:hidden"
        >
          <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span>날짜 선택</span>
        </button>
        <DialogContent
          className={cn(
            'fixed inset-x-0 bottom-0 left-0 top-auto w-full max-w-full translate-x-0 translate-y-0',
            'rounded-b-none rounded-t-2xl border-x-0 border-b-0 bg-surface p-5',
          )}
        >
          <DialogTitle className="text-base">조회 기간</DialogTitle>
          <div className="mt-2 space-y-3">
            <div>
              <label
                htmlFor="date-from-mobile"
                className="mb-1.5 block text-sm font-medium text-text"
              >
                시작 월
              </label>
              <input
                id="date-from-mobile"
                type="month"
                value={from}
                min={minDate}
                max={to}
                onChange={(e) => onChange(e.target.value, to)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-base text-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              />
            </div>
            <div>
              <label
                htmlFor="date-to-mobile"
                className="mb-1.5 block text-sm font-medium text-text"
              >
                종료 월
              </label>
              <input
                id="date-to-mobile"
                type="month"
                value={to}
                min={from}
                max={maxDate}
                onChange={(e) => onChange(from, e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-base text-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
