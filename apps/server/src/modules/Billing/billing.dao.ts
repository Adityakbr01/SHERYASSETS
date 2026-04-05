import { type ISubscription, Subscription } from './subscription.model'

const BillingDAO = {
  async createSubscription(data: Partial<ISubscription>): Promise<ISubscription> {
    const result = await Subscription.create(data)
    return result
  },

  async findByOrderId(orderId: string): Promise<ISubscription | null> {
    const result = await Subscription.findOne({ razorpayOrderId: orderId })
    return result
  },

  async findActiveSubscriptionByTenantId(tenantId: string): Promise<ISubscription | null> {
    const result = await Subscription.findOne({
      tenantId,
      status: 'active',
      endDate: { $gt: new Date() },
    })
    return result
  },

  async markAsActive(orderId: string, paymentId: string, durationMonths: number): Promise<ISubscription | null> {
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + durationMonths)

    const result = await Subscription.findOneAndUpdate(
      { razorpayOrderId: orderId },
      {
        status: 'active',
        razorpayPaymentId: paymentId,
        startDate,
        endDate,
      },
      { returnDocument: 'after' }
    )

    return result
  },
}

export default BillingDAO
