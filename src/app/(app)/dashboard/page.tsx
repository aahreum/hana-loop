import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { DashboardContainer } from '@/features/dashboard/container/DashboardContainer';
import {
  fetchCompaniesServer,
  fetchActivitiesServer,
  fetchEmissionResultsServer,
} from '@/shared/lib/server-data';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { DATASET_FROM, DATASET_TO } from '@/shared/constants/datasetRange';

// 매 요청마다 fresh 한 prefetch 가 필요 — 빌드 시점 prerender 방지.
export const dynamic = 'force-dynamic';

// 클라이언트 워터폴 제거를 위해 RSC 에서 직접 prefetch.
// jitter 는 우회하고, 사용자 인터랙션 시 API Route 경유로 시뮬레이션은 유지.
export default async function DashboardPage() {
  const queryClient = new QueryClient();

  const companies = await fetchCompaniesServer();
  queryClient.setQueryData(QUERY_KEYS.companies, companies);

  const firstCompanyId = companies[0]?.id;
  if (firstCompanyId) {
    const [activities, emissionResults] = await Promise.all([
      fetchActivitiesServer({ companyId: firstCompanyId }),
      fetchEmissionResultsServer({
        companyId: firstCompanyId,
        from: DATASET_FROM,
        to: DATASET_TO,
      }),
    ]);

    queryClient.setQueryData(
      QUERY_KEYS.activitiesFiltered({ companyId: firstCompanyId }),
      activities,
    );
    queryClient.setQueryData(
      QUERY_KEYS.emissionResultsByCompany(
        firstCompanyId,
        DATASET_FROM,
        DATASET_TO,
      ),
      emissionResults,
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContainer />
    </HydrationBoundary>
  );
}
