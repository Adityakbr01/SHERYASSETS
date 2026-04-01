import type { IUser } from '@/modules/User/user.type'
import type { Logger } from 'winston'

declare global {
  namespace Express {
    interface Request {
      requestId?: string
      logger?: Logger
      user?: IUser
    }
  }
}

export {}
