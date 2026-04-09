'use client'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '../api/auth.api'
import { useAuthStore } from './useAuthStore'
import { useEffect } from 'react'
export function useCurrentUser() {
  const { token, setUser, logout } = useAuthStore()
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    enabled: Boolean(token),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  // Sync React Query result → Zustand store
  useEffect(() => {
    if (query.data?.data) {
      setUser(query.data.data)
    }
  }, [query.data, setUser])
  // If the /me call fails with 401, the token is stale → logout
  useEffect(() => {
    if (query.error) {
      const status = (query.error as any)?.response?.status
      if (status === 401 || status === 403) {
        logout()
      }
    }
  }, [query.error, logout])
  return {
    user: query.data?.data ?? null,
    isLoading: query.isLoading && Boolean(token),
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
