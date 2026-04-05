import { z } from 'zod'

const passthroughSchema = z.object({}).passthrough()

export const subscribeSchema = z.object({
  body: passthroughSchema,
  query: passthroughSchema,
  params: z.object({
    planId: z.string().trim().min(2, 'Plan ID must be a valid ID'),
  }),
})

export const verifyPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().trim().min(1, 'Order ID is required'),
    paymentId: z.string().trim().min(1, 'Payment ID is required'),
    signature: z.string().trim().min(1, 'Signature is required'),
  }),
  query: passthroughSchema,
  params: passthroughSchema,
})