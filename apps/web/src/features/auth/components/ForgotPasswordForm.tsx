'use client'import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ForgotPasswordFormValues } from '../forms/auth.schema';
import { forgotPasswordSchema } from '../forms/auth.schema'
import { authApi } from '../api/auth.api'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'export function ForgotPasswordForm() {
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState(false)  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setError('')
      setSuccess(false)
      await authApi.forgotPassword(data)
      setSuccess(true)
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || 'Failed to send reset email',
      )
    }
  }  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
      className="flex flex-col space-y-6"
    >
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Forgot Password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we'll send you a password reset link
        </p>
      </div>

      <div className="grid gap-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm font-medium border rounded-md border-red-500/20 bg-red-50/50 text-red-600 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 text-sm font-medium border rounded-md border-green-500/20 bg-green-50/50 text-green-600 dark:border-green-900/50 dark:bg-green-900/10 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                Check your email for the reset link
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="bg-transparent"
                disabled={isSubmitting || success}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || success}
              className="mt-2 text-white"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </Button>
          </div>
        </form>
      </div>

      <p className="px-8 text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link
          href="/login"
          className="font-semibold underline underline-offset-4 hover:text-primary transition-colors"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
