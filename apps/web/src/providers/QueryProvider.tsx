'use client'
import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,       // 1 minute
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  })
}
let browserQueryClient: QueryClient | undefined
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  }
  // Browser: reuse the same client
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient)
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
