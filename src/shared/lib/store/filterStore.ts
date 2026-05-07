import { create } from 'zustand';

type FilterStore = {
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;

  from: string; // 'YYYY-MM'
  to: string; // 'YYYY-MM'
  setDateRange: (from: string, to: string) => void;
};

const now = new Date();
const defaultTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const eighteenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 17, 1);
const defaultFrom = `${eighteenMonthsAgo.getFullYear()}-${String(eighteenMonthsAgo.getMonth() + 1).padStart(2, '0')}`;

export const useFilterStore = create<FilterStore>((set) => ({
  selectedCompanyId: null,
  setSelectedCompanyId: (id) => set({ selectedCompanyId: id }),

  from: defaultFrom,
  to: defaultTo,
  setDateRange: (from, to) => set({ from, to }),
}));
