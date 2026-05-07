import { useQuery } from '@tanstack/react-query';
import { getEmissionResults } from '@/shared/lib/api';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

export function useEmissionResults(params?: {
  companyId?: string;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.emissionResultsByCompany(
      params?.companyId ?? '',
      params?.from,
      params?.to,
    ),
    queryFn: () => getEmissionResults(params),
    enabled: !!params?.companyId,
  });
}
