import { authenticateUser, requireRole, resolveTenant } from '@/middlewares/auth.middleware'
import { authenticateApiKey } from '@/middlewares/apiKey.middleware'
import { validate } from '@/middlewares/validate.middleware'
import { Router } from 'express'
import UsageController from './usage.controller'
import {
    historyUsageSchema,
    monthlyUsageSchema,
    totalsUsageSchema,
    trackDeliverySchema,
    trackUploadSchema,
} from './usage.validation'

const usageRouter = Router()

// Machine-to-machine tracking endpoints
usageRouter.post(
    '/track/upload',
    authenticateApiKey,
    validate(trackUploadSchema),
    UsageController.trackUpload,
)
usageRouter.post(
    '/track/delivery',
    authenticateApiKey,
    validate(trackDeliverySchema),
    UsageController.trackDelivery,
)

// Dashboard usage analytics
usageRouter.use(authenticateUser, resolveTenant, requireRole(['owner', 'admin']))

usageRouter.get('/monthly', validate(monthlyUsageSchema), UsageController.getMonthlySummary)
usageRouter.get('/history', validate(historyUsageSchema), UsageController.getHistory)
usageRouter.get('/totals', validate(totalsUsageSchema), UsageController.getTotals)

export default usageRouter
