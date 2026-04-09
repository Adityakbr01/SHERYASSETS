import { useQuery } from '@tanstack/react-query'
import { membershipApi } from '../api/membership.api'
export function useTenantMembers(isContextReady: boolean) {
  return useQuery({
    queryKey: ['memberships', 'tenantMembers'],
    queryFn: () => membershipApi.getTenantMembers(),
    enabled: isContextReady,
    staleTime: 5 * 60 * 1000,
  })
}
