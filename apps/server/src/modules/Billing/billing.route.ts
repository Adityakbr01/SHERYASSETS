import { Router } from 'express'
import { authenticateUser, requireRole, resolveTenant } from '@/middlewares/auth.middleware'
import { validate } from '@/middlewares/validate.middleware'
import BillingController from './billing.controller'
import { subscribeSchema, verifyPaymentSchema } from './billing.validation'

const billingRouter = Router()

// 🔥 Webhook (public)
billingRouter.post('/webhook', BillingController.webhook)

// 🔐 Protected
billingRouter.use(authenticateUser)

// ✅ VERIFY PAYMENT (Fixed: Moved above dynamic route)
billingRouter.post(
  '/subscribe/verify',
  resolveTenant,
  requireRole(['owner', 'admin']),
  validate(verifyPaymentSchema),
  BillingController.verifyPayment
)

billingRouter.get(
  '/active/:tenantId',
  BillingController.getActiveSubscription
)

// 🧾 Create order
billingRouter.post(
  '/subscribe/:planId',
  resolveTenant,
  requireRole(['owner', 'admin']),
  validate(subscribeSchema),
  BillingController.subscribe
)

export default billingRouter