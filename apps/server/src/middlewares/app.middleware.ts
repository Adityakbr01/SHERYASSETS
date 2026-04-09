import compression from 'compression'
import cookieParser from 'cookie-parser'
import express, { type Application } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

import { env } from '@/configs/ENV'
import { requestLogger } from '@/utils/requestLogger'
import { corsMiddleware } from './cors.middleware'
import { errorHandler } from './errorMiddleware'
import globalLimiter from './globalLimiter.middleware'
import { notFoundMiddleware } from './notFount.middleware'

export const applyMiddlewares = (app: Application) => {
  // 🔐 SECURITY (Helmet)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )

  // 🛡️ GLOBAL RATE LIMITING
  app.use(globalLimiter)

  // 🌐 CORS
  app.use(corsMiddleware)

  // 🗜️ COMPRESSION
  app.use(compression())

  // 🧾 DEV LOGGING
  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
  }

  // 📦 BODY PARSER
  app.use(express.json({ limit: '16kb' }))

  // ⛔ INVALID JSON BODY CATCHER
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (err instanceof SyntaxError && 'body' in err) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid JSON payload format' })
      }
      next()
    },
  )

  app.use(express.urlencoded({ extended: true, limit: '16kb' }))

  // 🍪 COOKIE PARSER
  app.use(cookieParser())

  // 🔍 REQUEST LOGGER
  app.use(requestLogger)
}

export const applyErrorMiddleware = (app: Application) => {
  // 🚨 ERROR HANDLER (always last)
  notFoundMiddleware(app)
  app.use(errorHandler)
}
