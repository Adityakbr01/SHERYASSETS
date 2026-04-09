import { z } from 'zod';
import { createPlanSchema, deletePlanSchema, updatePlanSchema } from '../../../../src/modules/Plan/plan.validation';
import { registry } from '../../registry';
const PlanErrorResponseSchema = registry.register('PlanErrorResponse', z.object({
    success: z.literal(false),
    message: z.string().openapi({ example: 'Plan not found' }),
    errorCode: z.string().optional(),
    errors: z.array(z.any()).optional(),
}));
const PlanEntitySchema = registry.register('PlanEntity', z.object({
    _id: z.string().openapi({ example: '67f0be5b5998de9765a2f2ef' }),
    code: z.string().openapi({ example: 'pro' }),
    name: z.string().openapi({ example: 'Pro' }),
    priceMonthly: z.number().openapi({ example: 29 }),
    limits: z.object({
        maxImages: z.number().openapi({ example: 50000 }),
        maxBandwidthGb: z.number().openapi({ example: 100 }),
        maxApiKeys: z.number().openapi({ example: 10 }),
        maxTransformations: z.number().openapi({ example: 100000 }),
    }),
    features: z.object({
        priorityProcessing: z.boolean().openapi({ example: true }),
        customDomain: z.boolean().openapi({ example: true }),
        eagerVariants: z.boolean().openapi({ example: false }),
    }),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
}));
const PlanSuccessEnvelopeSchema = registry.register('PlanSuccessEnvelope', z.object({
    success: z.literal(true),
    message: z.string(),
    data: z.any().optional(),
    meta: z.any().optional(),
}));
registry.registerPath({
    method: 'get',
    path: '/api/v1/plans',
    summary: 'Get all plans',
    description: 'Public endpoint. Returns plans sorted by price with cache metadata.',
    tags: ['Plan'],
    responses: {
        200: {
            description: 'Plans fetched',
            content: {
                'application/json': {
                    schema: PlanSuccessEnvelopeSchema.extend({
                        data: z.array(PlanEntitySchema),
                        meta: z.object({
                            isCache: z.boolean().openapi({ example: false }),
                        }),
                    }),
                    examples: {
                        cacheMiss: {
                            value: {
                                success: true,
                                message: 'Plans fetched successfully',
                                data: [
                                    {
                                        _id: '67f0be5b5998de9765a2f2ee',
                                        code: 'basic',
                                        name: 'Basic',
                                        priceMonthly: 0,
                                        limits: {
                                            maxImages: 1000,
                                            maxBandwidthGb: 5,
                                            maxApiKeys: 2,
                                            maxTransformations: 5000,
                                        },
                                        features: {
                                            priorityProcessing: false,
                                            customDomain: false,
                                            eagerVariants: false,
                                        },
                                    },
                                ],
                                meta: { isCache: false },
                            },
                        },
                    },
                },
            },
        },
    },
});
registry.registerPath({
    method: 'post',
    path: '/api/v1/plans',
    summary: 'Create plan (admin only)',
    tags: ['Plan'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: createPlanSchema.shape.body,
                    examples: {
                        valid: {
                            value: {
                                code: 'custom_plan',
                                name: 'Custom Plan',
                                priceMonthly: 50,
                                limits: {
                                    maxImages: 2000,
                                    maxBandwidthGb: 10,
                                    maxApiKeys: 5,
                                    maxTransformations: 10000,
                                },
                                features: {
                                    priorityProcessing: true,
                                    customDomain: false,
                                    eagerVariants: false,
                                },
                            },
                        },
                        invalid: {
                            summary: 'Validation edge case',
                            value: {
                                code: '1',
                                name: 'A',
                                priceMonthly: -10,
                                limits: {
                                    maxImages: -2,
                                    maxBandwidthGb: -1,
                                    maxApiKeys: -1,
                                    maxTransformations: -1,
                                },
                                features: {
                                    priorityProcessing: false,
                                    customDomain: false,
                                    eagerVariants: false,
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Plan created',
            content: {
                'application/json': {
                    schema: PlanSuccessEnvelopeSchema.extend({ data: PlanEntitySchema }),
                },
            },
        },
        400: {
            description: 'Validation failed',
            content: {
                'application/json': {
                    schema: PlanErrorResponseSchema,
                },
            },
        },
        401: {
            description: 'Unauthorized',
            content: {
                'application/json': {
                    schema: PlanErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Forbidden: admin system role required',
            content: {
                'application/json': {
                    schema: PlanErrorResponseSchema,
                },
            },
        },
    },
});
registry.registerPath({
    method: 'put',
    path: '/api/v1/plans/{id}',
    summary: 'Update plan (admin only)',
    tags: ['Plan'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        params: z.object({
            id: z.string().trim().min(1).openapi({ example: '67f0be5b5998de9765a2f2ef' }),
        }),
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: updatePlanSchema.shape.body,
                    examples: {
                        renameAndPrice: {
                            value: {
                                name: 'Updated Pro',
                                priceMonthly: 39,
                            },
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Plan updated',
            content: {
                'application/json': {
                    schema: PlanSuccessEnvelopeSchema.extend({ data: PlanEntitySchema }),
                },
            },
        },
        400: {
            description: 'Validation failed',
            content: {
                'application/json': {
                    schema: PlanErrorResponseSchema,
                },
            },
        },
        401: {
            description: 'Unauthorized',
            content: {
                'application/json': {
                    schema: PlanErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Forbidden: admin only',
            content: {
                'application/json': {
                    schema: PlanErrorResponseSchema,
                },
            },
        },
        404: {
            description: 'Plan not found',
            content: {
                'application/json': {
                    schema: PlanErrorResponseSchema,
                },
            },
        },
    },
});
registry.registerPath({
    method: 'delete',
    path: '/api/v1/plans/{id}',
    summary: 'Delete plan (admin only)',
    tags: ['Plan'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        params: z.object({
            id: z.string().trim().min(1).openapi({ example: '67f0be5b5998de9765a2f2ef' }),
        }),
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: deletePlanSchema.shape.body,
                    examples: {
                        emptyBody: {
                            value: {},
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Plan deleted',
            content: {
                'application/json': {
                    schema: PlanSuccessEnvelopeSchema.extend({ data: PlanEntitySchema }),
                },
            },
        },
        401: {
            description: 'Unauthorized',
            content: {
                'application/json': {
                    schema: PlanErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Forbidden: admin only',
            content: {
                'application/json': {
                    schema: PlanErrorResponseSchema,
                },
            },
        },
        404: {
            description: 'Plan not found',
            content: {
                'application/json': {
                    schema: PlanErrorResponseSchema,
                },
            },
        },
    },
});
