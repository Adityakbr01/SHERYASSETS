declare global {
  namespace Express {
    interface Request {
      requestId?: string
      logger?: typeof logger
    }
  }
}
