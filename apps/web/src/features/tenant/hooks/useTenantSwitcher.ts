import { useEffect, useState } from 'react'
import { useTenantBySlug } from './useTenants'
import { authApi } from '../../auth/api/auth.api'
import { useAuthStore } from '../../auth/hooks/useAuthStore'
import { useQueryClient } from '@tanstack/react-query'
/**
 * Ensures the backend JWT token matches the requested tenant slug.
 */
export function useTenantSwitcher(slug: string) {
  const { data: tenant, isLoading: isTenantLoading, isError } = useTenantBySlug(slug)
  const [isSwitching, setIsSwitching] = useState(true)
  const queryClient = useQueryClient()
  // Wait, I can check if current token is already this tenant.
  // We can decode JWT in frontend or just force a switch if we navigate.
  // For safety, force switch on mount of tenant dashboard.
  useEffect(() => {
    let mounted = true
    async function ensureContext() {
      if (!tenant) return
      try {
        setIsSwitching(true)
        const res = await authApi.switchTenant(tenant.tenantId || tenant._id)
        if (res?.accessToken) {
          useAuthStore.getState().setToken(res.accessToken)
          // Invalidate cached API keys and memberships since context changed
          queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
          queryClient.invalidateQueries({ queryKey: ['memberships'] })
        }
      } catch (err) {
        console.error('Failed to switch tenant context:', err)
      } finally {
        if (mounted) setIsSwitching(false)
      }
    }
    ensureContext()
    return () => {
      mounted = false
    }
  }, [tenant, queryClient])
  return {
    tenant,
    isReady: !isTenantLoading && !isSwitching && tenant !== undefined,
    isLoading: isTenantLoading || isSwitching,
    isError
  }
}
