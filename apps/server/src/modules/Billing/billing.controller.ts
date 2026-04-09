import type { Request, Response } from 'express'
import { asyncHandler } from '@/middlewares/asyncHandler'
import { ApiResponse } from '@/utils/ApiResponse'
import BillingService from './billing.service'
import { verifyRazorpayWebhook } from '@/services/razorpay.service'
import { ApiError } from '@/utils/ApiError'

const BillingController = {
  subscribe: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as unknown as { _id: string }
    const tenant = (req as unknown as { tenant: { _id: string } }).tenant
    if (!user || !tenant) return res.status(401).json({ message: 'Unauthorized or missing tenant' })

    const tenantId = tenant._id.toString()
    const userId = user._id as string
    const planId = req.params.planId as string || req.body.planId as string

    const checkoutData = await BillingService.subscribe(tenantId, planId, userId)

    ApiResponse.success(res, {
      message: 'Subscription initiated successfully',
      data: checkoutData,
    })
  }),

  verifyPayment: asyncHandler(async (req: Request, res: Response) => {
    const { orderId, paymentId, signature } = req.body
    const user = req.user as unknown as { _id: string }
    const tenant = (req as unknown as { tenant: { _id: string } }).tenant
    if (!user || !tenant) return res.status(401).json({ message: 'Unauthorized or missing tenant' })

    const isVerified = await BillingService.verifyPayment(orderId, paymentId, signature)

    ApiResponse.success(res, {
      message: 'Payment verified successfully',
      data: isVerified,
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
      throw new ApiError({
        statusCode: 400,
        message: 'Invalid signature'
      })
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

  getActiveSubscription: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = req.params
    const subscription = await BillingService.getActiveSubscription(tenantId!)

    ApiResponse.success(res, {
      message: 'Active subscription retrieved successfully',
      data: subscription,
    })
  }),
}

export default BillingController
