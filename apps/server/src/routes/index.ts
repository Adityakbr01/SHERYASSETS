import { Router } from 'express'

import authRouter from '@/modules/Auth/auth.route'
import tenantRouter from '@/modules/Tenant/tenant.route'
import membershipRouter from '@/modules/Membership/membership.route'
import planRouter from '@/modules/Plan/plan.route'
import apiKeyRouter from '@/modules/ApiKey/apikey.route'

const router = Router()

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
  })
})

router.use('/auth', authRouter)
router.use('/tenants', tenantRouter)
router.use('/memberships', membershipRouter)
router.use('/plans', planRouter)
router.use('/api-keys', apiKeyRouter)

export default router
