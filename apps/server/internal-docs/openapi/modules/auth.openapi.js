import { z } from 'zod';
import { forgotPasswordSchema, loginSchema, logoutSchema, refreshSchema, registerSchema, resetPasswordSchema, sendRegisterOtpSchema, switchTenantSchema, } from '../../../src/modules/Auth/auth.validation';
import { registry } from '../registry';
const AuthErrorItemSchema = registry.register('AuthErrorItem', z.object({
    code: z.string().openapi({ example: 'INVALID_TYPE' }),
    path: z.array(z.union([z.string(), z.number()])).openapi({ example: ['body', 'email'] }),
    message: z.string().openapi({ example: 'Valid email is required' }),
}));
const AuthErrorResponseSchema = registry.register('AuthErrorResponse', z.object({
    success: z.literal(false).openapi({ example: false }),
    message: z.string().openapi({ example: 'Validation failed' }),
    errorCode: z.string().optional().openapi({ example: 'UNAUTHORIZED' }),
    errors: z.array(AuthErrorItemSchema).optional(),
}));
const UserSchema = registry.register('AuthUser', z.object({
    _id: z.string().openapi({ example: '67f0be5b5998de9765a2f2d6' }),
    name: z.string().openapi({ example: 'Aaditya Sharma' }),
    email: z.string().email().openapi({ example: 'aaditya@sheryassets.com' }),
    role: z.string().openapi({ example: 'user' }),
    isEmailVerified: z.boolean().openapi({ example: true }),
}));
const AuthTenantSchema = registry.register('AuthTenant', z.object({
    tenantId: z.string().openapi({ example: '67f0be5b5998de9765a2f2e1' }),
    role: z.enum(['owner', 'admin', 'member']).openapi({ example: 'owner' }),
    name: z.string().openapi({ example: 'SheryAssets Workspace' }),
    slug: z.string().openapi({ example: 'sheryassets-workspace' }),
}));
const AuthTokensSchema = registry.register('AuthTokens', z.object({
    accessToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access-token' }),
    refreshToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-token' }),
}));
const AuthSuccessEnvelopeSchema = registry.register('AuthSuccessEnvelope', z.object({
    success: z.literal(true).openapi({ example: true }),
    message: z.string().openapi({ example: 'Operation successful' }),
    data: z.any().optional(),
    meta: z.any().optional(),
}));
const LoginRegisterResponseSchema = registry.register('AuthLoginRegisterResponse', z.object({
    success: z.literal(true),
    message: z.string().openapi({ example: 'Login successful' }),
    data: z.object({
        user: UserSchema,
        tenants: z.array(AuthTenantSchema),
        accessToken: AuthTokensSchema.shape.accessToken,
        refreshToken: AuthTokensSchema.shape.refreshToken,
    }),
}));
const SwitchTenantResponseSchema = registry.register('AuthSwitchTenantResponse', z.object({
    success: z.literal(true),
    message: z.string().openapi({ example: 'Tenant switched successfully' }),
    data: z.object({
        accessToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new-access-token' }),
        tenant: AuthTenantSchema,
    }),
}));
const CurrentUserResponseSchema = registry.register('AuthCurrentUserResponse', z.object({
    success: z.literal(true),
    message: z.string().openapi({ example: 'Current user fetched' }),
    data: UserSchema.extend({
        tenants: z.array(AuthTenantSchema),
    }),
}));
registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/send-register-otp',
    summary: 'Send registration OTP',
    description: 'Sends a one-time password to the provided email if the account is not already registered. Cooldown is enforced to prevent abuse.',
    tags: ['Auth'],
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: sendRegisterOtpSchema.shape.body,
                    examples: {
                        valid: {
                            summary: 'Valid request',
                            value: { email: 'founder@sheryassets.com' },
                        },
                        invalid: {
                            summary: 'Invalid email format',
                            value: { email: 'invalid-email' },
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: 'OTP request accepted',
            content: {
                'application/json': {
                    schema: AuthSuccessEnvelopeSchema,
                    examples: {
                        success: {
                            value: {
                                success: true,
                                message: 'OTP sent to email if it is not already registered',
                                meta: { email: 'founder@sheryassets.com' },
                            },
                        },
                    },
                },
            },
        },
        400: {
            description: 'Validation failed (missing/invalid email)',
            content: {
                'application/json': {
                    schema: AuthErrorResponseSchema,
                    examples: {
                        validationError: {
                            value: {
                                success: false,
                                message: 'Validation failed',
                                errors: [
                                    {
                                        code: 'INVALID_STRING',
                                        path: ['body', 'email'],
                                        message: 'Valid email is required',
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        },
        429: {
            description: 'Cooldown/rate limit active for OTP resend',
            content: {
                'application/json': {
                    schema: AuthErrorResponseSchema,
                    examples: {
                        cooldown: {
                            value: {
                                success: false,
                                message: 'Please wait before requesting another OTP',
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
    path: '/api/v1/auth/register',
    summary: 'Register a new user account',
    description: 'Creates a user and default tenant using email OTP verification. Returns access and refresh tokens in both body and cookies.',
    tags: ['Auth'],
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: registerSchema.shape.body,
                    examples: {
                        valid: {
                            value: {
                                name: 'Aaditya Sharma',
                                email: 'aaditya@sheryassets.com',
                                password: 'Password123!',
                                orgName: 'SheryAssets',
                                otp: '834295',
                            },
                        },
                        invalidOtp: {
                            summary: 'Wrong OTP edge case',
                            value: {
                                name: 'Aaditya Sharma',
                                email: 'aaditya@sheryassets.com',
                                password: 'Password123!',
                                orgName: 'SheryAssets',
                                otp: '000000',
                            },
                        },
                    },
                },
            },
        },
    },
    responses: {
        201: {
            description: 'Registration successful',
            content: {
                'application/json': {
                    schema: LoginRegisterResponseSchema,
                },
            },
        },
        400: {
            description: 'Validation failed or OTP invalid',
            content: {
                'application/json': {
                    schema: AuthErrorResponseSchema,
                    examples: {
                        invalidOtp: {
                            value: {
                                success: false,
                                message: 'Invalid or expired OTP',
                            },
                        },
                    },
                },
            },
        },
        409: {
            description: 'Email already exists',
            content: {
                'application/json': {
                    schema: AuthErrorResponseSchema,
                    examples: {
                        duplicate: {
                            value: {
                                success: false,
                                message: 'Email is already registered',
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
    path: '/api/v1/auth/login',
    summary: 'Login with email and password',
    tags: ['Auth'],
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: loginSchema.shape.body,
                    examples: {
                        valid: {
                            value: {
                                email: 'aaditya@sheryassets.com',
                                password: 'Password123!',
                            },
                        },
                        wrongPassword: {
                            value: {
                                email: 'aaditya@sheryassets.com',
                                password: 'WrongPassword',
                            },
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Login successful',
            content: {
                'application/json': {
                    schema: LoginRegisterResponseSchema,
                },
            },
        },
        400: {
            description: 'Validation failed',
            content: {
                'application/json': {
                    schema: AuthErrorResponseSchema,
                },
            },
        },
        401: {
            description: 'Invalid credentials',
            content: {
                'application/json': {
                    schema: AuthErrorResponseSchema,
                    examples: {
                        invalidCredentials: {
                            value: {
                                success: false,
                                message: 'Invalid email or password',
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
    path: '/api/v1/auth/me',
    summary: 'Get current authenticated user',
    description: 'Fetches current user profile and tenant memberships from access token context.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    tags: ['Auth'],
    responses: {
        200: {
            description: 'Current user profile fetched',
            content: {
                'application/json': {
                    schema: CurrentUserResponseSchema,
                },
            },
        },
        401: {
            description: 'Missing, invalid, or expired token',
            content: {
                'application/json': {
                    schema: AuthErrorResponseSchema,
                    examples: {
                        missingToken: {
                            value: {
                                success: false,
                                message: 'Unauthorized: access token missing',
                            },
                        },
                        invalidToken: {
                            value: {
                                success: false,
                                message: 'Unauthorized: invalid or expired access token',
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
    path: '/api/v1/auth/switch-tenant',
    summary: 'Switch active tenant context',
    description: 'Generates a fresh access token bound to a selected tenant. Required before tenant-scoped endpoints unless activeTenantId is already present in JWT.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    tags: ['Auth'],
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: switchTenantSchema.shape.body,
                    examples: {
                        valid: {
                            value: {
                                tenantId: '67f0be5b5998de9765a2f2e1',
                            },
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Tenant switched successfully',
            content: {
                'application/json': {
                    schema: SwitchTenantResponseSchema,
                },
            },
        },
        400: {
            description: 'Missing tenantId',
            content: {
                'application/json': {
                    schema: AuthErrorResponseSchema,
                },
            },
        },
        401: {
            description: 'Authentication required',
            content: {
                'application/json': {
                    schema: AuthErrorResponseSchema,
                },
            },
        },
        403: {
            description: 'User is not a member of the requested tenant',
            content: {
                'application/json': {
                    schema: AuthErrorResponseSchema,
                },
            },
        },
    },
});
registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/refresh',
    summary: 'Refresh access and refresh tokens',
    description: 'Accepts refresh token in request body or refreshToken cookie and rotates both tokens.',
    tags: ['Auth'],
    request: {
        body: {
            required: false,
            content: {
                'application/json': {
                    schema: refreshSchema.shape.body,
                    examples: {
                        bodyToken: {
                            summary: 'Refresh token in body',
                            value: {
                                refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-token',
                            },
                        },
                        cookieToken: {
                            summary: 'Token in cookie (empty body)',
                            value: {},
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Token refresh successful',
            content: {
                'application/json': {
                    schema: LoginRegisterResponseSchema,
                },
            },
        },
        400: {
            description: 'Refresh token missing from body and cookies',
            content: {
                'application/json': {
                    schema: AuthErrorResponseSchema,
                },
            },
        },
        401: {
            description: 'Refresh token invalid/expired',
            content: {
                'application/json': {
                    schema: AuthErrorResponseSchema,
                },
            },
        },
    },
});
registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/forgot-password',
    summary: 'Send password reset link',
    tags: ['Auth'],
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: forgotPasswordSchema.shape.body,
                    examples: {
                        valid: {
                            value: { email: 'aaditya@sheryassets.com' },
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Password reset email sent',
            content: {
                'application/json': {
                    schema: AuthSuccessEnvelopeSchema,
                },
            },
        },
        400: {
            description: 'Invalid email format',
            content: {
                'application/json': {
                    schema: AuthErrorResponseSchema,
                },
            },
        },
        404: {
            description: 'User not found',
            content: {
                'application/json': {
                    schema: AuthErrorResponseSchema,
                },
            },
        },
    },
});
registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/reset-password',
    summary: 'Reset password with token',
    description: 'Resets password for a user identified by the reset token.',
    tags: ['Auth'],
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: resetPasswordSchema.shape.body,
                    examples: {
                        valid: {
                            value: {
                                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.reset-token',
                                password: 'UpdatedPassword123!',
                            },
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Password reset successful',
            content: {
                'application/json': {
                    schema: AuthSuccessEnvelopeSchema,
                },
            },
        },
        400: {
            description: 'Validation failed',
            content: {
                'application/json': {
                    schema: AuthErrorResponseSchema,
                },
            },
        },
        401: {
            description: 'Invalid or expired reset token',
            content: {
                'application/json': {
                    schema: AuthErrorResponseSchema,
                },
            },
        },
    },
});
registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/logout',
    summary: 'Logout current user',
    description: 'Logs out current user session and clears auth cookies. Accepts optional refresh token in body.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    tags: ['Auth'],
    request: {
        body: {
            required: false,
            content: {
                'application/json': {
                    schema: logoutSchema.shape.body,
                    examples: {
                        withRefreshToken: {
                            value: {
                                refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-token',
                            },
                        },
                        withoutBody: {
                            value: {},
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Logout successful',
            content: {
                'application/json': {
                    schema: AuthSuccessEnvelopeSchema,
                    examples: {
                        success: {
                            value: {
                                success: true,
                                message: 'Logged out successfully',
                            },
                        },
                    },
                },
            },
        },
        401: {
            description: 'Missing/invalid token',
            content: {
                'application/json': {
                    schema: AuthErrorResponseSchema,
                },
            },
        },
    },
});
