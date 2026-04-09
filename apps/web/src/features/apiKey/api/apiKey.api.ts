import { apiClient } from '@/src/lib/api';export interface IApiKey {
  _id: string;
  tenantId: string;
  name: string;
  keyHash?: string; // Often masked or hash
  prefix: string;
  status: 'active' | 'revoked';
  createdAt: string;
  lastUsedAt?: string;
}export const apiKeyApi = {
  list: async (): Promise<{ success: boolean; data: IApiKey[] }> => {
    const { data } = await apiClient.get('/api-keys');
    return data;
  },
  create: async (name: string): Promise<{ success: boolean; data: any }> => {
    const { data } = await apiClient.post('/api-keys', { name });
    return data;
  },
  revoke: async (keyId: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.patch(`/api-keys/${keyId}/revoke`);
    return data;
  }
};
