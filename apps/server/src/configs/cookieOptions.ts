import { env } from "./ENV"


const isProd = env.NODE_ENV === 'production'

export const cookieOptions = {
  httpOnly: true, // 🔥 JS se access nahi hoga (XSS safe)
  secure: isProd, // HTTPS only in production
  sameSite: isProd ? 'none' : 'lax', // cross-origin ke liye important
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}
