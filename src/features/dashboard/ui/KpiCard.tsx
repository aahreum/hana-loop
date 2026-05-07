import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type KpiCardProps = {
  title: string;
  value: string;
  unit?: string;
  change?: number; // % change, positive = up, negative = down
  subtitle?: string;
  icon?: React.ReactNode;
};

export function KpiCard({
  title,
  value,
  unit,
  change,
  subtitle,
  icon,
}: KpiCardProps) {
  const isUp = change !== undefined && change > 0;
  const isDown = change !== undefined && change < 0;

  return (
    <div className="rounded-xl bg-surface border border-border p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-bg text-primary">
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

      {(change !== undefined || subtitle) && (
        <div className="flex items-center gap-1.5 text-sm">
          {change !== undefined && (
            <>
              {isUp && <TrendingUp className="h-4 w-4 text-trend-up" />}
              {isDown && <TrendingDown className="h-4 w-4 text-trend-down" />}
              {!isUp && !isDown && <Minus className="h-4 w-4 text-gray-400" />}
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
