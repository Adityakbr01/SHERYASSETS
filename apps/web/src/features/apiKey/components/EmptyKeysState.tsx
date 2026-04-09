'use client'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Key, Plus } from 'lucide-react'
interface EmptyKeysStateProps {
  onGenerate?: () => void
}
export function EmptyKeysState({ onGenerate }: EmptyKeysStateProps) {
  return (
    <div className="py-20 px-6 flex flex-col items-center justify-center text-center">
      {/* Animated icon with pulsing rings */}
      <div className="relative mb-8">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative z-10 w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center"
        >
          <Key className="w-9 h-9 text-primary" />
        </motion.div>
        {/* Decorative rings */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.4 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="absolute inset-0 -m-3 rounded-3xl border-2 border-dashed border-primary/20"
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="absolute inset-0 -m-6 rounded-[20px] border-2 border-dashed border-primary/10"
        />
      </div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-bold text-foreground mb-2 tracking-tight"
      >
        No API keys yet
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground max-w-sm text-sm leading-relaxed mb-8"
      >
        Generate your first API key to start integrating with your infrastructure programmatically.
      </motion.p>

      {onGenerate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={onGenerate}
            className="bg-primary text-primary-foreground h-11 px-6 rounded-xl font-semibold active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate First Key
          </Button>
        </motion.div>
      )}
    </div>
  )
}
