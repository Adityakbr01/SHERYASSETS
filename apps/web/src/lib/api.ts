import axios from 'axios'
import { useAuthStore } from '../features/auth/hooks/useAuthStore'
import { authApi } from '../features/auth/api/auth.api'const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})// Insert token if available
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})let isRefreshing = false
let failedQueue: any[] = []const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token as string}`
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }      originalRequest._retry = true
      isRefreshing = true      try {
        const response = await authApi.refresh()
        const newToken = response.data?.accessToken
        const user = response.data?.user        if (newToken) {
          useAuthStore.getState().setToken(newToken)
          if (user) useAuthStore.getState().setUser(user)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          processQueue(null, newToken)
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }    return Promise.reject(error)
  },
)
