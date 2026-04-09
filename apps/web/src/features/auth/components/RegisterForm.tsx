'use client'import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { RegisterFormValues } from '../forms/auth.schema';
import { registerSchema } from '../forms/auth.schema'
import { authApi } from '../api/auth.api'
import { useAuthStore } from '../hooks/useAuthStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, GitForkIcon, Loader2 } from 'lucide-react'import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'export function RegisterForm() {
  const router = useRouter()
  const {
    setToken,
    setUser,
    isOtpSent: storedOtpSent,
    otpEmail,
    setOtpSent,
  } = useAuthStore()
  const [error, setError] = React.useState('')
  const [isLoadingOtp, setIsLoadingOtp] = React.useState(false)
  const [isGithubLoading, setIsGithubLoading] = React.useState(false)
  const [cooldownTimer, setCooldownTimer] = React.useState(0)
  const cooldownIntervalRef = React.useRef<NodeJS.Timeout | null>(null)  // Only hydrate the stored OTP sent state on mount to avoid hydration mismatches
  const [isMounted, setIsMounted] = React.useState(false)
  const isOtpSent = isMounted && storedOtpSent  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })  React.useEffect(() => {
    setIsMounted(true)
    if (storedOtpSent && otpEmail) {
      setValue('email', otpEmail)
    }
  }, [storedOtpSent, otpEmail, setValue])  // Cooldown timer effect
  React.useEffect(() => {
    if (cooldownTimer > 0) {
      cooldownIntervalRef.current = setInterval(() => {
        setCooldownTimer((prev) => {
          if (prev <= 1) {
            if (cooldownIntervalRef.current) {
              clearInterval(cooldownIntervalRef.current)
              cooldownIntervalRef.current = null
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current)
        cooldownIntervalRef.current = null
      }
    }
  }, [cooldownTimer])  const emailVal = watch('email')  const handleSendOtp = async () => {
    if (!emailVal) {
      setError('Please provide an email first')
      return
    }
    setIsLoadingOtp(true)
    try {
      setError('')
      await authApi.sendRegisterOtp(emailVal)
      setOtpSent(true, emailVal)
      setCooldownTimer(30) // Start 30-second cooldown
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to send OTP')
    } finally {
      setIsLoadingOtp(false)
    }
  }  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setError('')
      const res = await authApi.register(data)      if (res?.data?.accessToken) {
        setToken(res.data.accessToken)
        setUser(res.data.user || null)
        setOtpSent(false, '') // clear OTP state
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Registration failed')
    }
  }  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
      className="flex flex-col space-y-6"
    >
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">Enter your details to get started</p>
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
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                className="bg-transparent"
                disabled={isSubmitting}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="email">Email</Label>
                {isOtpSent && (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false, '')
                      setValue('otp', '')
                      setCooldownTimer(0)
                    }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                  >
                    Change email?
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  disabled={isSubmitting || isOtpSent}
                  className="bg-transparent"
                  {...register('email')}
                />
                <Button
                  type="button"
                  variant={cooldownTimer > 0 ? 'secondary' : 'default'}
                  onClick={handleSendOtp}
                  disabled={
                    !emailVal || cooldownTimer > 0 || isLoadingOtp || isSubmitting
                  }
                  className="min-w-[100px] shrink-0 text-white"
                >
                  {isLoadingOtp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : cooldownTimer > 0 ? (
                    <span className="flex items-center text-green-600 dark:text-green-400">
                      <CheckCircle2 className="mr-1 h-4 w-4" /> {cooldownTimer}s
                    </span>
                  ) : (
                    'Get OTP'
                  )}
                </Button>
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            {isOtpSent && (
              <div className="grid gap-1.5 animate-in fade-in slide-in-from-top-1">
                <Label htmlFor="otp">One-Time Password</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  disabled={isSubmitting}
                  className="bg-transparent text-center tracking-widest text-lg"
                  {...register('otp')}
                />
                {errors.otp && (
                  <p className="text-xs text-red-500 font-medium">{errors.otp.message}</p>
                )}
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-transparent"
                disabled={isSubmitting}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !isOtpSent}
              className="mt-2 text-white"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
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
        Already have an account?{' '}
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
