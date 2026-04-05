import express from 'express'
import { applyErrorMiddleware, applyMiddlewares } from './middlewares/app.middleware'
import router from './routes'
import { swaggerSpec } from './configs/swagger'
import swaggerUi from 'swagger-ui-express'

const app = express()

applyMiddlewares(app)

// Swagger JSON endpoint for Mintlify/external tools
app.get('/swagger.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// Optional Swagger UI for local testing
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

//  routes
app.use('/api/v1', router)

applyErrorMiddleware(app)

export default app
