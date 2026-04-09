import { useQuery } from '@tanstack/react-query';
import { billingApi } from '../api/billing.api';
export function useActiveSubscription(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['activeSubscription', tenantId],
    queryFn: () => billingApi.getActiveSubscription(tenantId!),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
