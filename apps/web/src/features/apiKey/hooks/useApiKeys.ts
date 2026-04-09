import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ApiKeyListParams, apiKeyApi } from '../api/apiKey.api'
import { useState } from 'react'
export const apiKeyQueryKeys = {
  all: ['apiKeys'] as const,
  list: (params: ApiKeyListParams) => [...apiKeyQueryKeys.all, 'list', params] as const,
}
export function useApiKeys(initialParams?: ApiKeyListParams) {
  const queryClient = useQueryClient()
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [params, setParams] = useState<ApiKeyListParams>({
    page: 1,
    limit: 5,
    status: 'all',
    search: '',
    ...initialParams,
  })
  // ── List keys (paginated) ──
  const listQuery = useQuery({
    queryKey: apiKeyQueryKeys.list(params),
    queryFn: () => apiKeyApi.list(params),
    placeholderData: keepPreviousData, // keep old data visible while fetching next page
  })
  // ── Create key ──
  const createMutation = useMutation({
    mutationFn: (name: string) => apiKeyApi.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.all })
      setMutationError(null)
    },
    onError: (err: any) => {
      setMutationError(err?.response?.data?.message || 'Failed to create API key')
    },
  })
  // ── Revoke key ──
  const revokeMutation = useMutation({
    mutationFn: (keyId: string) => apiKeyApi.revoke(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyQueryKeys.all })
      setMutationError(null)
    },
    onError: (err: any) => {
      setMutationError(err?.response?.data?.message || 'Failed to revoke API key')
    },
  })
  const createKey = async (name: string) => {
    setMutationError(null)
    try {
      const res = await createMutation.mutateAsync(name)
      return res.data
    } catch {
      return null
    }
  }
  const revokeKey = async (keyId: string) => {
    await revokeMutation.mutateAsync(keyId)
  }
  // ── Pagination helpers ──
  const setPage = (page: number) => setParams((p) => ({ ...p, page }))
  const setSearch = (search: string) => setParams((p) => ({ ...p, search, page: 1 }))
  const setStatus = (status: string) => setParams((p) => ({ ...p, status, page: 1 }))
  const meta = listQuery.data?.meta ?? { total: 0, page: 1, limit: 5, totalPages: 1 }
  return {
    keys: listQuery.data?.data ?? [],
    loading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    error: mutationError || (listQuery.isError ? 'Failed to load API keys' : null),
    meta,
    params,
    setPage,
    setSearch,
    setStatus,
    createKey,
    revokeKey,
  }
}
