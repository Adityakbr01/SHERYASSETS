import { apiClient } from '@/src/lib/api';
import type { Plan } from '../components/PricingCard';
export interface PlanResponse {
  success: boolean;
  message: string;
  data: Plan[];
}
export const pricingApi = {
  getPlans: async (): Promise<PlanResponse> => {
    return apiClient.get('/plans').then((res) => res.data);
  },
};
