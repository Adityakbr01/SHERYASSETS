"use client"import React from 'react'
import { LoginForm } from '../components/LoginForm'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../hooks/useAuthStore'
function LoginPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  if (isAuthenticated) {
    router.push('/dashboard')
  }
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
export default LoginPage