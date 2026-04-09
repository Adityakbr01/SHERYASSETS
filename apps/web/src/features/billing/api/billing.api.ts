import { apiClient } from '@/src/lib/api';
import type { Plan } from '../../pricing/components/PricingCard';
export interface Subscription {
  _id: string;
  tenantId: string;
  planId: Plan;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}
export interface SubscriptionResponse {
  success: boolean;
  message: string;
  data: Subscription | null;
}
export const billingApi = {
  getActiveSubscription: async (tenantId: string): Promise<SubscriptionResponse> => {
    return apiClient.get(`/billing/active/${tenantId}`).then((res) => res.data);
  },
};
