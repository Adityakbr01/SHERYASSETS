import express from 'express'
import { applyErrorMiddleware, applyMiddlewares } from './middlewares/app.middleware'
import router from './routes'
import { swaggerSpec } from './configs/swagger'
import { publicSwaggerSpec } from './configs/publicSwagger'
import swaggerUi from 'swagger-ui-express'
import { protectInternalDocs } from './middlewares/internalDocs.middleware'

const app = express()

applyMiddlewares(app)

// Swagger JSON endpoint for Mintlify/external tools
app.get('/swagger.json', protectInternalDocs, (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// Public Swagger JSON endpoint for external developer docs
app.get('/public/swagger.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(publicSwaggerSpec)
})

// Optional Swagger UI for local testing
app.use('/api-docs', protectInternalDocs, swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Public developer Swagger UI (filtered public API spec)
app.use('/developer-docs', swaggerUi.serve, swaggerUi.setup(publicSwaggerSpec))

//  routes
app.use('/api/v1', router)

applyErrorMiddleware(app)

export default app
