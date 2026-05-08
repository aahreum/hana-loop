import { cn } from '@/shared/lib/utils';
import type { EmissionFactor } from '@/shared/types/factor';
import {
  ACTIVITY_TYPE_LABELS,
  SCOPE_BADGE_CLASSES,
} from '@/shared/constants/activityLabels';

type FactorsTableProps = {
  factors: EmissionFactor[];
};

const TYPE_BADGE_CLASS =
  'inline-flex items-center rounded-full bg-primary-bg px-2 py-0.5 text-xs font-medium text-primary-pressed shrink-0';

const scopeBadgeClass = (scope: EmissionFactor['scope']) =>
  cn(
    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
    SCOPE_BADGE_CLASSES[scope] ??
      'bg-muted text-muted-foreground border-border',
  );

export function FactorsTable({ factors }: FactorsTableProps) {
  if (factors.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        배출계수 데이터가 없습니다
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-2 lg:hidden">
        {factors.map((f) => (
          <li
            key={f.id}
            className="rounded-lg border border-border bg-background p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className={TYPE_BADGE_CLASS}>
                  {ACTIVITY_TYPE_LABELS[f.activityType] ?? f.activityType}
                </span>
                <span className="truncate text-sm font-medium text-text">
                  {f.name}
                </span>
              </div>
              <span className={scopeBadgeClass(f.scope)}>Scope {f.scope}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="tabular-nums text-sm font-medium text-text">
                {f.factor}{' '}
                <span className="font-normal text-muted-foreground">
                  {f.unit}
                </span>
              </span>
              <span className="tabular-nums text-xs text-muted-foreground">
                {f.validFrom} ~ {f.validTo ?? '현재'}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-mono truncate">{f.category}</span>
              <span className="shrink-0">{f.source}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto lg:block">
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
                  <span className={TYPE_BADGE_CLASS}>
                    {ACTIVITY_TYPE_LABELS[f.activityType] ?? f.activityType}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums text-text">{f.factor}</td>
                <td className="px-4 py-3 text-muted-foreground">{f.unit}</td>
                <td className="px-4 py-3">
                  <span className={scopeBadgeClass(f.scope)}>
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
    </>
  );
}
