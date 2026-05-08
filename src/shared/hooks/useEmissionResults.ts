import { useQuery } from '@tanstack/react-query';
import { getEmissionResults } from '@/shared/lib/api';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

export function useEmissionResults(params?: {
  companyId?: string;
  from?: string;
  to?: string;
}) {
  // 빈 문자열은 "필터 없음" 으로 정규화 — RSC prefetch (from/to 없이) 와 queryKey 매칭.
  const from = params?.from || undefined;
  const to = params?.to || undefined;
  return useQuery({
    queryKey: QUERY_KEYS.emissionResultsByCompany(
      params?.companyId ?? '',
      from,
      to,
    ),
    queryFn: () =>
      getEmissionResults({ companyId: params?.companyId, from, to }),
    enabled: !!params?.companyId,
  });
}
