import { z } from 'zod'

const passthroughSchema = z.object({}).passthrough()

export const subscribeSchema = z.object({
  body: passthroughSchema,
  query: passthroughSchema,
  params: z.object({
    planId: z.string().trim().min(2, 'Plan ID must be a valid ID'),
  }),
})

export const webhookSchema = z.object({
  body: passthroughSchema,
  query: passthroughSchema,
  params: passthroughSchema,
})
