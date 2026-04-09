'use client'
import React from 'react'
import { useCurrentUser } from '../hooks/useCurrentUser'
/**
 * AuthInitializer component calls the useCurrentUser hook on app startup.
 * This triggers the /me request and the automatic refresh token logic
 * if an access token is missing but a valid refresh cookie is present.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  // This will trigger the enabled:true query in useCurrentUser
  useCurrentUser()
  return <>{children}</>
}
