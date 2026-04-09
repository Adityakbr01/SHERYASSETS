import { z } from 'zod';
import {
    assetIdParamSchema,
    listAssetsSchema,
    updateAssetStatusSchema,
} from '../../../../src/modules/Asset/asset.validation';
import { registry } from '../../registry';

const AssetErrorResponseSchema = registry.register(
    'AssetErrorResponse',
    z.object({
        success: z.literal(false),
        message: z.string().openapi({ example: 'Asset not found' }),
        errorCode: z.string().optional(),
        errors: z.array(z.any()).optional(),
    }),
);

const AssetUrlsSchema = registry.register(
    'AssetUrls',
    z.object({
        original: z.string().url().openapi({ example: 'https://cdn.sheryassets.com/tenant-a/products/shoe-1/original.png' }),
        mobile: z.string().url().optional().openapi({ example: 'https://cdn.sheryassets.com/tenant-a/products/shoe-1/mobile.webp' }),
        tablet: z.string().url().optional().openapi({ example: 'https://cdn.sheryassets.com/tenant-a/products/shoe-1/tablet.webp' }),
        desktop: z.string().url().optional().openapi({ example: 'https://cdn.sheryassets.com/tenant-a/products/shoe-1/desktop.webp' }),
    }),
);

const AssetRecordSchema = registry.register(
    'AssetRecord',
    z.object({
        _id: z.string().openapi({ example: '67f0be5b5998de9765a2fca1' }),
        tenantId: z.string().openapi({ example: '67f0be5b5998de9765a2f2e1' }),
        imageId: z.string().openapi({ example: '2a8784b4-5ee1-4f9b-a7f8-7ca9a67a84b6' }),
        path: z.string().openapi({ example: 'products/shoes' }),
        originalKey: z.string().openapi({ example: '67f0be5b5998de9765a2f2e1/products/shoes/2a8784b4/original.png' }),
        fileName: z.string().openapi({ example: 'shoe-1.png' }),
        size: z.number().int().openapi({ example: 482934 }),
        format: z.string().openapi({ example: 'png' }),
        mimeType: z.string().optional().openapi({ example: 'image/png' }),
        width: z.number().int().optional().openapi({ example: 1920 }),
        height: z.number().int().optional().openapi({ example: 1080 }),
        status: z.enum(['processing', 'ready', 'failed', 'deleted']).openapi({ example: 'processing' }),
        urls: AssetUrlsSchema,
        metadata: z.record(z.string(), z.unknown()).optional(),
        createdAt: z.string().datetime().optional(),
        updatedAt: z.string().datetime().optional(),
    }),
);

const AssetPaginationSchema = registry.register(
    'AssetPagination',
    z.object({
        page: z.number().int().openapi({ example: 1 }),
        limit: z.number().int().openapi({ example: 25 }),
        total: z.number().int().openapi({ example: 132 }),
        totalPages: z.number().int().openapi({ example: 6 }),
    }),
);

const AssetSuccessEnvelopeSchema = registry.register(
    'AssetSuccessEnvelope',
    z.object({
        success: z.literal(true),
        message: z.string(),
        data: z.any().optional(),
        meta: z.any().optional(),
    }),
);

