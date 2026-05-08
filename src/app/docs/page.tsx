import { SwaggerDocsContainer } from '@/features/api-docs/container/SwaggerDocsContainer';

export const metadata = {
  title: 'API 문서 — HanaLoop',
};

export default function DocsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">API 문서</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          HanaLoop Carbon Dashboard 내부 API 의 OpenAPI 3.0 명세. Zod 스키마에서
          자동 생성된다.
        </p>
      </div>
      <SwaggerDocsContainer />
    </div>
  );
}
