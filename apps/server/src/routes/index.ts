import { Router } from 'express'

import authRouter from '@/modules/Auth/auth.route'

const router = Router()

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
  })
})

router.use('/auth', authRouter)

export default router
