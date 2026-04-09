import { useQuery } from '@tanstack/react-query'
import { tenantApi } from '../api/tenant.api'
export function useMyTenants() {
  return useQuery({
    queryKey: ['tenants', 'myTenants'],
    queryFn: () => tenantApi.getMyTenants(),
    staleTime: 5 * 60 * 1000,
  })
}
export function useTenantBySlug(slug: string) {
  return useQuery({
    queryKey: ['tenants', 'slug', slug],
    queryFn: () => tenantApi.getTenantBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  })
}
