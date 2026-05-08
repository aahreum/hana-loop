import { SwaggerDocsContainer } from '@/features/api-docs/container/SwaggerDocsContainer';

export const metadata = {
  title: 'API 문서 — HanaLoop',
};

export default function DocsPage() {
  return <SwaggerDocsContainer />;
}
