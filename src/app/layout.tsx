import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { QueryProvider } from '@/shared/providers/QueryProvider';
import { AppShell } from '@/widgets/layout/ui/AppShell';
import { Toaster } from '@/shared/ui/sonner';
import { TooltipProvider } from '@/shared/ui/tooltip';

const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 930',
  variable: '--font-pretendard',
});

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
    <html lang="ko" className={pretendard.variable}>
      <body>
        <QueryProvider>
          <TooltipProvider delayDuration={200}>
            <AppShell>{children}</AppShell>
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
