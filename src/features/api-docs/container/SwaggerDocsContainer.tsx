'use client';

import dynamic from 'next/dynamic';

// swagger-ui-react 는 브라우저 DOM API에 의존하므로 SSR 비활성화.
const SwaggerDocsView = dynamic(
  () =>
    import('@/features/api-docs/ui/SwaggerDocsView').then(
      (m) => m.SwaggerDocsView,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        API 문서를 불러오는 중...
      </div>
    ),
  },
);

export function SwaggerDocsContainer() {
  return <SwaggerDocsView />;
}
