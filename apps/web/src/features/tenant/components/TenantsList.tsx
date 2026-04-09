'use client'
import React from 'react'
import { useMyTenants } from '../hooks/useTenants'
import { Building2, ChevronRight, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuthStore } from '@/src/features/auth/hooks/useAuthStore'
export function TenantsList() {
  const { data: tenants, isLoading, isError } = useMyTenants()
  const { switchTenant } = useAuthStore() // Wait, switchTenant isn't in store yet maybe? We will implement switch tenant later, for now we just show.
  // Framer motion variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }
  const listItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-card border border-border rounded-2xl p-6 h-48"
          />
        ))}
      </div>
    )
  }
  if (isError || !tenants) {
    return (
      <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
        <p>Failed to load tenants. Please try again later.</p>
      </div>
    )
  }
  if (tenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-border rounded-2xl">
        <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground">No Organizations Found</h3>
        <p className="text-muted-foreground mt-2">You are not a member of any organizations yet.</p>
      </div>
    )
  }
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {tenants.map((tenant) => (
        <motion.div
          key={tenant.tenantId}
          variants={listItem}
          className="group relative bg-card text-card-foreground border border-border rounded-2xl p-6 hover:border-border/80 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden"
        >
          {/* Subtle gradient background on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-muted rounded-xl text-amber-500 ring-1 ring-border group-hover:bg-amber-500/10 group-hover:ring-amber-500/30 transition-all">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground tracking-tight">
                    {tenant.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{tenant.slug}</p>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Role: <strong className="text-foreground capitalize">{tenant.role}</strong></span>
                </div>
                <div className="flex items-center gap-2">
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
                  <span className="text-muted-foreground capitalize">{tenant.status}</span>
                </div>
              </div>

              <Link
                href={`/dashboard/tenants/${tenant.slug}`}
                className="w-full apple-border-shine mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-secondary text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors border border-border"
              >
                View Organization
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
