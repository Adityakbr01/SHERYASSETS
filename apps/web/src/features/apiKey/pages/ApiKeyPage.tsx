'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Key, Plus } from 'lucide-react'
import { useApiKeys } from '../hooks/useApiKeys'
import { Button } from '@/components/ui/button'
import { ApiKeyTable } from '../components/ApiKeyTable'
import { MintKeyDialog } from '../components/MintKeyDialog'
import { RevokeKeyDialog } from '../components/RevokeKeyDialog'
export function ApiKeyPage() {
  const {
    keys,
    loading,
    isFetching,
    error,
    meta,
    params,
    setPage,
    setSearch,
    setStatus,
    createKey,
    revokeKey,
  } = useApiKeys()
  const [isMintingOpen, setIsMintingOpen] = useState(false)
  const [keyToRevokeId, setKeyToRevokeId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const handleCreate = async (name: string) => {
    setIsCreating(true)
    const res = await createKey(name)
    setIsCreating(false)
    return res
  }
  const handleRevokeConfirm = async () => {
    if (keyToRevokeId) {
      await revokeKey(keyToRevokeId)
      setKeyToRevokeId(null)
    }
  }
  const openMint = () => setIsMintingOpen(true)
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 apple-border-shine rounded-full bg-primary/10 text-primary hidden sm:flex">
            <Key className="w-6 h-6" />
          </div>
          <div className="font-display">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              API Keys
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Manage programmatic access to your infrastructure.
            </p>
          </div>
        </div>
        <Button
          onClick={openMint}
          className="bg-primary apple-border-shine rounded-full text-primary-foreground h-10 px-5 font-semibold active:scale-[0.97] transition-all text-sm font-display"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Key
        </Button>
      </motion.div>

      {/* Table with filtering & pagination */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <ApiKeyTable
          keys={keys}
          loading={loading}
          isFetching={isFetching}
          onRevoke={setKeyToRevokeId}
          onGenerate={openMint}
          meta={meta}
          params={params}
          onPageChange={setPage}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
        />
      </motion.div>

      {/* Dialogs */}
      <MintKeyDialog
        isOpen={isMintingOpen}
        onClose={() => setIsMintingOpen(false)}
        createKey={handleCreate}
        isCreating={isCreating}
        error={error}
      />

      <RevokeKeyDialog
        keyId={keyToRevokeId}
        onClose={() => setKeyToRevokeId(null)}
        onConfirm={handleRevokeConfirm}
      />
    </div>
  )
}
