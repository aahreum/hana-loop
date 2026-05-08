import { cn } from '@/shared/lib/utils';
import { UnitTooltip } from '@/shared/ui/unit-tooltip';
import type { ActivityData } from '@/shared/types/activity';
import {
  ACTIVITY_TYPE_LABELS,
  SCOPE_BADGE_CLASSES,
} from '@/shared/constants/activityLabels';

type RecentActivitiesTableProps = {
  activities: ActivityData[];
};

export function RecentActivitiesTable({
  activities,
}: RecentActivitiesTableProps) {
  if (activities.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        활동 데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-3 text-left font-medium text-muted-foreground">
              날짜
            </th>
            <th className="pb-3 text-left font-medium text-muted-foreground">
              유형
            </th>
            <th className="pb-3 text-left font-medium text-muted-foreground">
              설명
            </th>
            <th className="pb-3 text-right font-medium text-muted-foreground">
              수량
            </th>
            <th className="pb-3 text-right font-medium text-muted-foreground">
              <span className="inline-flex items-center justify-end gap-1">
                Scope
                <UnitTooltip
                  description={
                    <span className="block text-left">
                      GHG Protocol 배출 범위
                    </span>
                  }
                  comparison={
                    <span className="block space-y-0.5 text-left">
                      <span className="block">
                        <strong className="text-text">Scope 1</strong> 직접 배출
                        (연료 연소 등 자체 시설)
                      </span>
                      <span className="block">
                        <strong className="text-text">Scope 2</strong> 간접 배출
                        (구매 전기·열)
                      </span>
                      <span className="block">
                        <strong className="text-text">Scope 3</strong> 가치사슬
                        배출 (원자재·운송·폐기 등)
                      </span>
                    </span>
                  }
                />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {activities.map((a) => (
            <tr
              key={a.id}
              className="border-b border-border/50 hover:bg-muted/50 transition-colors"
            >
              <td className="py-3 tabular-nums text-text">{a.date}</td>
              <td className="py-3">
                <span className="inline-flex items-center rounded-full bg-primary-bg px-2 py-0.5 text-xs font-medium text-primary">
                  {ACTIVITY_TYPE_LABELS[a.type] ?? a.type}
                </span>
              </td>
              <td className="py-3 max-w-[200px] truncate text-text">
                {a.description}
              </td>
              <td className="py-3 text-right tabular-nums text-text">
                {a.quantity.toLocaleString()} {a.unit}
              </td>
              <td className="py-3 text-right">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                    SCOPE_BADGE_CLASSES[a.scope] ??
                      'bg-muted text-muted-foreground border-border',
                  )}
                >
                  Scope {a.scope}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
