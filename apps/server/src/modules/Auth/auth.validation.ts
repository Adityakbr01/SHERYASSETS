import { z } from 'zod'

const passthroughSchema = z.object({}).passthrough()

export const sendRegisterOtpSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Valid email is required'),
  }),
  query: passthroughSchema,
  params: passthroughSchema,
})

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().email('Valid email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    tenantId: z.string().trim().min(3).optional(),
    otp: z.string().trim().length(6, 'OTP must be 6 digits'),
  }),
  query: passthroughSchema,
  params: passthroughSchema,
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Valid email is required'),
    password: z.string().min(1, 'Password is required'),
  }),
  query: passthroughSchema,
  params: passthroughSchema,
})

export const refreshSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().trim().min(10).optional(),
    })
    .default({}),
  query: passthroughSchema,
  params: passthroughSchema,
})

export const logoutSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().trim().min(10).optional(),
    })
    .default({}),
  query: passthroughSchema,
  params: passthroughSchema,
})
