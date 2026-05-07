import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getActivities,
  createActivity,
  deleteActivity,
} from '@/shared/lib/api';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import type { CreateActivityInput } from '@/shared/types/activity';

export function useActivities(params?: {
  companyId?: string;
  yearMonth?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.activitiesFiltered(params ?? {}),
    queryFn: () => getActivities(params),
    enabled: !!params?.companyId,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateActivityInput) => createActivity(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activities });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.emissionResults });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activities });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.emissionResults });
    },
  });
}
