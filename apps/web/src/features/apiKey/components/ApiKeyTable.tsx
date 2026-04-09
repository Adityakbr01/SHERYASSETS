'use client'
import React from 'react'
import { AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import type { IApiKey } from '../api/apiKey.api'
import { ApiKeyTableRow } from './ApiKeyTableRow'
import { EmptyKeysState } from './EmptyKeysState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}
interface ApiKeyTableProps {
  keys: IApiKey[]
  loading: boolean
  isFetching?: boolean
  onRevoke: (id: string) => void
  onGenerate?: () => void
  // Filtering & pagination
  meta: PaginationMeta
  params: { status?: string; search?: string }
  onPageChange: (page: number) => void
  onSearchChange: (search: string) => void
  onStatusChange: (status: string) => void
}
const statusFilters = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Revoked', value: 'revoked' },
]
const columns = [
  { label: 'Name', align: 'left' as const },
  { label: 'Prefix', align: 'left' as const },
  { label: 'Status', align: 'left' as const },
  { label: 'Created', align: 'left' as const },
  { label: 'Updated', align: 'left' as const },
  { label: 'Actions', align: 'right' as const },
]
export function ApiKeyTable({
  keys,
  loading,
  isFetching,
  onRevoke,
  onGenerate,
  meta,
  params,
  onPageChange,
  onSearchChange,
  onStatusChange,
}: ApiKeyTableProps) {
  const isFirstLoad = loading && keys.length === 0
  return (
    <div className="border border-border/60 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Toolbar: Search + Status Filter */}
      <div className="px-5 py-3.5 border-b border-border/40 bg-muted/10 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search by name…"
            value={params.search || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-background/60 border-border/50 rounded-xl text-sm focus-visible:ring-primary/20"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground mr-1" />
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => onStatusChange(f.value)}
              className={`px-3 py-1.5 rounded-full apple-border-shine text-xs font-medium transition-all ${(params.status || 'all') === f.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
          {isFetching && !isFirstLoad && (
            <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          )}
          <span>{meta.total} key{meta.total !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Table content */}
      {isFirstLoad ? (
        <LoadingSkeleton />
      ) : keys.length === 0 ? (
        <EmptyKeysState onGenerate={onGenerate} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                {columns.map((col) => (
                  <th
                    key={col.label}
                    scope="col"
                    className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ${col.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              <AnimatePresence mode="popLayout">
                {keys.map((k, i) => (
                  <ApiKeyTableRow
                    key={k._id || (k as any).id}
                    apiKey={k}
                    onRevoke={onRevoke}
                    index={i}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination footer */}
      {meta.totalPages > 1 && (
        <div className="px-5 py-3 border-t border-border/40 bg-muted/10 flex items-center justify-between">
          <p className="text-xs text-muted-foreground tabular-nums">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
              className="h-8 w-8 rounded-lg border-border/50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Page numbers */}
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter((p) => {
                // Show first, last, current, and neighbors
                return p === 1 || p === meta.totalPages || Math.abs(p - meta.page) <= 1
              })
              .reduce<(number | 'dots')[]>((acc, p, i, arr) => {
                if (i > 0 && arr[i - 1] !== undefined && p - (arr[i - 1] as number) > 1) {
                  acc.push('dots')
                }
                acc.push(p)
                return acc
              }, [])
              .map((item, i) =>
                item === 'dots' ? (
                  <span key={`dots-${i}`} className="px-1 text-xs text-muted-foreground">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => onPageChange(item)}
                    className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${item === meta.page
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/60'
                      }`}
                  >
                    {item}
                  </button>
                ),
              )}

            <Button
              variant="outline"
              size="icon"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
              className="h-8 w-8 rounded-lg border-border/50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
function LoadingSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40">
            {columns.map((col) => (
              <th
                key={col.label}
                scope="col"
                className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ${col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {[0, 1, 2].map((i) => (
            <tr key={i} className="animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full" />
                  <div className="h-3.5 bg-muted rounded w-28" />
                </div>
              </td>
              <td className="px-5 py-4"><div className="h-6 bg-muted rounded-full w-20" /></td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-muted rounded-full" />
                  <div className="h-3 bg-muted rounded w-12" />
                </div>
              </td>
              <td className="px-5 py-4"><div className="h-3.5 bg-muted rounded w-20" /></td>
              <td className="px-5 py-4"><div className="h-3.5 bg-muted rounded w-20" /></td>
              <td className="px-5 py-4 text-right"><div className="h-7 bg-muted rounded-lg w-14 ml-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
