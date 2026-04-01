import { Router } from 'express'

import AuthController from './auth.controller'
import { requireAuth } from './auth.middleware'
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  sendRegisterOtpSchema,
} from './auth.validation'
import { validate } from '@/middlewares/validate.middleware'

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

export default authRouter
