import { z } from 'zod';
import { registry } from '../../registry';
const ApiKeyErrorResponseSchema = registry.register('ApiKeyErrorResponse', z.object({
    success: z.literal(false),
    message: z.string().openapi({ example: 'API key not found or already revoked' }),
    errorCode: z.string().optional(),
    errors: z.array(z.any()).optional(),
}));
const ApiKeyPublicRecordSchema = registry.register('ApiKeyPublicRecord', z.object({
    _id: z.string().openapi({ example: '67f0be5b5998de9765a2fc10' }),
    tenantId: z.string().openapi({ example: '67f0be5b5998de9765a2f2e1' }),
    createdBy: z.string().openapi({ example: '67f0be5b5998de9765a2f2d6' }),
    name: z.string().openapi({ example: 'CDN Upload Service' }),
    prefix: z.string().openapi({ example: 'shry' }),
    status: z.enum(['active', 'revoked']).openapi({ example: 'active' }),
    lastUsedAt: z.string().datetime().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
}));
const ApiKeyCreateResponseSchema = registry.register('ApiKeyCreateResponse', z.object({
    id: z.string().openapi({ example: '67f0be5b5998de9765a2fc10' }),
    name: z.string().openapi({ example: 'CDN Upload Service' }),
    apiKey: z.string().openapi({
        example: 'shry_u9E5U8NRH9Qa7g75iTsCWw0cwjnLHEd7zH4z2c7kqn8',
        description: 'Raw key shown once at creation. Store it securely.',
    }),
    prefix: z.string().openapi({ example: 'shry' }),
    createdAt: z.string().datetime().openapi({ example: '2026-04-05T11:05:12.000Z' }),
}));
const ApiKeySuccessEnvelopeSchema = registry.register('ApiKeySuccessEnvelope', z.object({
    success: z.literal(true),
    message: z.string(),
    data: z.any().optional(),
    meta: z.any().optional(),
}));
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
        description: 'Tenant ObjectId. Optional when access token already contains activeTenantId, required otherwise.',
    },
    example: '67f0be5b5998de9765a2f2e1',
});
registry.registerPath({
    method: 'post',
    path: '/api/v1/api-keys',
    summary: 'Create API key for active tenant',
    description: 'Generates a new API key. Raw key is returned only once in response.',
    tags: ['ApiKey'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        headers: z.object({
            'x-tenant-id': TenantHeaderSchema.optional(),
        }),
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: z.object({
                        name: z.string().trim().min(1).openapi({ example: 'CDN Upload Service' }),
                    }),
                    examples: {
                        valid: {
                            value: { name: 'CDN Upload Service' },
                        },
                        blankName: {
                            summary: 'Edge case: blank name',
                            value: { name: '   ' },
                        },
                    },
                },
            },
        },
    },
    responses: {
        201: {
            description: 'API key generated',
            content: {
                'application/json': {
                    schema: ApiKeySuccessEnvelopeSchema.extend({ data: ApiKeyCreateResponseSchema }),
                },
            },
        },
        400: {
            description: 'Validation error or missing tenant context',
            content: {
                'application/json': {
                    schema: ApiKeyErrorResponseSchema,
                    examples: {
                        missingName: {
                            value: {
                                success: false,
                                message: 'API key name is required',
                            },
                        },
                    },
                },
            },
        },
        401: {
            description: 'Unauthorized',
            content: {
                'application/json': {
                    schema: ApiKeyErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Role restriction or plan key-limit exceeded',
            content: {
                'application/json': {
                    schema: ApiKeyErrorResponseSchema,
                    examples: {
                        planLimit: {
                            value: {
                                success: false,
                                message: 'API key limit reached (2 keys for Basic plan)',
                                errorCode: 'PLAN_LIMIT_API_KEYS',
                            },
                        },
                    },
                },
            },
        },
        404: {
            description: 'Tenant not found',
            content: {
                'application/json': {
                    schema: ApiKeyErrorResponseSchema,
                },
            },
        },
    },
});
registry.registerPath({
    method: 'get',
    path: '/api/v1/api-keys',
    summary: 'List API keys for active tenant',
    description: 'Returns key metadata only. keyHash is never exposed.',
    tags: ['ApiKey'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        headers: z.object({
            'x-tenant-id': TenantHeaderSchema.optional(),
        }),
    },
    responses: {
        200: {
            description: 'API keys fetched',
            content: {
                'application/json': {
                    schema: ApiKeySuccessEnvelopeSchema.extend({ data: z.array(ApiKeyPublicRecordSchema) }),
                },
            },
        },
        401: {
            description: 'Unauthorized',
            content: {
                'application/json': {
                    schema: ApiKeyErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Forbidden role/membership',
            content: {
                'application/json': {
                    schema: ApiKeyErrorResponseSchema,
                },
            },
        },
        404: {
            description: 'Tenant not found',
            content: {
                'application/json': {
                    schema: ApiKeyErrorResponseSchema,
                },
            },
        },
    },
});
registry.registerPath({
    method: 'patch',
    path: '/api/v1/api-keys/{keyId}/revoke',
    summary: 'Revoke an API key',
    tags: ['ApiKey'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        headers: z.object({
            'x-tenant-id': TenantHeaderSchema.optional(),
        }),
        params: z.object({
            keyId: z.string().trim().min(1).openapi({ example: '67f0be5b5998de9765a2fc10' }),
        }),
    },
    responses: {
        200: {
            description: 'API key revoked',
            content: {
                'application/json': {
                    schema: ApiKeySuccessEnvelopeSchema.extend({
                        data: z.object({
                            id: z.string().openapi({ example: '67f0be5b5998de9765a2fc10' }),
                            status: z.literal('revoked').openapi({ example: 'revoked' }),
                        }),
                    }),
                },
            },
        },
        400: {
            description: 'Missing keyId or tenant context',
            content: {
                'application/json': {
                    schema: ApiKeyErrorResponseSchema,
                },
            },
        },
        401: {
            description: 'Unauthorized',
            content: {
                'application/json': {
                    schema: ApiKeyErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Forbidden role/membership',
            content: {
                'application/json': {
                    schema: ApiKeyErrorResponseSchema,
                },
            },
        },
        404: {
            description: 'Key not found or already revoked',
            content: {
                'application/json': {
                    schema: ApiKeyErrorResponseSchema,
                },
            },
        },
    },
});
