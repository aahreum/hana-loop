import { useQuery } from '@tanstack/react-query';
import { getFactors } from '@/shared/lib/api';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

export function useFactors(activityType?: string) {
  return useQuery({
    queryKey: activityType
      ? QUERY_KEYS.factorByCategory(activityType)
      : QUERY_KEYS.factors,
    queryFn: () => getFactors(activityType),
  });
}
