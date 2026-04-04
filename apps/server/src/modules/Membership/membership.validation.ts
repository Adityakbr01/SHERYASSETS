import { z } from 'zod'

const passthroughSchema = z.object({}).passthrough()

export const inviteSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Valid email is required'),
    role: z.enum(['admin', 'member']),
  }),
  query: passthroughSchema,
  params: passthroughSchema,
})

export const acceptInviteSchema = z.object({
  body: z.object({
    token: z.string().trim().min(1, 'Token is required')
  }),
  query: passthroughSchema,
  params: passthroughSchema,
})


export const removeMemberSchema = z.object({
  body: z.object({
    userId: z.string().trim().min(1, 'User ID is required'),
  }),
  query: passthroughSchema,
  params: passthroughSchema,
})
