import { ApiError } from '@/utils/ApiError'
import { razorpayInstance, verifyRazorpaySignature } from '@/services/razorpay.service'
import BillingDAO from './billing.dao'
import PlanDAO from '../Plan/plan.dao'
import TenantDAO from '../Tenant/tenant.dao'
import { logger } from '@/utils/logger'
import type { Types } from 'mongoose'

const BillingService = {
  async subscribe(tenantId: string, planId: string, userId: string) {
    // ⚠️ Idempotency / Double subscription check
    const activeSub = await BillingDAO.findActiveSubscriptionByTenantId(tenantId)
    if (activeSub) {
      throw new ApiError({ statusCode: 400, message: 'Tenant already has an active subscription' })
    }

    const plan = await PlanDAO.findById(planId)
    if (!plan) {
      throw new ApiError({ statusCode: 404, message: 'Plan not found' })
    }

    if (plan.code === 'basic') {
      throw new ApiError({ statusCode: 400, message: 'Basic plan cannot be subscribed in this manner' })
    }

    const amountInPaise = plan.priceMonthly * 100

    // Initiate Razorpay Order Tracker
    // Note: receipt ID has a 40-character limit in Razorpay
    const order = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${tenantId.slice(-15)}_${Date.now()}`, // Safely under 40 chars
    })

    // Save Intent to DB initially
    const subscription = await BillingDAO.createSubscription({
      tenantId: tenantId as unknown as Types.ObjectId,
      planId: planId as unknown as Types.ObjectId,
      userId: userId as unknown as Types.ObjectId,
      razorpayOrderId: order.id,
      amount: plan.priceMonthly,
      status: 'created',
    })

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      subscriptionId: subscription._id,
    }
  },

  async verifyPayment(orderId: string, paymentId: string, signature: string) {
    const subscription = await BillingDAO.findByOrderId(orderId)
    if (!subscription) {
      throw new ApiError({ statusCode: 404, message: 'Subscription not found' })
    }

    if (subscription.status !== 'created') {
      throw new ApiError({ statusCode: 400, message: 'Subscription is not in created state' })
    }

    const isVerified = verifyRazorpaySignature(orderId, paymentId, signature)
    if (!isVerified) {
      throw new ApiError({ statusCode: 400, message: 'Payment verification failed' })
    }

    const updatedSub = await BillingDAO.markAsActive(orderId, paymentId, 1)
    if (!updatedSub) {
      throw new ApiError({ statusCode: 500, message: 'Failed to activate subscription' })
    }

    const tenant = await TenantDAO.findById(updatedSub.tenantId.toString())
    if (tenant) {
      tenant.planId = updatedSub.planId
      tenant.subscriptionStatus = 'active'
      await tenant.save()
      logger.info(`Tenant ${tenant.slug} officially upgraded to plan ${updatedSub.planId}`)
    }

    return updatedSub
  },

  async handleWebhookSuccess(orderId: string, paymentId: string) {
    const subscription = await BillingDAO.findByOrderId(orderId)

    if (!subscription) {
      logger.error(`Webhook error: Subscription not found for orderId: ${orderId}`)
      return
    }

    // ⚠️ Solution to retry/duplicate webhook updates: idempotency verify
    if (subscription.status === 'active') {
      logger.info(`Idempotency: Order ${orderId} already processed and active.`)
      return subscription
    }

    // Activate the subscription in our DB
    const updatedSub = await BillingDAO.markAsActive(orderId, paymentId, 1)

    if (!updatedSub) {
      logger.error(`Failed to activate subscription for orderId: ${orderId}`)
      return
    }

    // Make tenant's plan updated exactly when the payment is confirmed via webhook
    const tenant = await TenantDAO.findById(updatedSub.tenantId.toString())
    if (tenant) {
      tenant.planId = updatedSub.planId
      tenant.subscriptionStatus = 'active'
      await tenant.save()
      logger.info(`Tenant ${tenant.slug} officially upgraded to plan ${updatedSub.planId}`)
    }

    return updatedSub
  }
}

export default BillingService
