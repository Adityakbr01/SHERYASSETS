import { Router } from 'express'
import { authenticateUser, requireRole, resolveTenant } from '@/middlewares/auth.middleware'
import { validate } from '@/middlewares/validate.middleware'
import BillingController from './billing.controller'
import { subscribeSchema, webhookSchema } from './billing.validation'

const billingRouter = Router()

// Public Webhook (MUST be unauthenticated)
billingRouter.post('/webhook', validate(webhookSchema), BillingController.webhook)

// Protected endpoints
billingRouter.use(authenticateUser)
billingRouter.post(
  '/subscribe/:planId', 
  resolveTenant, 
  requireRole(['owner', 'admin']), 
  validate(subscribeSchema), 
  BillingController.subscribe
)

export default billingRouter
