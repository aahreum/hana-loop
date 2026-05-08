'use client';

import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const inputClass = 'cursor-pointer pr-8 text-sm';

// native month input 은 한국 로케일에서 키보드 직접 입력 시 6자리 연도(123444년)
// 같은 비현실적 값도 받는다. picker UI 로만 선택하도록 키보드 입력 자체를 차단한다.
// (Tab / Shift+Tab 은 포커스 이동용이라 통과시킨다.)
function blockKeyboardInput(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Tab') return;
  e.preventDefault();
}

type DateRangePickerProps = {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  minDate: string;
  maxDate: string;
  disabled?: boolean;
};

// "YYYY-MM" 에서 N 개월 뺀 값을 반환. Date 객체에 위임해 연도 이월(-1월 → 전년 12월) 자동 처리.
function subtractMonths(yearMonth: string, months: number): string {
  const [y, m] = yearMonth.split('-').map(Number);
  if (!y || !m) return yearMonth;
  const date = new Date(y, m - 1 - months, 1);
  const newY = date.getFullYear();
  const newM = date.getMonth() + 1;
  return `${newY}-${String(newM).padStart(2, '0')}`;
}

type PresetRange = readonly [string, string];

const PRESETS: ReadonlyArray<{
  label: string;
  getRange: (min: string, max: string) => PresetRange;
}> = [
  { label: '전체', getRange: (min, max) => [min, max] as const },
  { label: '최근 1개월', getRange: (_min, max) => [max, max] as const },
  {
    label: '최근 3개월',
    getRange: (_min, max) => [subtractMonths(max, 2), max] as const,
  },
  {
    label: '최근 6개월',
    getRange: (_min, max) => [subtractMonths(max, 5), max] as const,
  },
];

export function DateRangePicker({
  from,
  to,
  onChange,
  minDate,
  maxDate,
  disabled,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  // 빈 from/to = 전체 기간 (필터 없음). minDate/maxDate 도 데이터 로딩 전 빈 값 가능.
  const isAll = !from && !to;
  const triggerLabel = disabled
    ? '회사 선택 필요'
    : isAll
      ? '전체 기간'
      : `${from} ~ ${to}`;
  const rangeReady = !!minDate && !!maxDate;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
          aria-label="조회 기간 선택"
        >
          <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="tabular-nums">{triggerLabel}</span>
          <ChevronDown
            className="h-3.5 w-3.5 text-muted-foreground"
            aria-hidden
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 space-y-3">
        {/* From / To 직접 선택 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="dr-from"
              className="mb-1 block text-xs font-medium text-muted-foreground cursor-pointer"
            >
              시작 월
            </label>
            <div className="relative">
              <Input
                id="dr-from"
                type="month"
                value={from}
                min={minDate}
                max={to}
                onKeyDown={blockKeyboardInput}
                onChange={(e) => onChange(e.target.value, to)}
                className={inputClass}
              />
              <Calendar
                className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="dr-to"
              className="mb-1 block text-xs font-medium text-muted-foreground cursor-pointer"
            >
              종료 월
            </label>
            <div className="relative">
              <Input
                id="dr-to"
                type="month"
                value={to}
                min={from}
                max={maxDate}
                onKeyDown={blockKeyboardInput}
                onChange={(e) => onChange(from, e.target.value)}
                className={inputClass}
              />
              <Calendar
                className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* 빠른 선택 preset — 데이터 로딩 후에만 활성화 */}
        <div className="space-y-1.5">
          {PRESETS.map(({ label, getRange }) => {
            const isAllPreset = label === '전체';
            const [presetFrom, presetTo] = rangeReady
              ? getRange(minDate, maxDate)
              : (['', ''] as const);
            const active = isAllPreset
              ? !from && !to
              : from === presetFrom && to === presetTo;
            return (
              <Button
                key={label}
                type="button"
                variant={active ? 'default' : 'outline'}
                size="sm"
                disabled={!rangeReady}
                onClick={() => {
                  // "전체" 는 필터를 빈 값으로 — 서버 응답의 동적 범위를 그대로 사용.
                  if (isAllPreset) onChange('', '');
                  else onChange(presetFrom, presetTo);
                  setOpen(false);
                }}
                className="w-full"
              >
                {label}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
