import { useQuery } from '@tanstack/react-query';
import { pricingApi } from '../api/pricing.api';
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => pricingApi.getPlans(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
