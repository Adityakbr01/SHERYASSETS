'use client'
import React from 'react'
import { Building2, CreditCard, Mail, Tag } from 'lucide-react'
export function TenantOverview({ tenant }: { tenant: any }) {
  if (!tenant) return null
  return (
    <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 relative overflow-hidden shadow-sm">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3" />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-muted rounded-2xl ring-1 ring-border text-amber-500">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{tenant.name}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" /> {tenant.slug}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" /> {tenant.billingEmail || 'No billing email'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 apple-border-shine rounded-full bg-secondary text-secondary-foreground border border-border">
          <span className="relative flex h-2 w-2">
            {tenant.status === 'active' ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground"></span>
            )}
          </span>
          <span className="text-sm font-medium capitalize">{tenant.status}</span>
        </div>
      </div>

      <div className="relative z-10 mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plan Info */}
        <div className="bg-muted rounded-xl p-4 border border-border flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span className="font-medium text-foreground capitalize">
                {tenant.planId?.name || 'Loading Plan...'}
              </span>
            </div>
          </div>
          <button className="text-sm apple-border-shine bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-full transition">
            Manage Billing
          </button>
        </div>

        {/* Subscription Info */}
        <div className="bg-muted rounded-xl p-4 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">Subscription Status</p>
          <p className="font-medium text-foreground capitalize">
            {tenant.subscriptionStatus || 'Legacy / Free'}
          </p>
        </div>
      </div>
    </div>
  )
}
