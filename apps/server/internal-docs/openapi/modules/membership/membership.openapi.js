import { z } from 'zod';
import { acceptInviteSchema, inviteSchema, removeMemberSchema } from '../../../../src/modules/Membership/membership.validation';
import { registry } from '../../registry';
const MembershipErrorResponseSchema = registry.register('MembershipErrorResponse', z.object({
    success: z.literal(false),
    message: z.string().openapi({ example: 'User does not belong to this tenant' }),
    errorCode: z.string().optional(),
    errors: z.array(z.any()).optional(),
}));
const MembershipRecordSchema = registry.register('MembershipRecord', z.object({
    _id: z.string().openapi({ example: '67f0be5b5998de9765a2f7a2' }),
    userId: z.string().openapi({ example: '67f0be5b5998de9765a2f2d6' }),
    tenantId: z.string().openapi({ example: '67f0be5b5998de9765a2f2e1' }),
    role: z.enum(['owner', 'admin', 'member']).openapi({ example: 'member' }),
    status: z.enum(['active', 'invited', 'removed']).openapi({ example: 'active' }),
    invitedBy: z.string().nullable().optional().openapi({ example: '67f0be5b5998de9765a2f2d9' }),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
}));
const MembershipWithTenantSchema = registry.register('MembershipWithTenant', z.object({
    _id: z.string().openapi({ example: '67f0be5b5998de9765a2f7a2' }),
    role: z.enum(['owner', 'admin', 'member']).openapi({ example: 'owner' }),
    status: z.enum(['active', 'invited', 'removed']).openapi({ example: 'active' }),
    tenantId: z.object({
        _id: z.string().openapi({ example: '67f0be5b5998de9765a2f2e1' }),
        name: z.string().openapi({ example: 'SheryAssets Workspace' }),
        slug: z.string().openapi({ example: 'sheryassets-workspace' }),
        status: z.string().openapi({ example: 'active' }),
        planId: z.string().openapi({ example: '67f0be5b5998de9765a2f2ef' }),
    }),
}));
const MembershipSuccessEnvelopeSchema = registry.register('MembershipSuccessEnvelope', z.object({
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
    method: 'get',
    path: '/api/v1/memberships/mine',
    summary: 'Get memberships for current user',
    tags: ['Membership'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    responses: {
        200: {
            description: 'User memberships fetched',
            content: {
                'application/json': {
                    schema: MembershipSuccessEnvelopeSchema.extend({ data: z.array(MembershipWithTenantSchema) }),
                },
            },
        },
        401: {
            description: 'Unauthorized',
            content: {
                'application/json': {
                    schema: MembershipErrorResponseSchema,
                },
            },
        },
    },
});
registry.registerPath({
    method: 'get',
    path: '/api/v1/memberships/tenant-members',
    summary: 'List active members for active tenant',
    description: 'Requires owner/admin role in the resolved tenant.',
    tags: ['Membership'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        headers: z.object({
            'x-tenant-id': TenantHeaderSchema.optional(),
        }),
    },
    responses: {
        200: {
            description: 'Tenant members fetched',
            content: {
                'application/json': {
                    schema: MembershipSuccessEnvelopeSchema.extend({ data: z.array(MembershipRecordSchema) }),
                },
            },
        },
        400: {
            description: 'Tenant context missing',
            content: {
                'application/json': {
                    schema: MembershipErrorResponseSchema,
                },
            },
        },
        401: {
            description: 'Unauthorized',
            content: {
                'application/json': {
                    schema: MembershipErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Role or membership restriction',
            content: {
                'application/json': {
                    schema: MembershipErrorResponseSchema,
                },
            },
        },
        404: {
            description: 'Tenant not found',
            content: {
                'application/json': {
                    schema: MembershipErrorResponseSchema,
                },
            },
        },
    },
});
registry.registerPath({
    method: 'post',
    path: '/api/v1/memberships/invite',
    summary: 'Invite user to tenant',
    description: 'Owner/admin can invite admin/member users. Includes anti-spam cooldown and duplicate-invite safeguards.',
    tags: ['Membership'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        headers: z.object({
            'x-tenant-id': TenantHeaderSchema.optional(),
        }),
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: inviteSchema.shape.body,
                    examples: {
                        memberInvite: {
                            value: {
                                email: 'teammate@sheryassets.com',
                                role: 'member',
                            },
                        },
                        adminInvite: {
                            value: {
                                email: 'ops-admin@sheryassets.com',
                                role: 'admin',
                            },
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Invitation queued successfully',
            content: {
                'application/json': {
                    schema: MembershipSuccessEnvelopeSchema,
                    examples: {
                        success: {
                            value: {
                                success: true,
                                message: 'Invitation email sent successfully',
                                data: null,
                            },
                        },
                    },
                },
            },
        },
        400: {
            description: 'Validation failure or owner/already-member edge case',
            content: {
                'application/json': {
                    schema: MembershipErrorResponseSchema,
                    examples: {
                        alreadyJoined: {
                            value: {
                                success: false,
                                message: 'User has already joined this tenant',
                            },
                        },
                        ownerInvite: {
                            value: {
                                success: false,
                                message: 'User is the owner of this tenant and has already joined',
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
                    schema: MembershipErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Forbidden role/membership',
            content: {
                'application/json': {
                    schema: MembershipErrorResponseSchema,
                },
            },
        },
        404: {
            description: 'Tenant not found',
            content: {
                'application/json': {
                    schema: MembershipErrorResponseSchema,
                },
            },
        },
        429: {
            description: 'Invite cooldown or duplicate invite in progress',
            content: {
                'application/json': {
                    schema: MembershipErrorResponseSchema,
                    examples: {
                        inviterCooldown: {
                            value: {
                                success: false,
                                message: 'You are sending invitations too fast. Please wait a moment.',
                            },
                        },
                        duplicateInvite: {
                            value: {
                                success: false,
                                message: 'User already invited. Please wait for acceptance.',
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
    path: '/api/v1/memberships/accept-invite',
    summary: 'Accept tenant invite token',
    tags: ['Membership'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: acceptInviteSchema.shape.body,
                    examples: {
                        valid: {
                            value: {
                                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invite-token',
                            },
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Invitation accepted and membership created',
            content: {
                'application/json': {
                    schema: MembershipSuccessEnvelopeSchema.extend({ data: MembershipRecordSchema }),
                },
            },
        },
        400: {
            description: 'Invalid token format or user already a member',
            content: {
                'application/json': {
                    schema: MembershipErrorResponseSchema,
                    examples: {
                        alreadyMember: {
                            value: {
                                success: false,
                                message: 'You are already a member of this tenant',
                            },
                        },
                    },
                },
            },
        },
        401: {
            description: 'Unauthorized or invalid/expired JWT token',
            content: {
                'application/json': {
                    schema: MembershipErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Invite token email mismatch edge case',
            content: {
                'application/json': {
                    schema: MembershipErrorResponseSchema,
                    examples: {
                        wrongEmail: {
                            value: {
                                success: false,
                                message: 'This invitation was sent to a different email address. Please create an account with the invited email or login with the correct account first, then try again.',
                            },
                        },
                    },
                },
            },
        },
        404: {
            description: 'User account missing',
            content: {
                'application/json': {
                    schema: MembershipErrorResponseSchema,
                },
            },
        },
    },
});
registry.registerPath({
    method: 'post',
    path: '/api/v1/memberships/remove-member',
    summary: 'Remove active member from tenant',
    description: 'Only owner/admin can remove members. Tenant owner cannot be removed.',
    tags: ['Membership'],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    request: {
        headers: z.object({
            'x-tenant-id': TenantHeaderSchema.optional(),
        }),
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: removeMemberSchema.shape.body,
                    examples: {
                        valid: {
                            value: {
                                userId: '67f0be5b5998de9765a2fa11',
                            },
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Member removed successfully',
            content: {
                'application/json': {
                    schema: MembershipSuccessEnvelopeSchema,
                    examples: {
                        success: {
                            value: {
                                success: true,
                                message: 'Member removed successfully',
                                data: null,
                            },
                        },
                    },
                },
            },
        },
        400: {
            description: 'Validation failure or owner-remove edge case',
            content: {
                'application/json': {
                    schema: MembershipErrorResponseSchema,
                    examples: {
                        ownerRemove: {
                            value: {
                                success: false,
                                message: 'Cannot remove the owner of the tenant',
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
                    schema: MembershipErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'Forbidden role/membership',
            content: {
                'application/json': {
                    schema: MembershipErrorResponseSchema,
                },
            },
        },
        404: {
            description: 'Tenant/membership not found',
            content: {
                'application/json': {
                    schema: MembershipErrorResponseSchema,
                },
            },
        },
    },
});
