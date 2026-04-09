import { apiClient } from '@/src/lib/api'
export const membershipApi = {
  getTenantMembers: async () => {
    const { data } = await apiClient.get('/memberships/tenant-members')
    return data.data // assuming standardized ApiResponse uses `data` field
  },
}
