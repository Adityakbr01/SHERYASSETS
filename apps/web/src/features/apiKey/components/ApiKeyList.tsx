'use client'import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApiKeys } from '../hooks/useApiKeys'
import { AlertCircle, CheckCircle2, Copy, Key, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'export function ApiKeyList() {
  const { keys, loading, error, createKey, revokeKey } = useApiKeys()
  const [isMinting, setIsMinting] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [mintedKey, setMintedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null)  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim() || isCreating) return    setIsCreating(true)
    const res = await createKey(newKeyName)
    setIsCreating(false)    if (res && res.apiKey) {
      setMintedKey(res.apiKey)
      setNewKeyName('') // Only clear if successful
    }
  }  const copyToClipboard = () => {
    if (mintedKey) {
      navigator.clipboard.writeText(mintedKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }  const closeMintDialog = () => {
    setIsMinting(false)
    setMintedKey(null)
  }  const handleRevokeConfirm = async () => {
    if (keyToRevoke) {
      await revokeKey(keyToRevoke)
      setKeyToRevoke(null)
    }
  }  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">API Keys</h2>
          <p className="text-muted-foreground text-sm">
            Manage your server API keys for programmatic access.
          </p>
        </div>
        <Button
          onClick={() => setIsMinting(true)}
          className="bg-success text-success-foreground rounded-full transition-all"
        >
          <Plus className="w-4 h-4" />
          Generate New Key
        </Button>
      </div>

      {error && !isMinting && (
        <div className="p-4 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive flex items-center">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-background/40 border border-border backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b border-border">
                <tr className=' flex items-center justify-between'>
                  <th scope="col" className="px-6 py-4">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Prefix
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Updated At
                  </th>
                  <th scope="col" className="px-6 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-muted rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-muted rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 bg-muted rounded-full w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-muted rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-muted rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-8 bg-muted rounded w-16 ml-auto"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-background/40 border border-border backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm">
          {keys.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Key className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                No API keys found
              </h3>
              <p className="text-muted-foreground max-w-sm">
                You haven't generated any API keys for this tenant yet. Create one to get
                started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b border-border">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-medium tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-4 font-medium tracking-wider">
                      Prefix
                    </th>
                    <th scope="col" className="px-6 py-4 font-medium tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-4 font-medium tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-4 font-medium tracking-wider">
                      Updated At
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 font-medium tracking-wider text-right"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {keys.map((k: any) => (
                    <motion.tr
                      key={k._id || k.id}
                      initial={{ opacity: 0, filter: 'blur(10px)', y: 10 }}
                      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground flex items-center gap-2">
                        <Key className="w-4 h-4 text-primary" />
                        {k.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-mono">
                        {k.prefix}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${k.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-rose-500/10 text-rose-500'
                            }`}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {k.updatedAt
                          ? new Date(k.updatedAt).toLocaleDateString()
                          : new Date(k.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {k.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setKeyToRevoke(k._id || k.id)}
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          >
                            Revoke
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Mint Dialog */}
      <AnimatePresence>
        {isMinting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={mintedKey ? undefined : closeMintDialog}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-2xl p-6 z-10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeMintDialog}
                  disabled={Boolean(mintedKey)}
                >
                  <X className="w-5 h-5 opacity-70" />
                </Button>
              </div>

              {!mintedKey ? (
                <>
                  <h3 className="text-xl font-bold mb-2">Create new API Key</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Enter a recognizable name to easily identify this key later.
                  </p>

                  {error && (
                    <div className="p-3 mb-4 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm flex items-start">
                      <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <Input
                        placeholder="e.g. Production Subscriptions"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        required
                        autoFocus
                        className="w-full bg-muted/40"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={closeMintDialog}
                        disabled={isCreating}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={!newKeyName.trim() || isCreating}>
                        {isCreating ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                            Generating...
                          </div>
                        ) : (
                          'Generate Key'
                        )}
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="py-4 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 ring-4 ring-emerald-500/10 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">API Key Generated</h3>
                  <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
                    <p className="text-amber-500 text-sm flex items-center font-medium">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Please copy this key immediately. You will not be able to see it
                      again!
                    </p>
                  </div>

                  <div className="w-full flex items-center gap-2 p-3 bg-muted/50 border border-border rounded-xl font-mono text-sm break-all">
                    <div className="flex-1 overflow-x-auto text-foreground">
                      {mintedKey}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyToClipboard}
                      className="shrink-0 hover:bg-background"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Copy className="w-5 h-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>

                  <Button className="w-full mt-6" onClick={closeMintDialog}>
                    I've copied my key safely
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Revoke Confirmation Dialog */}
      <AnimatePresence>
        {keyToRevoke && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setKeyToRevoke(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6 z-10 overflow-hidden"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Revoke API Key</h3>
                <p className="text-muted-foreground mb-6 text-sm">
                  Are you sure you want to revoke this API key? Any applications using
                  this key will immediately lose access. This action cannot be undone.
                </p>
                <div className="flex w-full justify-end gap-3">
                  <Button variant="ghost" onClick={() => setKeyToRevoke(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="bg-rose-500 hover:bg-rose-600 text-white"
                    onClick={handleRevokeConfirm}
                  >
                    Yes, Revoke Key
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
