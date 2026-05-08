'use client';

import { Lightbulb, ArrowDownCircle } from 'lucide-react';
import type { ReductionSuggestion } from '@/shared/lib/insights';

type ReductionSuggestionCardProps = {
  suggestions: ReductionSuggestion[];
};

/**
 * 메시지 안의 "연간 (약) X tCO₂e 감소 가능" 부분을 굵게 + 초록색으로 강조.
 * 룰 함수는 평문 string을 만들고, 강조는 렌더 시점에서만 처리한다.
 */
const SAVINGS_PATTERN =
  /(연간\s*(?:약\s*)?\d+(?:\.\d+)?\s*tCO₂e\s*감소\s*가능)/g;
const SAVINGS_TEST = /^연간\s*(?:약\s*)?\d+(?:\.\d+)?\s*tCO₂e\s*감소\s*가능$/;

function highlightSavings(message: string): React.ReactNode[] {
  return message.split(SAVINGS_PATTERN).map((part, i) =>
    SAVINGS_TEST.test(part) ? (
      <strong key={i} className="font-semibold text-trend-down">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

export function ReductionSuggestionCard({
  suggestions,
}: ReductionSuggestionCardProps) {
  if (suggestions.length === 0) {
    return (
      <div className="h-full rounded-xl bg-surface border border-border p-5">
        <div className="mb-4 border-b border-border pb-3">
          <h4 className="flex items-center gap-2 text-base lg:text-lg font-semibold text-text">
            <Lightbulb className="h-5 w-5 text-muted-foreground" />
            감축 제안
          </h4>
        </div>
        <p className="text-sm text-muted-foreground">
          분석할 활동 데이터가 부족합니다
        </p>
      </div>
    );
  }

  const totalYearly = suggestions.reduce((s, x) => s + x.yearlySavingTon, 0);

  return (
    <div className="h-full rounded-xl bg-surface border border-border p-5">
      <div className="mb-4 border-b border-border pb-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="flex items-center gap-2 text-base lg:text-lg font-semibold text-text">
            <Lightbulb className="h-5 w-5 text-muted-foreground" />
            감축 제안
          </h4>
          <span className="text-xs text-muted-foreground">
            최근 월 배출량 기준
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          제안 모두 적용 시 연간 약{' '}
          <span className="font-semibold text-trend-down tabular-nums">
            {totalYearly.toFixed(2)} tCO₂e
          </span>{' '}
          감소 가능
        </p>
      </div>

      <ul className="space-y-3">
        {suggestions.map((s) => (
          <li
            key={s.type}
            className="flex items-start gap-3 rounded-lg border border-border bg-bg p-3"
          >
            <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-trend-down/10 text-trend-down">
              <ArrowDownCircle className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-text leading-snug">
                {highlightSavings(s.message)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                월 {s.monthlySavingTon.toFixed(2)} tCO₂e · 연{' '}
                {s.yearlySavingTon.toFixed(2)} tCO₂e
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
