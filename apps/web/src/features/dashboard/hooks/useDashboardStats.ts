import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard.api'
export function useDashboardStats() {
  const query = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
  return {
    stats: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
