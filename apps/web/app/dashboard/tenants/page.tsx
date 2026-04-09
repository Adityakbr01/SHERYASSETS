import React from 'react'
import { TenantsList } from '@/src/features/tenant/components/TenantsList'
import { BuildingIcon } from 'lucide-react'
function TenantsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BuildingIcon className="w-6 h-6 text-amber-500" />
            Organizations
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your organizations and workspaces.
          </p>
        </div>
      </div>

      <TenantsList />
    </div>
  )
}
export default TenantsPage