import React from 'react'
import { LoginForm } from '../components/LoginForm'function LoginPage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 relative overflow-hidden">
          {/* Dynamic background effects */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 mix-blend-screen pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50 mix-blend-screen pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />
          
          <div className="relative z-10 w-full max-w-md">
            <LoginForm />
          </div>
        </div>
    )
}export default LoginPage