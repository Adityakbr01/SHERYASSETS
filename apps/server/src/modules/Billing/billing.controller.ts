import type { Request, Response } from 'express'
import { asyncHandler } from '@/middlewares/asyncHandler'
import { ApiResponse } from '@/utils/ApiResponse'
import BillingService from './billing.service'
import { verifyRazorpayWebhook } from '@/services/razorpay.service'
import { logger } from '@/utils/logger'

const BillingController = {
  subscribe: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as unknown as { _id: string }
    const tenant = (req as unknown as { tenant: { _id: string } }).tenant
    if (!user || !tenant) return res.status(401).json({ message: 'Unauthorized or missing tenant' })

    const tenantId = tenant._id.toString()
    const userId = user._id as string
    const planId = req.params.planId as string

    const checkoutData = await BillingService.subscribe(tenantId, planId, userId)

    ApiResponse.success(res, {
      message: 'Subscription initiated successfully',
      data: checkoutData,
    })
  }),

  webhook: asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string

    // Note: express.json() might have already parsed req.body, but for webhook sig verify,
    // we strictly need the raw body buffer. If you get verify errors, ensure `app.use(express.json())` 
    // is configured correctly to preserve rawBody, or construct it from JSON stringification carefully (less reliable).
    // Express raw body is often saved on req.rawBody if handled by generic middleware. 
    // Assuming standard structure for now, fallback to JSON.stringify
    const reqAny = req as unknown as { rawBody?: Buffer }
    const bodyStr = reqAny.rawBody ? reqAny.rawBody.toString() : JSON.stringify(req.body)

    if (!verifyRazorpayWebhook(bodyStr, signature)) {
      logger.error('Invalid Razorpay webhook signature!')
      return res.status(400).json({ error: 'Invalid signature' })
    }

    const { event, payload } = req.body

    // Listen only to order.paid (or payment.captured). 
    // "order.paid" is best because we map uniquely per order.
    if (event === 'order.paid') {
      const orderId = payload.payment.entity.order_id
      const paymentId = payload.payment.entity.id
      await BillingService.handleWebhookSuccess(orderId, paymentId)
    }

    res.status(200).send('OK')
  }),
}

export default BillingController
