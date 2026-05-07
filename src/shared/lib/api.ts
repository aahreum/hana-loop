// 브라우저 → Next.js API Route 호출용 fetch 클라이언트.
// 서버 직접 접근 금지. 모든 데이터 요청은 이 모듈을 통해서만.

import type {
  ActivityData,
  CreateActivityInput,
} from '@/shared/types/activity';
import type { Company } from '@/shared/types/company';
import type { EmissionFactor } from '@/shared/types/factor';
import type { EmissionResult } from '@/shared/types/emission';
import type { Post, CreatePostInput } from '@/shared/types/post';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Companies ────────────────────────────────────────────────

export const getCompanies = () => request<Company[]>('/api/companies');

export const getCompany = (id: string) =>
  request<Company>(`/api/companies/${id}`);

// ── Activities ───────────────────────────────────────────────

export const getActivities = (params?: {
  companyId?: string;
  yearMonth?: string;
  type?: string;
}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params ?? {}).filter(([, v]) => v !== undefined) as [
        string,
        string,
      ][],
    ),
  ).toString();
  return request<ActivityData[]>(`/api/activities${qs ? `?${qs}` : ''}`);
};

export const createActivity = (body: CreateActivityInput) =>
  request<ActivityData>('/api/activities', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const deleteActivity = (id: string) =>
  request<{ id: string }>(`/api/activities/${id}`, { method: 'DELETE' });

// ── Emission Factors ─────────────────────────────────────────

export const getFactors = (activityType?: string) => {
  const qs = activityType ? `?activityType=${activityType}` : '';
  return request<EmissionFactor[]>(`/api/factors${qs}`);
};

// ── Emission Results ─────────────────────────────────────────

export const getEmissionResults = (params?: {
  companyId?: string;
  yearMonth?: string;
  from?: string;
  to?: string;
}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params ?? {}).filter(([, v]) => v !== undefined) as [
        string,
        string,
      ][],
    ),
  ).toString();
  return request<EmissionResult[]>(
    `/api/emission-results${qs ? `?${qs}` : ''}`,
  );
};

// ── Posts ────────────────────────────────────────────────────

export const getPosts = (params?: {
  resourceUid?: string;
  dateTime?: string;
}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params ?? {}).filter(([, v]) => v !== undefined) as [
        string,
        string,
      ][],
    ),
  ).toString();
  return request<Post[]>(`/api/posts${qs ? `?${qs}` : ''}`);
};

export const createPost = (body: CreatePostInput) =>
  request<Post>('/api/posts', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const updatePost = (id: string, body: Partial<CreatePostInput>) =>
  request<Post>(`/api/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

export const deletePost = (id: string) =>
  request<{ id: string }>(`/api/posts/${id}`, { method: 'DELETE' });
