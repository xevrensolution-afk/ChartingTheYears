import apiClient from '@/lib/apiClient';
import type { ApiEnvelope } from '@/features/auth/types';
import type { SiteSettings } from './types';

export async function fetchSiteSettings(): Promise<Partial<SiteSettings>> {
  const res = await apiClient.get<ApiEnvelope<SiteSettings>>('/api/settings');
  if (!res.data.success) throw new Error('Failed to fetch settings');
  return res.data.data;
}
