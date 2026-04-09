'use client'import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ResetPasswordFormValues } from '../forms/auth.schema';
import { resetPasswordSchema } from '../forms/auth.schema'
import { authApi } from '../api/auth.api'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState(false)  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  })  React.useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.')
    }
  }, [token])  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setError('Invalid or missing reset token.')
      return
    }    try {
      setError('')
      setSuccess(false)
      await authApi.resetPassword({ token, password: data.password })
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to reset password')
    }
  }  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
      className="flex flex-col space-y-6"
    >
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Set New Password</h1>
        <p className="text-sm text-muted-foreground">
          Please enter your new password below
        </p>
      </div>

      <div className="grid gap-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm font-medium border rounded-md border-red-500/20 bg-red-50/50 text-red-600 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 text-sm font-medium border rounded-md border-green-500/20 bg-green-50/50 text-green-600 dark:border-green-900/50 dark:bg-green-900/10 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Password reset successfully. Redirecting to login...
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-transparent"
                disabled={isSubmitting || success || !token}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="bg-transparent"
                disabled={isSubmitting || success || !token}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || success || !token}
              className="mt-2 text-white"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
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
