'use client';

import { useEffect } from 'react';
import { useTheme } from '@/shared/hooks/useTheme';

// <html> 에 dark/light 클래스를 동기화한다.
// 모든 라우트(대시보드 / docs / 그 외)에 일관 적용되도록 root layout 에서 항상 mount.
export function ThemeApplier() {
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    if (theme !== null) {
      root.classList.add(theme);
    }
  }, [theme]);

  return null;
}
