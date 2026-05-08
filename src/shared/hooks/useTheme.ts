'use client';

import { useUiStore } from '@/shared/lib/store/uiStore';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function useTheme() {
  const { theme, setTheme } = useUiStore();

  const resolvedTheme: 'light' | 'dark' = theme ?? getSystemTheme();

  const toggleTheme = () =>
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return { theme, resolvedTheme, setTheme, toggleTheme };
}
