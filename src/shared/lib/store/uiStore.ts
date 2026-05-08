import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | null;

type UiStore = {
  /** 모바일 드로어 오버레이 열림 상태 (< lg) */
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  /** 데스크탑 사이드바 접힘 상태 (>= lg) — 사용자 환경설정으로 persist */
  desktopSidebarCollapsed: boolean;
  setDesktopSidebarCollapsed: (collapsed: boolean) => void;
  toggleDesktopSidebar: () => void;

  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      desktopSidebarCollapsed: false,
      setDesktopSidebarCollapsed: (collapsed) =>
        set({ desktopSidebarCollapsed: collapsed }),
      toggleDesktopSidebar: () =>
        set((s) => ({ desktopSidebarCollapsed: !s.desktopSidebarCollapsed })),

      theme: null,
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'hanaloop-ui',
      partialize: (state) => ({
        theme: state.theme,
        desktopSidebarCollapsed: state.desktopSidebarCollapsed,
      }),
    },
  ),
);
