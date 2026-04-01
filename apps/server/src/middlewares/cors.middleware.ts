import { env } from '@/configs/ENV'
import cors, { type CorsOptions } from 'cors'

// 🔐 Normalize origins (trim + remove empty)
const allowedOrigins = (env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const isDev = env.NODE_ENV === 'development'

// 🔥 Origin handler (core logic)
const originHandler: CorsOptions['origin'] = (origin, callback) => {
  try {
    // ✅ Allow no-origin requests (Postman, mobile apps, curl)
    if (!origin) return callback(null, true)

    // ✅ Dev mode → allow all
    if (isDev) return callback(null, true)

    // ✅ Production → strict check
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    // ❌ Block request
    return callback(new Error(`CORS blocked for origin: ${origin}`))
  } catch {
    return callback(new Error('CORS validation error'))
  }
}

// 🚀 Final CORS config
export const corsMiddleware = cors({
  origin: originHandler,

  credentials: true, // 🔥 required for cookies / auth

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],

  exposedHeaders: ['set-cookie'],

  optionsSuccessStatus: 204, // better standard than 200
})
