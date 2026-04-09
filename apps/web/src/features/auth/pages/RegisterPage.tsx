"use client"import { RegisterForm } from '../components/RegisterForm'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../hooks/useAuthStore'
export default function RegisterPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  if (isAuthenticated) {
    router.push('/dashboard')
  }
  return (
    <div className="register-page">
      <RegisterForm />
    </div>
  )
}
