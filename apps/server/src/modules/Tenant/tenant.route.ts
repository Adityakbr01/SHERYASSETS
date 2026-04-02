import { authenticateUser } from '@/middlewares/auth.middleware'
import { Router } from 'express'
import TenantController from './tenant.controller'

const tenantRouter = Router()

tenantRouter.get('/my-tenants', authenticateUser, TenantController.getMyTenants)
tenantRouter.get('/slug/:slug', authenticateUser, TenantController.getTenantBySlug)

export default tenantRouter
