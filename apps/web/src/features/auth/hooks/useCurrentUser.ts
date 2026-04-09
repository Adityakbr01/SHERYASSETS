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
    enabled: true, // Attempt /me to allow automatic bootstrap via refresh cookie
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  // Sync React Query result → Zustand store
  useEffect(() => {
    if (query.data?.data) {
      setUser(query.data.data)
    }
  }, [query.data, setUser])
  return {
    user: query.data?.data ?? null,
    isLoading: query.isLoading && Boolean(token),
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
