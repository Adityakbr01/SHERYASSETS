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
    orgName: z.string().trim().min(2).max(100).optional(),
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

export const switchTenantSchema = z.object({
  body: z.object({
    tenantId: z.string().trim().min(1, 'tenantId is required'),
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

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Valid email is required'),
  }),
  query: passthroughSchema,
  params: passthroughSchema,
})

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().trim().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
  query: passthroughSchema,
  params: passthroughSchema,
})