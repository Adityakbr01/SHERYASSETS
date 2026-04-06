import { z } from 'zod';
import { registry } from '../registry';

const TenantErrorResponseSchema = registry.register(
    'TenantErrorResponse',
    z.object({
        success: z.literal(false),
        message: z.string().openapi({ example: 'Tenant not found' }),
        errorCode: z.string().optional(),
        errors: z.array(z.any()).optional(),
    }),
);

const TenantSchema = registry.register(
    'TenantEntity',
    z.object({
        _id: z.string().openapi({ example: '67f0be5b5998de9765a2f2e1' }),
        name: z.string().openapi({ example: 'SheryAssets Workspace' }),
        slug: z.string().openapi({ example: 'sheryassets-workspace' }),
        ownerUserId: z.string().openapi({ example: '67f0be5b5998de9765a2f2d6' }),
        planId: z.string().openapi({ example: '67f0be5b5998de9765a2f2ef' }),
        status: z.string().openapi({ example: 'active' }),
        billingEmail: z.string().email().openapi({ example: 'founder@sheryassets.com' }),
        subscriptionStatus: z.string().nullable().optional().openapi({ example: 'active' }),
        createdAt: z.string().datetime().optional(),
        updatedAt: z.string().datetime().optional(),
    }),
);

const TenantWithRoleSchema = registry.register(
    'TenantWithRole',
    TenantSchema.extend({
        role: z.enum(['owner', 'admin', 'member']).openapi({ example: 'owner' }),
    }),
);

const TenantSuccessEnvelopeSchema = registry.register(
    'TenantSuccessEnvelope',
    z.object({
        success: z.literal(true),
        message: z.string(),
        data: z.any().optional(),
        meta: z.any().optional(),
    }),
);

registry.registerPath({
    method: 'get',
    path: '/api/v1/tenants/my-tenants',
    summary: 'List all tenants for current user',
    tags: ['Tenant'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    responses: {
        200: {
            description: 'User tenants fetched successfully',
            content: {
                'application/json': {
                    schema: TenantSuccessEnvelopeSchema.extend({ data: z.array(TenantWithRoleSchema) }),
                },
            },
        },
        401: {
            description: 'Missing/invalid access token',
            content: {
                'application/json': {
                    schema: TenantErrorResponseSchema,
                    examples: {
                        missingToken: {
                            value: {
                                success: false,
                                message: 'Unauthorized: access token missing',
                            },
                        },
                    },
                },
            },
        },
    },
});

registry.registerPath({
    method: 'get',
    path: '/api/v1/tenants/slug/{slug}',
    summary: 'Get tenant by slug',
    description:
        'Returns tenant detail with role resolved for current user membership when available.',
    tags: ['Tenant'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        params: z.object({
            slug: z.string().trim().min(2).openapi({
                example: 'sheryassets-workspace',
            }),
        }),
    },
    responses: {
        200: {
            description: 'Tenant fetched successfully',
            content: {
                'application/json': {
                    schema: TenantSuccessEnvelopeSchema.extend({
                        data: TenantSchema.extend({
                            role: z.enum(['owner', 'admin', 'member']).nullable().openapi({ example: 'owner' }),
                        }),
                    }),
                },
            },
        },
        401: {
            description: 'Unauthorized',
            content: {
                'application/json': {
                    schema: TenantErrorResponseSchema,
                },
            },
        },
        404: {
            description: 'Tenant slug not found',
            content: {
                'application/json': {
                    schema: TenantErrorResponseSchema,
                },
            },
        },
    },
});
