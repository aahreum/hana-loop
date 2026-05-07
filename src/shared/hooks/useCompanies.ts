import { useQuery } from '@tanstack/react-query';
import { getCompanies } from '@/shared/lib/api';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

export function useCompanies() {
  return useQuery({
    queryKey: QUERY_KEYS.companies,
    queryFn: getCompanies,
  });
}
