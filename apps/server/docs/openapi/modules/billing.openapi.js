import { z } from 'zod';
import { subscribeSchema, verifyPaymentSchema } from '../../../src/modules/Billing/billing.validation';
import { registry } from '../registry';
const BillingErrorResponseSchema = registry.register('BillingErrorResponse', z.object({
    success: z.literal(false),
    message: z.string().openapi({ example: 'Payment verification failed' }),
    errorCode: z.string().optional(),
    errors: z.array(z.any()).optional(),
}));
const BillingSubscriptionIntentSchema = registry.register('BillingSubscriptionIntent', z.object({
    orderId: z.string().openapi({ example: 'order_Q31k8jx9WJ9V0a' }),
    amount: z.number().openapi({ example: 2900, description: 'Amount in paise' }),
    currency: z.string().openapi({ example: 'INR' }),
    subscriptionId: z.string().openapi({ example: '67f0be5b5998de9765a2f5b9' }),
}));
const BillingSubscriptionRecordSchema = registry.register('BillingSubscriptionRecord', z.object({
    _id: z.string().openapi({ example: '67f0be5b5998de9765a2f5b9' }),
    tenantId: z.string().openapi({ example: '67f0be5b5998de9765a2f2e1' }),
    planId: z.string().openapi({ example: '67f0be5b5998de9765a2f2ef' }),
    userId: z.string().openapi({ example: '67f0be5b5998de9765a2f2d6' }),
    razorpayOrderId: z.string().openapi({ example: 'order_Q31k8jx9WJ9V0a' }),
    razorpayPaymentId: z.string().nullable().optional().openapi({ example: 'pay_Q31lL9Vd2kacZs' }),
    amount: z.number().openapi({ example: 29 }),
    status: z.enum(['created', 'active', 'failed', 'cancelled']).openapi({ example: 'active' }),
    startDate: z.string().datetime().optional().openapi({ example: '2026-04-05T12:08:12.000Z' }),
    endDate: z.string().datetime().optional().openapi({ example: '2026-05-05T12:08:12.000Z' }),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
}));
const BillingSuccessEnvelopeSchema = registry.register('BillingSuccessEnvelope', z.object({
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
    path: '/api/v1/billing/subscribe/{planId}',
    summary: 'Create Razorpay order for plan subscription',
    description: 'Creates a subscription intent/order. Requires tenant context and owner/admin membership role.',
    tags: ['Billing'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        params: z.object({
            planId: subscribeSchema.shape.params.shape.planId,
        }),
        headers: z.object({
            'x-tenant-id': TenantHeaderSchema.optional(),
        }),
        body: {
            required: false,
            content: {
                'application/json': {
                    schema: z.object({}).passthrough(),
                    examples: {
                        emptyBody: {
                            summary: 'No body required',
                            value: {},
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Subscription initiated and Razorpay order created',
            content: {
                'application/json': {
                    schema: BillingSuccessEnvelopeSchema.extend({ data: BillingSubscriptionIntentSchema }),
                },
            },
        },
        400: {
            description: 'Validation failure, basic-plan subscribe, or active subscription edge case',
            content: {
                'application/json': {
                    schema: BillingErrorResponseSchema,
                    examples: {
                        activeSubscription: {
                            value: {
                                success: false,
                                message: 'Tenant already has an active subscription',
                            },
                        },
                        basicPlan: {
                            value: {
                                success: false,
                                message: 'Basic plan cannot be subscribed in this manner',
                            },
                        },
                    },
                },
            },
        },
        401: {
            description: 'Missing/invalid auth token',
            content: {
                'application/json': {
                    schema: BillingErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Forbidden for non owner/admin or tenant membership mismatch',
            content: {
                'application/json': {
                    schema: BillingErrorResponseSchema,
                },
            },
        },
        404: {
            description: 'Plan or tenant not found',
            content: {
                'application/json': {
                    schema: BillingErrorResponseSchema,
                },
            },
        },
    },
});
registry.registerPath({
    method: 'post',
    path: '/api/v1/billing/subscribe/verify',
    summary: 'Verify payment and activate tenant subscription',
    tags: ['Billing'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        headers: z.object({
            'x-tenant-id': TenantHeaderSchema.optional(),
        }),
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: verifyPaymentSchema.shape.body,
                    examples: {
                        valid: {
                            value: {
                                orderId: 'order_Q31k8jx9WJ9V0a',
                                paymentId: 'pay_Q31lL9Vd2kacZs',
                                signature: 'dcf63f02df9f12a20b2eb90cfb188500b8cbccb4f1b2f4f0c973eaf8f56d4fba',
                            },
                        },
                        invalidSignature: {
                            summary: 'Webhook/client tampering edge case',
                            value: {
                                orderId: 'order_Q31k8jx9WJ9V0a',
                                paymentId: 'pay_Q31lL9Vd2kacZs',
                                signature: 'bad_sig',
                            },
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Payment verified and subscription activated',
            content: {
                'application/json': {
                    schema: BillingSuccessEnvelopeSchema.extend({ data: BillingSubscriptionRecordSchema }),
                },
            },
        },
        400: {
            description: 'Validation failure, bad signature, or invalid subscription state',
            content: {
                'application/json': {
                    schema: BillingErrorResponseSchema,
                    examples: {
                        invalidSignature: {
                            value: {
                                success: false,
                                message: 'Payment verification failed',
                            },
                        },
                        wrongState: {
                            value: {
                                success: false,
                                message: 'Subscription is not in created state',
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
                    schema: BillingErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Forbidden role/membership',
            content: {
                'application/json': {
                    schema: BillingErrorResponseSchema,
                },
            },
        },
        404: {
            description: 'Subscription or tenant not found',
            content: {
                'application/json': {
                    schema: BillingErrorResponseSchema,
                },
            },
        },
        500: {
            description: 'Internal activation failure',
            content: {
                'application/json': {
                    schema: BillingErrorResponseSchema,
                },
            },
        },
    },
});
registry.registerPath({
    method: 'post',
    path: '/api/v1/billing/webhook',
    summary: 'Razorpay webhook receiver',
    description: 'Public endpoint for payment events. Signature validation is mandatory via x-razorpay-signature header.',
    tags: ['Billing'],
    request: {
        headers: z.object({
            'x-razorpay-signature': z.string().trim().min(1).openapi({
                param: {
                    name: 'x-razorpay-signature',
                    in: 'header',
                    required: true,
                    description: 'HMAC SHA-256 signature from Razorpay',
                },
                example: 'aebf31b4a17d7d352048b8fc0e6efbaf5da8497d89401f973a5669bc42ce617a',
            }),
        }),
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: z.object({
                        event: z.string().openapi({ example: 'order.paid' }),
                        payload: z
                            .object({
                            payment: z.object({
                                entity: z.object({
                                    order_id: z.string().openapi({ example: 'order_Q31k8jx9WJ9V0a' }),
                                    id: z.string().openapi({ example: 'pay_Q31lL9Vd2kacZs' }),
                                }),
                            }),
                        })
                            .passthrough(),
                    }),
                    examples: {
                        orderPaid: {
                            value: {
                                event: 'order.paid',
                                payload: {
                                    payment: {
                                        entity: {
                                            order_id: 'order_Q31k8jx9WJ9V0a',
                                            id: 'pay_Q31lL9Vd2kacZs',
                                        },
                                    },
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
            description: 'Webhook accepted',
            content: {
                'text/plain': {
                    schema: z.string().openapi({ example: 'OK' }),
                },
            },
        },
        400: {
            description: 'Invalid webhook signature',
            content: {
                'application/json': {
                    schema: BillingErrorResponseSchema,
                    examples: {
                        invalidSignature: {
                            value: {
                                success: false,
                                message: 'Invalid signature',
                            },
                        },
                    },
                },
            },
        },
    },
});
