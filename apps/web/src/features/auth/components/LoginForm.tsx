'use client'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import type { LoginFormValues } from '../forms/auth.schema'
import { loginSchema } from '../forms/auth.schema'
import { authApi } from '../api/auth.api'
import { useAuthStore } from '../hooks/useAuthStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, GitForkIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'export function LoginForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { setToken, setUser } = useAuthStore()
  const [error, setError] = React.useState('')
  const [isGithubLoading, setIsGithubLoading] = React.useState(false)  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError('')
      const res = await authApi.login(data)      if (res?.data?.accessToken) {
        setToken(res.data.accessToken)
        setUser(res.data.user || null)
        // Invalidate the user query so dashboard picks up the session
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        router.push('/dashboard')
      } else {
        setError('Invalid response from server')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Something went wrong')
    }
  }  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col space-y-6"
    >
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and password to sign in
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

            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                disabled={isSubmitting}
                className="bg-transparent"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                disabled={isSubmitting}
                placeholder="••••••••"
                className="bg-transparent"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="mt-2 text-white">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid gap-4">
          <Button
            variant="outline"
            type="button"
            disabled={isGithubLoading || isSubmitting}
            onClick={() => {
              setIsGithubLoading(true)
              // Add NextAuth or OAuth Trigger here
              setTimeout(() => setIsGithubLoading(false), 2000)
            }}
          >
            {isGithubLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GitForkIcon className="mr-2 h-4 w-4" />
            )}
            GitHub
          </Button>
        </div>
      </div>

      <p className="px-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-semibold underline underline-offset-4 hover:text-primary transition-colors"
        >
          Sign up
        </Link>
      </p>
    </motion.div>
  )
}
