import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { InsightTone } from '@/shared/lib/insights';

type KpiCardProps = {
  title: string;
  value: string;
  unit?: string;
  change?: number; // % change, positive = up, negative = down
  subtitle?: string;
  /** 해석 문구 — 숫자 아래 강조 표시. 의미 중심 메시지를 담는다. */
  insight?: string;
  /** 카드 좌측 상태 stripe 컬러 — 'good' = 감소(녹), 'warn' = 증가(적), 'neutral' = 회색. */
  tone?: InsightTone;
  icon?: React.ReactNode;
};

const toneStripe: Record<InsightTone, string> = {
  good: 'bg-trend-down',
  warn: 'bg-trend-up',
  neutral: 'bg-gray-300',
};

const toneText: Record<InsightTone, string> = {
  good: 'text-trend-down',
  warn: 'text-trend-up',
  neutral: 'text-gray-500',
};

const toneIconBg: Record<InsightTone, string> = {
  good: 'bg-trend-down/10 text-trend-down',
  warn: 'bg-trend-up/10 text-trend-up',
  neutral: 'bg-primary-bg text-primary',
};

export function KpiCard({
  title,
  value,
  unit,
  change,
  subtitle,
  insight,
  tone,
  icon,
}: KpiCardProps) {
  const isUp = change !== undefined && change > 0;
  const isDown = change !== undefined && change < 0;

  return (
    <div className="relative overflow-hidden rounded-xl bg-surface border border-border p-5 flex flex-col gap-3">
      {tone && (
        <span
          aria-hidden
          className={cn('absolute left-0 top-0 h-full w-1', toneStripe[tone])}
        />
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && (
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              tone ? toneIconBg[tone] : 'bg-primary-bg text-primary',
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold tabular-nums text-text">
          {value}
        </span>
        {unit && <span className="mb-0.5 text-sm text-gray-500">{unit}</span>}
      </div>

      {insight && (
        <p
          className={cn(
            'text-xs font-medium leading-snug',
            tone ? toneText[tone] : 'text-text',
          )}
        >
          {insight}
        </p>
      )}

      {(change !== undefined || subtitle) && (
        <div className="flex items-center gap-1.5 text-xs">
          {change !== undefined && (
            <>
              {isUp && <TrendingUp className="h-3.5 w-3.5 text-trend-up" />}
              {isDown && (
                <TrendingDown className="h-3.5 w-3.5 text-trend-down" />
              )}
              {!isUp && !isDown && (
                <Minus className="h-3.5 w-3.5 text-gray-400" />
              )}
              <span
                className={cn(
                  'font-medium tabular-nums',
                  isUp && 'text-trend-up',
                  isDown && 'text-trend-down',
                  !isUp && !isDown && 'text-gray-400',
                )}
              >
                {isUp ? '+' : ''}
                {change.toFixed(1)}%
              </span>
            </>
          )}
          {subtitle && <span className="text-gray-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
