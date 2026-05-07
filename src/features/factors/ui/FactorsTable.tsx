import { cn } from '@/shared/lib/utils';
import type { EmissionFactor } from '@/shared/types/factor';
import {
  ACTIVITY_TYPE_LABELS,
  SCOPE_BADGE_CLASSES,
} from '@/shared/constants/activityLabels';

type FactorsTableProps = {
  factors: EmissionFactor[];
};

export function FactorsTable({ factors }: FactorsTableProps) {
  if (factors.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        배출계수 데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {[
              '카테고리',
              '이름',
              '유형',
              '배출계수',
              '단위',
              'Scope',
              '유효기간',
              '출처',
            ].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {factors.map((f) => (
            <tr key={f.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {f.category}
              </td>
              <td className="px-4 py-3 font-medium text-text">{f.name}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-primary-bg px-2 py-0.5 text-xs font-medium text-primary">
                  {ACTIVITY_TYPE_LABELS[f.activityType] ?? f.activityType}
                </span>
              </td>
              <td className="px-4 py-3 tabular-nums text-text">{f.factor}</td>
              <td className="px-4 py-3 text-muted-foreground">{f.unit}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                    SCOPE_BADGE_CLASSES[f.scope] ??
                      'bg-muted text-muted-foreground border-border',
                  )}
                >
                  Scope {f.scope}
                </span>
              </td>
              <td className="px-4 py-3 tabular-nums text-xs text-muted-foreground">
                {f.validFrom} ~ {f.validTo ?? '현재'}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {f.source}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
