import type { Metadata } from 'next';
import '@fontsource/pretendard/400.css';
import '@fontsource/pretendard/500.css';
import '@fontsource/pretendard/600.css';
import '@fontsource/pretendard/700.css';
import './globals.css';
import { QueryProvider } from '@/shared/providers/QueryProvider';
import { AppShell } from '@/widgets/layout/ui/AppShell';
import { Toaster } from '@/shared/ui/sonner';

export const metadata: Metadata = {
  title: 'HanaLoop Carbon Dashboard',
  description: '기업 탄소 배출량 관리 및 시각화 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          <AppShell>{children}</AppShell>
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
