import { create } from 'zustand';

type FilterStore = {
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;

  from: string; // 'YYYY-MM'
  to: string; // 'YYYY-MM'
  setDateRange: (from: string, to: string) => void;
};

// CT-045 원본 데이터 기간: 2025-01 ~ 2025-08
const defaultFrom = '2025-01';
const defaultTo = '2025-08';

export const useFilterStore = create<FilterStore>((set) => ({
  selectedCompanyId: null,
  setSelectedCompanyId: (id) => set({ selectedCompanyId: id }),

  from: defaultFrom,
  to: defaultTo,
  setDateRange: (from, to) => set({ from, to }),
}));
