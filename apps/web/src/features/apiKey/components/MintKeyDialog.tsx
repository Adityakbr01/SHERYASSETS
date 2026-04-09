'use client'
import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Check, CheckCircle2, Copy, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'
import { CreateApiKeyForm } from '../forms/CreateApiKeyForm'
interface MintKeyDialogProps {
  isOpen: boolean
  onClose: () => void
  createKey: (name: string) => Promise<any>
  isCreating: boolean
  error?: string | null
}
export function MintKeyDialog({
  isOpen,
  onClose,
  createKey,
  isCreating,
  error,
}: MintKeyDialogProps) {
  const [mintedKey, setMintedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const handleCreate = async (name: string) => {
    const res = await createKey(name)
    if (res && res.apiKey) {
      setMintedKey(res.apiKey)
    }
  }
  const handleCopy = () => {
    if (mintedKey) {
      navigator.clipboard.writeText(mintedKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }
  const handleClose = () => {
    setMintedKey(null)
    setCopied(false)
    onClose()
  }
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={mintedKey ? undefined : handleClose}
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-[6px]"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-md bg-card border border-border/50 shadow-2xl rounded-2xl z-10 overflow-hidden"
          >
            {/* Close button */}
            {!mintedKey && (
              <div className="absolute top-3 right-3 z-20">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="rounded-lg w-8 h-8 hover:bg-muted text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="p-6">
              {!mintedKey ? (
                <CreateApiKeyForm
                  onSubmit={handleCreate}
                  onCancel={handleClose}
                  isCreating={isCreating}
                  error={error}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Success icon */}
                  <div className="relative mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"
                    >
                      <ShieldCheck className="w-8 h-8" />
                    </motion.div>
                  </div>

                  <h3 className="text-xl font-bold mb-1.5 tracking-tight text-foreground">
                    Key Created Successfully
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-6">
                    Copy your secret key now. For security, it won't be shown again.
                  </p>

                  {/* Warning */}
                  <div className="w-full flex items-center gap-2.5 px-3.5 py-2.5 mb-5 rounded-xl bg-amber-500/8 border border-amber-500/15">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-amber-600 dark:text-amber-400 text-xs font-medium">
                      Store this key in a secure location immediately.
                    </p>
                  </div>

                  {/* Key display */}
                  <div className="w-full mb-6">
                    <div className="flex items-center gap-2 p-3 bg-muted/40 border border-border/50 rounded-xl">
                      <code className="flex-1 text-[13px] font-mono text-foreground break-all text-left leading-relaxed select-all">
                        {mintedKey}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopy}
                        className={`shrink-0 h-9 w-9 rounded-lg border-border/50 transition-all duration-200 ${
                          copied
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {copied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {copied && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[11px] text-emerald-500 font-medium mt-2 flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Copied to clipboard
                      </motion.p>
                    )}
                  </div>

                  {/* Done button */}
                  <Button
                    className="w-full h-11 rounded-xl font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors"
                    onClick={handleClose}
                  >
                    Done
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
