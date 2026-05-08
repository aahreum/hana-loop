import type { Company } from '@/shared/types/company';

type CompaniesTableProps = {
  companies: Company[];
};

const COUNTRY_BADGE_CLASS =
  'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground shrink-0';

export function CompaniesTable({ companies }: CompaniesTableProps) {
  if (companies.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        기업 데이터가 없습니다
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-2 lg:hidden">
        {companies.map((c) => (
          <li
            key={c.id}
            className="rounded-lg border border-border bg-background p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-text">
                {c.name}
              </span>
              <span className={COUNTRY_BADGE_CLASS}>{c.country}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground tabular-nums">
              등록일: {new Date(c.createdAt).toLocaleDateString('ko-KR')}
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {['기업명', '국가', '등록일'].map((h) => (
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
            {companies.map((c) => (
              <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium text-text">{c.name}</td>
                <td className="px-4 py-3">
                  <span className={COUNTRY_BADGE_CLASS}>{c.country}</span>
                </td>
                <td className="px-4 py-3 tabular-nums text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString('ko-KR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
