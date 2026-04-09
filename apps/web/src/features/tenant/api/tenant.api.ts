import { apiClient } from '@/src/lib/api'
export interface TenantInfo {
  tenantId: string
  _id: string
  name: string
  slug: string
  role: string
  status: string
  planId: string
}
export const tenantApi = {
  getMyTenants: async (): Promise<TenantInfo[]> => {
    return apiClient.get('/tenants/my-tenants').then((res) => res.data?.data)
  },
  getTenantBySlug: async (slug: string): Promise<TenantInfo> => {
    return apiClient.get(`/tenants/slug/${slug}`).then((res) => res.data?.data)
  },
}
