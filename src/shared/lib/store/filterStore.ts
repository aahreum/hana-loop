import { create } from 'zustand';

type FilterStore = {
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;

  // 빈 문자열 = 전체 기간. 데이터 응답에서 동적으로 min/max 추출하므로 hardcoded 기본값 불필요.
  from: string; // 'YYYY-MM' | ''
  to: string; // 'YYYY-MM' | ''
  setDateRange: (from: string, to: string) => void;
};

export const useFilterStore = create<FilterStore>((set) => ({
  selectedCompanyId: null,
  setSelectedCompanyId: (id) => set({ selectedCompanyId: id }),

  from: '',
  to: '',
  setDateRange: (from, to) => set({ from, to }),
}));
