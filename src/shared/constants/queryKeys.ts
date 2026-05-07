export const QUERY_KEYS = {
  companies: ['companies'] as const,
  company: (id: string) => ['companies', id] as const,

  activities: ['activities'] as const,
  activitiesByCompany: (companyId: string) =>
    ['activities', { companyId }] as const,
  activitiesFiltered: (params: Record<string, string | undefined>) =>
    ['activities', params] as const,

  factors: ['factors'] as const,
  factorByCategory: (category: string) => ['factors', category] as const,

  emissionResults: ['emission-results'] as const,
  emissionResultsByCompany: (companyId: string, from?: string, to?: string) =>
    ['emission-results', { companyId, from, to }] as const,
} as const;
