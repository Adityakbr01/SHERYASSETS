import axios from 'axios';
import { useAuthStore } from '../../auth/hooks/useAuthStore';const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});export const dashboardApi = {
  getHealth: async () => {
    return axiosInstance.get('/health').then((res) => res.data);
  },
  getStats: async () => {
    // Aggregated stats route (placeholder or real)
    // Server currently has /auth, /tenants, /memberships, /plans, /api-keys, /billing, /assets, /usage
    // Let's assume there's a theoretical stats endpoint or we just return MOCKS for the rich dashboard
    return {
      tenants: 124,
      apiKeys: 420,
      activePlans: 12,
      memberships: 56,
      usageHits: 123049,
    };
  }
};
