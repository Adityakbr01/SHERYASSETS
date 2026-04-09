"use client"
import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/src/features/dashboard/components/dashboard-layout'
import { useCurrentUser } from '@/src/features/auth/hooks/useCurrentUser'
import { useAuthStore } from '@/src/features/auth/hooks/useAuthStore'
import { useRouter } from 'next/navigation'
export default function AppDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)
  const { token, isAuthenticated } = useAuthStore()
  const { isLoading } = useCurrentUser()
  // Wait for Zustand persist to hydrate before making any auth decisions
  useEffect(() => {
    setHydrated(true)
  }, [])
  // Redirect only AFTER hydration confirms there's no token
  useEffect(() => {
    if (hydrated && !token && !isAuthenticated) {
      router.replace('/login')
    }
  }, [hydrated, token, isAuthenticated, router])
  // Still hydrating Zustand OR verifying token with /me → show skeleton
  if (!hydrated || isLoading) {
    return <DashboardSkeleton />
  }
  // After hydration, no token → show nothing (redirect is in flight)
  if (!token && !isAuthenticated) {
    return <DashboardSkeleton />
  }
  return <DashboardLayout>{children}</DashboardLayout>
}
function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar skeleton */}
      <div className="w-[240px] border-r border-border bg-background/50 flex flex-col shrink-0">
        <div className="p-4 mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="px-3 space-y-2 flex-1">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <div className="w-5 h-5 rounded bg-muted animate-pulse" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-5 h-5 rounded bg-muted animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Topbar skeleton */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6">
          <div className="h-5 w-48 bg-muted rounded animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
          </div>
        </div>

        {/* Page content skeleton */}
        <div className="flex-1 p-6 lg:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-72 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-10 w-28 bg-muted rounded-xl animate-pulse" />
          </div>
          <div className="h-64 bg-muted/50 rounded-2xl border border-border animate-pulse" />
        </div>
      </div>
    </div>
  )
}
