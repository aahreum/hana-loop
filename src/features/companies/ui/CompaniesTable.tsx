import type { Company } from '@/shared/types/company';

type CompaniesTableProps = {
  companies: Company[];
};

export function CompaniesTable({ companies }: CompaniesTableProps) {
  if (companies.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-400">
        기업 데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-gray-50/50">
            {['기업명', '국가', '등록일'].map((h) => (
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
          {companies.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-700">{c.name}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {c.country}
                </span>
              </td>
              <td className="px-4 py-3 tabular-nums text-xs text-gray-500">
                {new Date(c.createdAt).toLocaleDateString('ko-KR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
