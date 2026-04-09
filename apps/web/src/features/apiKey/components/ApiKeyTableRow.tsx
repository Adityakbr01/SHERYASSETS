'use client'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Key, ShieldOff } from 'lucide-react'
import type { IApiKey } from '../api/apiKey.api'
interface ApiKeyTableRowProps {
  apiKey: IApiKey
  onRevoke: (id: string) => void
  index: number
  cellClass?: string
}
export function ApiKeyTableRow({ apiKey, onRevoke, index, cellClass = 'px-5 py-4' }: ApiKeyTableRowProps) {
  const k = apiKey as any
  const id = k._id || k.id
  const isActive = k.status === 'active'
  return (
    <motion.tr
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.25, delay: index * 0.2 }}
      className="group hover:bg-muted/40 transition-colors duration-200"
    >
      {/* Name */}
      <td className={`${cellClass} whitespace-nowrap`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 apple-border-shine rounded-full transition-colors duration-200 ${
            isActive
              ? 'bg-primary/8 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
              : 'bg-muted/60 text-muted-foreground'
          }`}>
            <Key className="w-3.5 h-3.5" />
          </div>
          <span className={`font-medium text-sm truncate max-w-[180px] ${
            isActive ? 'text-primary' : 'text-muted-foreground line-through'
          }`}>
            {k.name}
          </span>
        </div>
      </td>

      {/* Prefix */}
      <td className={`${cellClass} whitespace-nowrap`}>
        <code className="text-[13px] apple-border-shine font-mono bg-muted/50 text-muted-foreground px-2.5 py-1 rounded-full border border-border/40">
          {k.prefix}•••
        </code>
      </td>

      {/* Status */}
      <td className={`${cellClass} whitespace-nowrap`}>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${
            isActive ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]' : 'bg-rose-400'
          }`} />
          <span className={`text-xs font-semibold tracking-wide uppercase ${
            isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
          }`}>
            {k.status}
          </span>
        </div>
      </td>

      {/* Created */}
      <td className={`${cellClass} whitespace-nowrap text-sm text-muted-foreground tabular-nums`}>
        {new Date(k.createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </td>

      {/* Updated */}
      <td className={`${cellClass} whitespace-nowrap text-sm text-muted-foreground tabular-nums`}>
        {(k.updatedAt ? new Date(k.updatedAt) : new Date(k.createdAt)).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </td>

      {/* Actions */}
      <td className={`${cellClass} whitespace-nowrap text-right`}>
        {isActive ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRevoke(id)}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/8 rounded-lg h-8 px-3 text-xs font-medium gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <ShieldOff className="w-3.5 h-3.5" />
            Revoke
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground/50 italic">—</span>
        )}
      </td>
    </motion.tr>
  )
}
