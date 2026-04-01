import express from 'express'
import { applyErrorMiddleware, applyMiddlewares } from './middlewares/app.middleware'
import router from './routes'

const app = express()

applyMiddlewares(app)

//  routes
app.use('/api/v1', router)

applyErrorMiddleware(app)

export default app
