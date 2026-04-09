import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
export interface User {
  id: string
  name: string
  email: string
  [key: string]: any
}
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loadingUser: boolean
  isOtpSent: boolean
  otpEmail: string
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setOtpSent: (status: boolean, email?: string) => void
  logout: () => void
}
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        loadingUser: true,
        isOtpSent: false,
        otpEmail: '',
        setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
        setToken: (token) => set({ token }),
        setOtpSent: (status, email = '') => set({ isOtpSent: status, otpEmail: email }),
        logout: () =>
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isOtpSent: false,
            otpEmail: '',
          }),
      }),
      { name: 'auth-storage' },
    ),
  ),
)
