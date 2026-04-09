'use client'
import React from 'react'
import { CheckCircle2, ChevronRight, Key } from 'lucide-react'
import { useApiKeys } from '../../apiKey/hooks/useApiKeys'
import Link from 'next/link'
export function TenantApiKeysSummary({ isContextReady }: { isContextReady: boolean }) {
  // We can just use the hook and limit to 3 items
  const { keys, loading, error } = useApiKeys({ limit: 3 })
  if (loading || !isContextReady) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 h-48 animate-pulse flex flex-col gap-4">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="flex-1 bg-muted rounded-xl" />
      </div>
    )
  }
  if (error) {
    return null // Soft fail for summary
  }
  return (
    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col h-full text-card-foreground">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg text-amber-500 ring-1 ring-border">
            <Key className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight">API Keys</h3>
        </div>
        <Link 
          href="/dashboard/keys"
          className="text-sm text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {keys.length > 0 ? (
          keys.map((key) => (
            <div key={key._id} className="flex flex-col py-2 border-b border-border last:border-0">
              <div className="flex justify-between items-center">
                <span className="font-medium text-foreground">{key.name}</span>
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
                  {key.prefix}***
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {key.status === 'active' ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-500">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-500">
                    Revoked
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  Created {new Date(key.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
            <Key className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm">No API keys generated yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
