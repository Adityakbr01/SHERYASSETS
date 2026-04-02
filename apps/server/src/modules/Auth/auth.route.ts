import { Router } from 'express'

import { validate } from '@/middlewares/validate.middleware'
import AuthController from './auth.controller'
import { requireAuth } from './auth.middleware'
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  sendRegisterOtpSchema,
  switchTenantSchema,
} from './auth.validation'

const authRouter = Router()

authRouter.post(
  '/send-register-otp',
  validate(sendRegisterOtpSchema),
  AuthController.sendRegisterOtp,
)
authRouter.post('/register', validate(registerSchema), AuthController.register)
authRouter.post('/login', validate(loginSchema), AuthController.login)
authRouter.post('/refresh', validate(refreshSchema), AuthController.refresh)
authRouter.post('/logout', validate(logoutSchema), requireAuth, AuthController.logout)
authRouter.get('/me', requireAuth, AuthController.me)
authRouter.post(
  '/switch-tenant',
  validate(switchTenantSchema),
  requireAuth,
  AuthController.switchTenant,
)

export default authRouter
