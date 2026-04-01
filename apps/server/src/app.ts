import express from 'express'
import { applyErrorMiddleware, applyMiddlewares } from './middlewares/app.middleware'

const app = express()

applyMiddlewares(app)

//  routes
app.get('/', (_req, res) => {
  res.send('Hello World!')
})


applyErrorMiddleware(app)

export default app
