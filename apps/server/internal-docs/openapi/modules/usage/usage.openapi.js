import { z } from 'zod';
import {
    historyUsageSchema,
    monthlyUsageSchema,
    totalsUsageSchema,
    trackDeliverySchema,
    trackUploadSchema,
} from '../../../../src/modules/Usage/usage.validation';
import { registry } from '../../registry';

const UsageErrorResponseSchema = registry.register(
    'UsageErrorResponse',
    z.object({
        success: z.literal(false),
        message: z.string().openapi({ example: 'Tenant context required' }),
        errorCode: z.string().optional(),
        errors: z.array(z.any()).optional(),
    }),
);

const UsageRecordSchema = registry.register(
    'UsageRecord',
    z.object({
        _id: z.string().openapi({ example: '67f0be5b5998de9765a2fda2' }),
        tenantId: z.string().openapi({ example: '67f0be5b5998de9765a2f2e1' }),
        month: z.string().openapi({ example: '2026-04' }),
        uploadCount: z.number().int().openapi({ example: 12 }),
        transformationCount: z.number().int().openapi({ example: 142 }),
        bandwidthBytes: z.number().int().openapi({ example: 15728640 }),
        originFetchCount: z.number().int().openapi({ example: 32 }),
        cacheHitCount: z.number().int().openapi({ example: 211 }),
        createdAt: z.string().datetime().optional(),
        updatedAt: z.string().datetime().optional(),
    }),
);

const UsageMonthlySummarySchema = registry.register(
    'UsageMonthlySummary',
    z.object({
        month: z.string().openapi({ example: '2026-04' }),
        usage: z.object({
            uploadCount: z.number().int().openapi({ example: 12 }),
            transformationCount: z.number().int().openapi({ example: 142 }),
            bandwidthBytes: z.number().int().openapi({ example: 15728640 }),
            bandwidthGb: z.number().openapi({ example: 0.0146 }),
            originFetchCount: z.number().int().openapi({ example: 32 }),
            cacheHitCount: z.number().int().openapi({ example: 211 }),
        }),
        limits: z.object({
            maxImages: z.number().int().openapi({ example: 1000 }),
            maxTransformations: z.number().int().openapi({ example: 10000 }),
            maxBandwidthGb: z.number().openapi({ example: 50 }),
        }),
        utilization: z.object({
            imagesPercent: z.number().nullable().openapi({ example: 1.2 }),
            transformationsPercent: z.number().nullable().openapi({ example: 1.42 }),
            bandwidthPercent: z.number().nullable().openapi({ example: 0.03 }),
        }),
    }),
);

const UsageTotalsSchema = registry.register(
    'UsageTotals',
    z.object({
        uploadCount: z.number().int().openapi({ example: 120 }),
        transformationCount: z.number().int().openapi({ example: 2210 }),
        bandwidthBytes: z.number().int().openapi({ example: 788529152 }),
        bandwidthGb: z.number().openapi({ example: 0.7346 }),
        originFetchCount: z.number().int().openapi({ example: 403 }),
        cacheHitCount: z.number().int().openapi({ example: 2011 }),
    }),
);

const UsageSuccessEnvelopeSchema = registry.register(
    'UsageSuccessEnvelope',
    z.object({
        success: z.literal(true),
        message: z.string(),
        data: z.any().optional(),
        meta: z.any().optional(),
    }),
);

const TenantHeaderSchema = z
    .string()
    .trim()
    .min(24)
    .max(24)
    .openapi({
        param: {
            name: 'x-tenant-id',
            in: 'header',
            required: false,
            description:
                'Tenant ObjectId. Optional when access token already contains activeTenantId, required otherwise.',
        },
        example: '67f0be5b5998de9765a2f2e1',
    });

