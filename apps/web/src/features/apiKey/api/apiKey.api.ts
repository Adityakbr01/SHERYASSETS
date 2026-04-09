import { apiClient } from '@/src/lib/api'
export interface IApiKey {
  _id: string
  tenantId: string
  name: string
  keyHash?: string
  prefix: string
  status: 'active' | 'revoked'
  createdAt: string
  updatedAt?: string
  lastUsedAt?: string
}
export interface ApiKeyListParams {
  page?: number
  limit?: number
  status?: string
  search?: string
}
export interface ApiKeyListResponse {
  success: boolean
  data: IApiKey[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    isCache: boolean
  }
}
export const apiKeyApi = {
  list: async (params?: ApiKeyListParams): Promise<ApiKeyListResponse> => {
    const { data } = await apiClient.get('/api-keys', { params })
    return data
  },
  create: async (name: string): Promise<{ success: boolean; data: any }> => {
    const { data } = await apiClient.post('/api-keys', { name })
    return data
  },
  revoke: async (keyId: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.patch(`/api-keys/${keyId}/revoke`)
    return data
  },
}
