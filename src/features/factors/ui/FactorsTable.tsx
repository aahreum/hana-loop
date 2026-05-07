import { cn } from '@/shared/lib/utils';
import type { EmissionFactor } from '@/shared/types/factor';

const TYPE_LABELS: Record<string, string> = {
  electricity: '전기',
  fuel: '연료',
  raw_material: '원자재',
  transport: '운송',
  waste: '폐기물',
};

const SCOPE_BADGE: Record<number, string> = {
  1: 'text-scope1 bg-scope1/10 border-scope1/20',
  2: 'text-scope2 bg-scope2/10 border-scope2/20',
  3: 'text-scope3 bg-scope3/10 border-scope3/20',
};

type FactorsTableProps = {
  factors: EmissionFactor[];
};

export function FactorsTable({ factors }: FactorsTableProps) {
  if (factors.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-400">
        배출계수 데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-gray-50/50">
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
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {factors.map((f) => (
            <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-gray-500">
                {f.category}
              </td>
              <td className="px-4 py-3 font-medium text-gray-700">{f.name}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-primary-bg px-2 py-0.5 text-xs font-medium text-primary">
                  {TYPE_LABELS[f.activityType] ?? f.activityType}
                </span>
              </td>
              <td className="px-4 py-3 tabular-nums text-gray-700">
                {f.factor}
              </td>
              <td className="px-4 py-3 text-gray-500">{f.unit}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                    SCOPE_BADGE[f.scope] ??
                      'bg-gray-100 text-gray-600 border-gray-200',
                  )}
                >
                  Scope {f.scope}
                </span>
              </td>
              <td className="px-4 py-3 tabular-nums text-xs text-gray-500">
                {f.validFrom} ~ {f.validTo ?? '현재'}
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">{f.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
