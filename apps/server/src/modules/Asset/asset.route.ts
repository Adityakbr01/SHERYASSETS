import { authenticateUser, requireRole, resolveTenant } from '@/middlewares/auth.middleware'
import { authenticateApiKey } from '@/middlewares/apiKey.middleware'
import { validate } from '@/middlewares/validate.middleware'
import { Router } from 'express'
import AssetController from './asset.controller'
import {
    assetIdParamSchema,
    listAssetsSchema,
    updateAssetStatusSchema,
} from './asset.validation'

const assetRouter = Router()

// Machine-to-machine upload metadata endpoint (API key protected)
assetRouter.post(
    '/upload',
    authenticateApiKey,
    AssetController.createFromApiKey,
)

// Dashboard-facing management endpoints
assetRouter.use(authenticateUser, resolveTenant)

assetRouter.get('/', validate(listAssetsSchema), AssetController.listByTenant)
assetRouter.get('/:assetId', validate(assetIdParamSchema), AssetController.getById)
assetRouter.patch(
    '/:assetId/status',
    requireRole(['owner', 'admin']),
    validate(updateAssetStatusSchema),
    AssetController.updateStatus,
)
assetRouter.delete(
    '/:assetId',
    requireRole(['owner', 'admin']),
    validate(assetIdParamSchema),
    AssetController.remove,
)

export default assetRouter
