import axios from 'axios'
import type {
  ForgotPasswordFormValues,
  LoginFormValues,
  RegisterFormValues} from '../forms/auth.schema';
import { useAuthStore } from '../hooks/useAuthStore'// Fallback to a local endpoint until set in .env
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'const axiosInstance = axios.create({
  baseURL: `${API_URL}/auth`,
  withCredentials: true,
})// Insert token if available
axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})export const authApi = {
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
  logout: async () => {
    return axiosInstance.post('/logout').then((res) => res.data)
  },
  forgotPassword: async (data: ForgotPasswordFormValues) => {
    return axiosInstance.post('/forgot-password', data).then((res) => res.data)
  },
  resetPassword: async (data: { token: string; password: string }) => {
    return axiosInstance.post('/reset-password', data).then((res) => res.data)
  },
  switchTenant: async (tenantId: string) => {
    return axiosInstance.post('/switch-tenant', { tenantId }).then((res) => res.data)
  },
}
