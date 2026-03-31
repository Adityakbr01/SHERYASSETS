import dotenv from 'dotenv'
import path from 'path'
import zod from 'zod'

// Load environment variables
if (process.env.NODE_ENV === 'production') {
  dotenv.config({
    path: path.resolve(process.cwd(), '.env.production'),
  })
} else {
  dotenv.config()
}

// Define a schema for environment variables
const envSchema = zod.object({
  NODE_ENV: zod.enum(['development', 'production', 'test']).default('development'),
  PORT: zod.string().default('5000'),
  DB_URL: zod.string().default('mongodb://localhost:27017/sheryassets'),
  JWT_SECRET: zod.string().default('your_jwt_secret'),
  JWT_EXPIRES_IN: zod.string().default('1h'),
  SALT_ROUNDS: zod.string().default('10'),
})

// Validate and parse environment variables
const ENV = envSchema.safeParse(process.env)
if (!ENV.success) {
  console.error('Invalid environment variables:', ENV.error.format())
  process.exit(1)
}

export default ENV.data
