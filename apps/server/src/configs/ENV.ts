import { logger } from '@/utils/logger'
import dotenv from 'dotenv'
import path from 'path'
import { z } from 'zod'

// 🔥 Load ENV (robust way)
const envPath =
  process.env.NODE_ENV === 'production'
    ? path.resolve(process.cwd(), '.env.production')
    : path.resolve(process.cwd(), '.env')

dotenv.config({ path: envPath })

// 🧠 Schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: z.coerce.number().default(5000),

  DB_URL: z
    .string()
    .min(1, 'DB_URL is required')
    .default('mongodb://localhost:27017/sheryassets'),

  JWT_SECRET: z
    .string()
    .min(6, 'JWT_SECRET must be at least 6 chars')
    .default('your_jwt_secret'),

  JWT_REFRESH_SECRET: z
    .string()
    .min(6, 'JWT_REFRESH_SECRET must be at least 6 chars')
    .default('your_jwt_refresh_secret'),

  JWT_EXPIRES_IN: z.string().default('1h'),

  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  SALT_ROUNDS: z.coerce.number().default(10),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RESEND_API_KEY: z.string().default(''),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  CDN_BASE_URL: z.string().url().default('https://cdn.edulaunch.shop'),

  RAZORPAY_KEY_ID: z.string().default(''),
  RAZORPAY_KEY_SECRET: z.string().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(''),

  // AWS S3 CONFIGURATION
  AWS_ACCESS_KEY: z.string().default('fake_access_key'),
  AWS_SECRET_KEY: z.string().default('fake_secret_key'),
  AWS_REGION: z.string().default('fake_region'),
  AWS_BUCKET_NAME: z.string().default('fake_bucket_name'),
  AWS_S3_FORCE_PATH_STYLE: z.coerce.boolean().default(false),

  // ASSET UPLOAD CONFIGURATION
  ASSET_MAX_UPLOAD_BYTES: z.coerce.number().positive().default(25 * 1024 * 1024), // 25MB

})

// 🔍 Validate
const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  logger.error('❌ ENV VALIDATION ERROR\n')
  logger.error(JSON.stringify(parsed.error.format(), null, 2))
  process.exit(1)
}

// ✅ Export typed env
export const env = parsed.data