registry.registerPath({
    method: 'post',
    path: '/api/v1/usage/track/upload',
    summary: 'Track upload usage',
    description: 'Machine-to-machine endpoint that increments upload counters and bandwidth.',
    tags: ['Usage'],
    security: [{ apiKeyAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: trackUploadSchema.shape.body,
                    examples: {
                        valid: {
                            value: {
                                sizeBytes: 2048,
                                month: '2026-04',
                            },
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Upload usage tracked',
            content: {
                'application/json': {
                    schema: UsageSuccessEnvelopeSchema.extend({
                        data: UsageRecordSchema,
                    }),
                },
            },
        },
        400: {
            description: 'Validation failure or invalid month format',
            content: {
                'application/json': {
                    schema: UsageErrorResponseSchema,
                },
            },
        },
        401: {
            description: 'Missing/invalid API key',
            content: {
                'application/json': {
                    schema: UsageErrorResponseSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: 'post',
    path: '/api/v1/usage/track/delivery',
    summary: 'Track delivery usage',
    description: 'Tracks bandwidth, cache status, and transformation counters for delivery traffic.',
    tags: ['Usage'],
    security: [{ apiKeyAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: trackDeliverySchema.shape.body,
                    examples: {
                        cacheHit: {
                            value: {
                                bandwidthBytes: 4096,
                                cacheStatus: 'hit',
                                transformationCount: 2,
                                month: '2026-04',
                            },
                        },
                        cacheMiss: {
                            value: {
                                bandwidthBytes: 1024,
                                cacheStatus: 'miss',
                                transformationCount: 1,
                                month: '2026-04',
                            },
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Delivery usage tracked',
            content: {
                'application/json': {
                    schema: UsageSuccessEnvelopeSchema.extend({
                        data: UsageRecordSchema,
                    }),
                },
            },
        },
        400: {
            description: 'Validation failure or invalid month format',
            content: {
                'application/json': {
                    schema: UsageErrorResponseSchema,
                },
            },
        },
        401: {
            description: 'Missing/invalid API key',
            content: {
                'application/json': {
                    schema: UsageErrorResponseSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: 'get',
    path: '/api/v1/usage/monthly',
    summary: 'Get monthly usage summary',
    description: 'Owner/admin analytics endpoint including current month usage, limits, and utilization.',
    tags: ['Usage'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        headers: z.object({
            'x-tenant-id': TenantHeaderSchema.optional(),
        }),
        query: monthlyUsageSchema.shape.query,
    },
    responses: {
        200: {
            description: 'Monthly usage summary fetched',
            content: {
                'application/json': {
                    schema: UsageSuccessEnvelopeSchema.extend({
                        data: UsageMonthlySummarySchema,
                    }),
                },
            },
        },
        400: {
            description: 'Validation failed',
            content: {
                'application/json': {
                    schema: UsageErrorResponseSchema,
                },
            },
        },
        401: {
            description: 'Unauthorized',
            content: {
                'application/json': {
                    schema: UsageErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Forbidden: requires owner/admin role in tenant',
            content: {
                'application/json': {
                    schema: UsageErrorResponseSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: 'get',
    path: '/api/v1/usage/history',
    summary: 'Get monthly usage history',
    description: 'Returns recent monthly usage rows for charts and trend analysis.',
    tags: ['Usage'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        headers: z.object({
            'x-tenant-id': TenantHeaderSchema.optional(),
        }),
        query: historyUsageSchema.shape.query,
    },
    responses: {
        200: {
            description: 'Usage history fetched',
            content: {
                'application/json': {
                    schema: UsageSuccessEnvelopeSchema.extend({
                        data: z.array(UsageRecordSchema),
                    }),
                },
            },
        },
        400: {
            description: 'Validation failed',
            content: {
                'application/json': {
                    schema: UsageErrorResponseSchema,
                },
            },
        },
        401: {
            description: 'Unauthorized',
            content: {
                'application/json': {
                    schema: UsageErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Forbidden: requires owner/admin role in tenant',
            content: {
                'application/json': {
                    schema: UsageErrorResponseSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: 'get',
    path: '/api/v1/usage/totals',
    summary: 'Get all-time usage totals',
    description: 'Aggregated counters across all tracked months for tenant dashboards.',
    tags: ['Usage'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        headers: z.object({
            'x-tenant-id': TenantHeaderSchema.optional(),
        }),
        query: totalsUsageSchema.shape.query,
    },
    responses: {
        200: {
            description: 'Usage totals fetched',
            content: {
                'application/json': {
                    schema: UsageSuccessEnvelopeSchema.extend({
                        data: UsageTotalsSchema,
                    }),
                },
            },
        },
        401: {
            description: 'Unauthorized',
            content: {
                'application/json': {
                    schema: UsageErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Forbidden: requires owner/admin role in tenant',
            content: {
                'application/json': {
                    schema: UsageErrorResponseSchema,
                },
            },
        },
    },
});