const AssetUploadFormSchema = registry.register(
    'AssetUploadForm',
    z.object({
        file: z.any().openapi({
            type: 'string',
            format: 'binary',
            description: 'Binary file stream in multipart field named file',
        }),
        folder: z.string().trim().max(255).optional().openapi({ example: 'products/shoes' }),
        path: z.string().trim().max(255).optional().openapi({ example: 'legacy/folder' }),
        metadata: z.string().optional().openapi({
            example: '{"sku":"shoe-101","source":"catalog-sync"}',
            description: 'JSON-stringified object. Parsed and saved under metadata.custom.',
        }),
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
    path: '/api/v1/assets/upload',
    summary: 'Upload an asset with API key',
    description:
        'Machine-to-machine multipart upload endpoint. Accepts file stream plus optional folder/path and metadata.',
    tags: ['Asset'],
    security: [{ apiKeyAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                'multipart/form-data': {
                    schema: AssetUploadFormSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: 'Asset accepted and queued for processing',
            content: {
                'application/json': {
                    schema: AssetSuccessEnvelopeSchema.extend({
                        data: AssetRecordSchema.extend({
                            cdn: AssetUrlsSchema,
                        }),
                    }),
                },
            },
        },
        400: {
            description: 'Malformed multipart fields or missing file',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                    examples: {
                        missingFile: {
                            value: {
                                success: false,
                                message: 'File is required in form field "file"',
                            },
                        },
                    },
                },
            },
        },
        401: {
            description: 'Missing, invalid, or expired API key',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Tenant inactive or plan image limit reached',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                    examples: {
                        limitReached: {
                            value: {
                                success: false,
                                message: 'Image limit reached (1000 assets for Pro plan)',
                                errorCode: 'PLAN_LIMIT_IMAGES',
                            },
                        },
                    },
                },
            },
        },
        413: {
            description: 'Uploaded file exceeds ASSET_MAX_UPLOAD_BYTES',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
        415: {
            description: 'Non-multipart payload',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
        500: {
            description: 'Upload persisted but queue processing failed',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: 'get',
    path: '/api/v1/assets',
    summary: 'List tenant assets',
    tags: ['Asset'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        headers: z.object({
            'x-tenant-id': TenantHeaderSchema.optional(),
        }),
        query: listAssetsSchema.shape.query,
    },
    responses: {
        200: {
            description: 'Assets fetched successfully',
            content: {
                'application/json': {
                    schema: AssetSuccessEnvelopeSchema.extend({
                        data: z.array(AssetRecordSchema),
                        meta: AssetPaginationSchema,
                    }),
                },
            },
        },
        400: {
            description: 'Invalid pagination query',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
        401: {
            description: 'Unauthorized',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Tenant/membership restriction',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: 'get',
    path: '/api/v1/assets/{assetId}',
    summary: 'Get asset by id',
    tags: ['Asset'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        headers: z.object({
            'x-tenant-id': TenantHeaderSchema.optional(),
        }),
        params: assetIdParamSchema.shape.params,
    },
    responses: {
        200: {
            description: 'Asset fetched',
            content: {
                'application/json': {
                    schema: AssetSuccessEnvelopeSchema.extend({
                        data: AssetRecordSchema,
                    }),
                },
            },
        },
        400: {
            description: 'Invalid assetId',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
        401: {
            description: 'Unauthorized',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
        404: {
            description: 'Asset not found',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: 'patch',
    path: '/api/v1/assets/{assetId}/status',
    summary: 'Update asset status',
    description: 'Owner/admin only endpoint to update processing state.',
    tags: ['Asset'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        headers: z.object({
            'x-tenant-id': TenantHeaderSchema.optional(),
        }),
        params: updateAssetStatusSchema.shape.params,
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: updateAssetStatusSchema.shape.body,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Status updated',
            content: {
                'application/json': {
                    schema: AssetSuccessEnvelopeSchema.extend({
                        data: AssetRecordSchema,
                    }),
                },
            },
        },
        400: {
            description: 'Validation failed',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
        401: {
            description: 'Unauthorized',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Forbidden: requires owner/admin role',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
        404: {
            description: 'Asset not found',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: 'delete',
    path: '/api/v1/assets/{assetId}',
    summary: 'Soft delete asset',
    description: 'Owner/admin only endpoint. Marks asset status as deleted.',
    tags: ['Asset'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        headers: z.object({
            'x-tenant-id': TenantHeaderSchema.optional(),
        }),
        params: assetIdParamSchema.shape.params,
    },
    responses: {
        200: {
            description: 'Asset deleted',
            content: {
                'application/json': {
                    schema: AssetSuccessEnvelopeSchema.extend({
                        data: AssetRecordSchema,
                    }),
                },
            },
        },
        400: {
            description: 'Invalid assetId',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
        401: {
            description: 'Unauthorized',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Forbidden: requires owner/admin role',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
        404: {
            description: 'Asset not found',
            content: {
                'application/json': {
                    schema: AssetErrorResponseSchema,
                },
            },
        },
    },
});
