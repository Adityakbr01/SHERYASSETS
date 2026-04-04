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
  (info) => {
    const { level, message, timestamp, service, env, requestId, module, stack, ...meta } = info
    const metaKeys = Object.keys(meta)
    
    // Check if meta contains an err object directly and extract it for better formatting
    let serializedMeta = ''
    if (metaKeys.length > 0) {
      if (meta.err && meta.err instanceof Error) {
        serializedMeta = `\n${meta.err.stack || meta.err.message}`
        delete meta.err
        if (Object.keys(meta).length > 0) {
            serializedMeta += `\n> ${JSON.stringify(meta, null, 2)}`
        }
      } else {
        serializedMeta = `\n> ${JSON.stringify(meta, null, 2)}`
      }
    }

    const formattedMessage = stack ? `${message}\n${stack}` : message

    return `${timestamp} [${service}] [${env}] [${level}] ${requestId ? `[req:${requestId}]` : ''} ${module ? `[${module}]` : ''} ${formattedMessage}${serializedMeta}`
  },
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
      : winston.format.combine(
          winston.format.errors({ stack: true }),
          dateFormat, 
          levelColorize, 
          devFormat
        ),

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
