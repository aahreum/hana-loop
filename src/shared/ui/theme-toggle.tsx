'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useTheme } from '@/shared/hooks/useTheme';

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // hydration 전: 서버 렌더와 동일한 상태(light 기본값 = Moon)를 유지
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="테마 전환">
        <Moon className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={
        resolvedTheme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'
      }
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
