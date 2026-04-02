import { Router } from 'express'
import { authenticateUser, requireRole, resolveTenant } from '@/middlewares/auth.middleware'
import ApiKeyController from './apikey.controller'

const apiKeyRouter = Router()

// All routes require auth + tenant context + owner/admin role
apiKeyRouter.use(authenticateUser, resolveTenant, requireRole(['owner', 'admin']))

apiKeyRouter.post('/', ApiKeyController.create)
apiKeyRouter.get('/', ApiKeyController.list)
apiKeyRouter.patch('/:keyId/revoke', ApiKeyController.revoke)

export default apiKeyRouter
