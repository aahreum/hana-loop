import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between bg-sidebar-bg px-4 text-sidebar-text">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white text-xs font-bold"
            style={{ background: 'var(--brand-gradient)' }}
            aria-hidden
          >
            H
          </div>
          <span className="text-base font-semibold tracking-tight">
            HanaLoop API
          </span>
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-sidebar-muted hover:text-sidebar-text hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          대시보드로
        </Link>
      </header>
      <main className="flex-1 bg-white">{children}</main>
    </div>
  );
}
