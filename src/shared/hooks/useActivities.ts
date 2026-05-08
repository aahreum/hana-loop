import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getActivities,
  createActivity,
  deleteActivity,
} from '@/shared/lib/api';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import type {
  ActivityData,
  CreateActivityInput,
} from '@/shared/types/activity';
import type { EmissionResult } from '@/shared/types/emission';

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

// 낙관적 업데이트: 클릭 즉시 행이 사라지고, 실패 시 onError 에서 스냅샷으로 롤백.
// jitter 200~800ms + maybeFail 15% 환경에서 dim 처리보다 자연스러운 UX.
type DeleteActivityContext = {
  prevActivities: [readonly unknown[], ActivityData[] | undefined][];
  prevResults: [readonly unknown[], EmissionResult[] | undefined][];
};

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation<{ id: string }, Error, string, DeleteActivityContext>({
    mutationFn: (id: string) => deleteActivity(id),
    onMutate: async (id) => {
      // 진행 중인 fetch 가 낙관적 업데이트를 덮어쓰지 못하도록 cancel
      await Promise.all([
        queryClient.cancelQueries({ queryKey: QUERY_KEYS.activities }),
        queryClient.cancelQueries({ queryKey: QUERY_KEYS.emissionResults }),
      ]);

      // 모든 필터된 캐시 변형까지 포함하여 스냅샷 (롤백용)
      const prevActivities = queryClient.getQueriesData<ActivityData[]>({
        queryKey: QUERY_KEYS.activities,
      });
      const prevResults = queryClient.getQueriesData<EmissionResult[]>({
        queryKey: QUERY_KEYS.emissionResults,
      });

      // activities 캐시에서 해당 id 제거 (목록·KPI 즉시 반영)
      queryClient.setQueriesData<ActivityData[]>(
        { queryKey: QUERY_KEYS.activities },
        (old) => old?.filter((a) => a.id !== id),
      );
      // emission_results 캐시도 함께 제거 — DB 는 ON DELETE CASCADE 라 곧 동기화됨
      queryClient.setQueriesData<EmissionResult[]>(
        { queryKey: QUERY_KEYS.emissionResults },
        (old) => old?.filter((r) => r.activityId !== id),
      );

      return { prevActivities, prevResults };
    },
    onError: (_err, _id, context) => {
      // 실패 시 스냅샷 복원
      if (!context) return;
      for (const [key, data] of context.prevActivities) {
        queryClient.setQueryData(key, data);
      }
      for (const [key, data] of context.prevResults) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => {
      // 성공이든 실패든 서버와 최종 동기화
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activities });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.emissionResults });
    },
  });
}
