import React from 'react'
import { Hexagon } from 'lucide-react'export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Hexagon className="mr-2 h-6 w-6 text-primary" fill="currentColor" />
          SheryAssets
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;This library has saved me countless hours of work and helped me
              deliver digital assets directly to our clients faster than ever
              before.&rdquo;
            </p>
            <footer className="text-sm">Sofia Davis</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8 h-full flex items-center bg-background">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-87.5">
          {children}
        </div>
      </div>
    </div>
  )
}
