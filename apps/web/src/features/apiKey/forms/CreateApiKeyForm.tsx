'use client'
import React, { useState } from 'react'
import { AlertCircle, Key, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
interface CreateApiKeyFormProps {
  onSubmit: (name: string) => Promise<void>
  onCancel: () => void
  isCreating: boolean
  error?: string | null
}
export function CreateApiKeyForm({
  onSubmit,
  onCancel,
  isCreating,
  error,
}: CreateApiKeyFormProps) {
  const [name, setName] = useState('')
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || isCreating) return
    await onSubmit(name)
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">Create API Key</h3>
            <p className="text-muted-foreground text-xs">
              This key grants programmatic access to your tenant.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/8 border border-destructive/15 text-destructive text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="key-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Key Name
          </Label>
          <Input
            id="key-name"
            placeholder="e.g. Production, Staging, CI/CD Pipeline"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            disabled={isCreating}
            className="w-full h-11 bg-muted/30 border-border/50 rounded-xl placeholder:text-muted-foreground/40 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all"
          />
          <p className="text-[11px] text-muted-foreground/60">
            Use a descriptive name so you can identify this key later.
          </p>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isCreating}
            className="rounded-xl px-5 h-10 font-medium text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!name.trim() || isCreating}
            className="rounded-xl px-6 h-10 font-semibold bg-primary text-primary-foreground active:scale-[0.97] transition-all shadow-sm"
          >
            {isCreating ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                <span>Generating…</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Key</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
