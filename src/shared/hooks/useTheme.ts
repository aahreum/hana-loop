'use client';

import { useState, useEffect } from 'react';
import { useUiStore } from '@/shared/lib/store/uiStore';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function useTheme() {
  const { theme, setTheme } = useUiStore();
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    getSystemTheme,
  );

  // theme === null일 때 OS 설정 변경을 감지해 아이콘 동기화
  useEffect(() => {
    if (theme !== null) return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? 'dark' : 'light');

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const resolvedTheme: 'light' | 'dark' = theme ?? systemTheme;

  const toggleTheme = () =>
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return { theme, resolvedTheme, setTheme, toggleTheme };
}
