import { Suspense } from 'react'
import ResetPasswordPage from '@/src/features/auth/pages/ResetPasswordPage'
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordPage />
    </Suspense>
  )
}
