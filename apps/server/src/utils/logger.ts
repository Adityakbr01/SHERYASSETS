import winston from 'winston'
import path from 'path'

const logDir = 'logs'

// 🎨 custom colors (level based)
winston.addColors({
  info: 'green',
  warn: 'yellow',
  error: 'red',
  debug: 'blue',
})

// 🔥 global meta
const defaultMeta = {
  service: 'api-server',
  env: process.env.NODE_ENV || 'development',
}

// 🕒 timestamp
const dateFormat = winston.format.timestamp({
  format: 'YYYY-MM-DD HH:mm:ss',
})

// 🎯 LEVEL COLOR ONLY (not full line)
const levelColorize = winston.format.colorize({ level: true })

// 🎯 CLEAN FORMAT
const devFormat = winston.format.printf(
  ({ level, message, timestamp, service, env, requestId, module }) => `${timestamp} [${service}] [${env}] [${level}] ${
      requestId ? `[req:${requestId}]` : ''
    } ${module ? `[${module}]` : ''} ${message}`,
)

export const logger = winston.createLogger({
  level: 'debug',
  defaultMeta,

  format:
    process.env.NODE_ENV === 'production'
      ? winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        )
      : winston.format.combine(dateFormat, levelColorize, devFormat),

  transports: [
    new winston.transports.Console(),

    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),

    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
  ],
})
