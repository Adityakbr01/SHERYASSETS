import { z } from 'zod'

const passthroughSchema = z.object({}).passthrough()

export const createPlanSchema = z.object({
  body: z.object({
    code: z.string().trim().min(2, 'Code must be at least 2 characters'),
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    priceMonthly: z.number().min(0, 'Price must be at least 0'),
    limits: z.object({
      maxImages: z.number().min(-1, 'Max images must be at least -1'),
      maxBandwidthGb: z.number().min(-1, 'Max bandwidth must be at least -1'),
      maxApiKeys: z.number().min(-1, 'Max API keys must be at least -1'),
      maxTransformations: z.number().min(-1, 'Max transformations must be at least -1'),
    }),
    features: z.object({
      priorityProcessing: z.boolean(),
      customDomain: z.boolean(),
      eagerVariants: z.boolean(),
    }),
  }),
  query: passthroughSchema,
  params: passthroughSchema,
})

export const updatePlanSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
    priceMonthly: z.number().min(0, 'Price must be at least 0').optional(),
    limits: z.object({
      maxImages: z.number().min(-1, 'Max images must be at least -1').optional(),
      maxBandwidthGb: z.number().min(-1, 'Max bandwidth must be at least -1').optional(),
      maxApiKeys: z.number().min(-1, 'Max API keys must be at least -1').optional(),
      maxTransformations: z.number().min(-1, 'Max transformations must be at least -1').optional(),
    }).optional(),
    features: z.object({
      priorityProcessing: z.boolean().optional(),
      customDomain: z.boolean().optional(),
      eagerVariants: z.boolean().optional(),
    }).optional(),
  }),
  query: passthroughSchema,
  params: passthroughSchema,
})

export const deletePlanSchema = z.object({
  body: z.object({}),
  query: passthroughSchema,
  params: passthroughSchema,
})
