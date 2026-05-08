'use client';

import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Insight, InsightTone } from '@/shared/lib/insights';

type InsightListProps = {
  title?: string;
  insights: Insight[];
  /** 데이터가 없을 때 안내 문구. */
  emptyMessage?: string;
};

/**
 * 메시지 안의 수치(% / %↓ / %↑) 토큰을 찾아 굵게 강조한다.
 * 룰 함수는 평문만 만들고, 강조 표시는 렌더 시점에서만 처리한다.
 */
const NUMBER_PATTERN = /(\d+(?:\.\d+)?%[↓↑]?)/g;

function highlightNumbers(message: string): React.ReactNode[] {
  return message.split(NUMBER_PATTERN).map((part, i) =>
    /^\d+(?:\.\d+)?%[↓↑]?$/.test(part) ? (
      <strong key={i} className="font-semibold text-text">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

const toneIcon: Record<InsightTone, React.ReactNode> = {
  good: <TrendingDown className="h-4 w-4" />,
  warn: <TrendingUp className="h-4 w-4" />,
  neutral: <Minus className="h-4 w-4" />,
};

const toneStyle: Record<InsightTone, string> = {
  good: 'bg-trend-down/10 text-trend-down',
  warn: 'bg-trend-up/10 text-trend-up',
  neutral: 'bg-gray-100 text-gray-500',
};

export function InsightList({
  title,
  insights,
  emptyMessage = '인사이트를 생성할 데이터가 부족합니다',
}: InsightListProps) {
  if (insights.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }
  return (
    <div className="space-y-2.5">
      {title && (
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          {title}
        </div>
      )}
      <ul className="space-y-2">
        {insights.map((ins, i) => (
          <li
            key={i}
            className="flex items-center gap-2.5 text-sm leading-snug text-text"
          >
            <span
              className={cn(
                'flex h-6 w-6 flex-none items-center justify-center rounded-full',
                toneStyle[ins.tone],
              )}
              aria-hidden
            >
              {toneIcon[ins.tone]}
            </span>
            <span>{highlightNumbers(ins.message)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
