import { cn } from '@/shared/lib/utils';
import type { ActivityData } from '@/shared/types/activity';

const TYPE_LABELS: Record<string, string> = {
  electricity: '전기',
  fuel: '연료',
  raw_material: '원자재',
  transport: '운송',
  waste: '폐기물',
};

const SCOPE_COLORS: Record<number, string> = {
  1: 'bg-scope1/10 text-scope1 border-scope1/20',
  2: 'bg-scope2/10 text-scope2 border-scope2/20',
  3: 'bg-scope3/10 text-scope3 border-scope3/20',
};

type RecentActivitiesTableProps = {
  activities: ActivityData[];
};

export function RecentActivitiesTable({
  activities,
}: RecentActivitiesTableProps) {
  if (activities.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-gray-400">
        활동 데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-3 text-left font-medium text-gray-500">날짜</th>
            <th className="pb-3 text-left font-medium text-gray-500">유형</th>
            <th className="pb-3 text-left font-medium text-gray-500">설명</th>
            <th className="pb-3 text-right font-medium text-gray-500">수량</th>
            <th className="pb-3 text-right font-medium text-gray-500">Scope</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((a) => (
            <tr
              key={a.id}
              className="border-b border-border/50 hover:bg-gray-50/50 transition-colors"
            >
              <td className="py-3 tabular-nums text-gray-700">{a.date}</td>
              <td className="py-3">
                <span className="inline-flex items-center rounded-full bg-primary-bg px-2 py-0.5 text-xs font-medium text-primary">
                  {TYPE_LABELS[a.type] ?? a.type}
                </span>
              </td>
              <td className="py-3 max-w-[200px] truncate text-gray-700">
                {a.description}
              </td>
              <td className="py-3 text-right tabular-nums text-gray-700">
                {a.quantity.toLocaleString()} {a.unit}
              </td>
              <td className="py-3 text-right">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                    SCOPE_COLORS[a.scope] ?? 'bg-gray-100 text-gray-600',
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
