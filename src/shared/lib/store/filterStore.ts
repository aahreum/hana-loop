import { create } from 'zustand';
import { DATASET_FROM, DATASET_TO } from '@/shared/constants/datasetRange';

type FilterStore = {
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;

  from: string; // 'YYYY-MM'
  to: string; // 'YYYY-MM'
  setDateRange: (from: string, to: string) => void;
};

export const useFilterStore = create<FilterStore>((set) => ({
  selectedCompanyId: null,
  setSelectedCompanyId: (id) => set({ selectedCompanyId: id }),

  from: DATASET_FROM,
  to: DATASET_TO,
  setDateRange: (from, to) => set({ from, to }),
}));
