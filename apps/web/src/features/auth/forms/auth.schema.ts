import { z } from 'zod'export const loginSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
})export type LoginFormValues = z.infer<typeof loginSchema>export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  otp: z.string().trim().length(6, 'OTP must be 6 digits'),
})export type RegisterFormValues = z.infer<typeof registerSchema>export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
})export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
