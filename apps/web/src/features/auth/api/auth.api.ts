import axios from 'axios'
import type {
  ForgotPasswordFormValues,
  LoginFormValues,
  RegisterFormValues,
} from '../forms/auth.schema'
import { useAuthStore } from '../hooks/useAuthStore'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
const axiosInstance = axios.create({
  baseURL: `${API_URL}/auth`,
  withCredentials: true,
})
// Insert token if available
axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
let isRefreshing = false
let failedQueue: any[] = []
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}
// Handle token refresh on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token as string}`
            return axiosInstance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }
      originalRequest._retry = true
      isRefreshing = true
      try {
        const response = await authApi.refresh()
        const newToken = response.data?.accessToken
        const user = response.data?.user
        if (newToken) {
          useAuthStore.getState().setToken(newToken)
          if (user) useAuthStore.getState().setUser(user)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          processQueue(null, newToken)
          return axiosInstance(originalRequest)
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)
export const authApi = {
  me: async () => {
    return axiosInstance.get('/me').then((res) => res.data)
  },
  login: async (data: LoginFormValues) => {
    return axiosInstance.post('/login', data).then((res) => res.data)
  },
  sendRegisterOtp: async (email: string) => {
    return axiosInstance.post('/send-register-otp', { email }).then((res) => res.data)
  },
  register: async (data: RegisterFormValues) => {
    return axiosInstance.post('/register', data).then((res) => res.data)
  },
  refresh: async () => {
    return axiosInstance.post('/refresh', {}).then((res) => res.data)
  },
  logout: async () => {
    return axiosInstance.post('/logout').then((res) => res.data)
  },
  forgotPassword: async (data: ForgotPasswordFormValues) => {
    return axiosInstance.post('/forgot-password', data).then((res) => res.data)
  },
  resetPassword: async (data: { token: string; password: string }) => {
    return axiosInstance.post('/reset-password', data).then((res) => res.data)
  },
  // todo 
  switchTenant: async (tenantId: string) => {
    return axiosInstance.post('/switch-tenant', { tenantId }).then((res) => res.data)
  },
}
