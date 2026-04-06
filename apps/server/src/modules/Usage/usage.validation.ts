import { z } from 'zod'

const passthroughSchema = z.object({}).passthrough()
const optionalBodySchema = z.object({}).passthrough().optional().default({})
const monthSchema = z.string().trim().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be YYYY-MM')

export const trackUploadSchema = z.object({
    body: z.object({
        sizeBytes: z.coerce.number().int().min(1, 'sizeBytes must be greater than 0'),
        month: monthSchema.optional(),
    }),
    query: passthroughSchema,
    params: passthroughSchema,
})

export const trackDeliverySchema = z.object({
    body: z.object({
        bandwidthBytes: z.coerce.number().int().min(0, 'bandwidthBytes cannot be negative'),
        cacheStatus: z.enum(['hit', 'miss']).optional(),
        transformationCount: z.coerce.number().int().min(0).optional(),
        month: monthSchema.optional(),
    }),
    query: passthroughSchema,
    params: passthroughSchema,
})

export const monthlyUsageSchema = z.object({
    body: optionalBodySchema,
    query: z.object({
        month: monthSchema.optional(),
    }).passthrough(),
    params: passthroughSchema,
})

export const historyUsageSchema = z.object({
    body: optionalBodySchema,
    query: z.object({
        limit: z.coerce.number().int().min(1).max(24).default(6),
    }).passthrough(),
    params: passthroughSchema,
})

export const totalsUsageSchema = z.object({
    body: optionalBodySchema,
    query: passthroughSchema,
    params: passthroughSchema,
})