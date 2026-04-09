'use client'
import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, ShieldOff } from 'lucide-react'
import { useState } from 'react'
interface RevokeKeyDialogProps {
  keyId: string | null
  onClose: () => void
  onConfirm: () => Promise<void> | void
}
export function RevokeKeyDialog({
  keyId,
  onClose,
  onConfirm,
}: RevokeKeyDialogProps) {
  const [isRevoking, setIsRevoking] = useState(false)
  const handleConfirm = async () => {
    setIsRevoking(true)
    try {
      await onConfirm()
    } finally {
      setIsRevoking(false)
    }
  }
  return (
    <AnimatePresence>
      {keyId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={isRevoking ? undefined : onClose}
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-[6px]"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-sm bg-card border border-border/50 shadow-2xl rounded-2xl p-6 z-10"
          >
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
                className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-5"
              >
                <ShieldOff className="w-7 h-7" />
              </motion.div>

              <h3 className="text-lg font-bold mb-2 tracking-tight text-foreground">
                Revoke this key?
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-[280px]">
                Applications using this key will{' '}
                <span className="text-destructive font-semibold">immediately lose access</span>.
                This cannot be undone.
              </p>

              {/* Actions */}
              <div className="flex w-full gap-2.5">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  disabled={isRevoking}
                  className="flex-1 rounded-xl h-10 font-medium text-muted-foreground"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={isRevoking}
                  className="flex-1 rounded-xl h-10 font-semibold active:scale-[0.97] transition-all"
                  onClick={handleConfirm}
                >
                  {isRevoking ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Revoking…</span>
                    </div>
                  ) : (
                    'Revoke Key'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}