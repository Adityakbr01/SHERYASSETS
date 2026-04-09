'use client'
import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTenantSwitcher } from '@/src/features/tenant/hooks/useTenantSwitcher'
import { TenantOverview } from '@/src/features/tenant/components/TenantOverview'
import { TeamMembers } from '@/src/features/membership/components/TeamMembers'
import { TenantApiKeysSummary } from '@/src/features/tenant/components/TenantApiKeysSummary'
import { ArrowLeft, BuildingIcon, Loader2 } from 'lucide-react'
export default function TenantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { tenant, isReady, isLoading, isError } = useTenantSwitcher(slug)
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20">
        <BuildingIcon className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Organization Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">This organization might not exist or you don't have access.</p>
        <button 
          onClick={() => router.push('/dashboard/tenants')}
          className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-2 rounded-xl font-medium transition"
        >
          Go Back
        </button>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => router.push('/dashboard/tenants')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Organizations
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            {isLoading ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" /> Switching Context...
              </span>
            ) : (
              tenant?.name || 'Loading...'
            )}
          </h1>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-3 bg-card border border-border rounded-2xl h-64" />
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl h-96" />
          <div className="bg-card border border-border rounded-2xl h-96" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <TenantOverview tenant={tenant} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TeamMembers isContextReady={isReady} />
            </div>
            <div>
              <TenantApiKeysSummary isContextReady={isReady} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
