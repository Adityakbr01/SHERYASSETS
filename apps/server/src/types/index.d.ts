import type { IUser } from '@/modules/User/user.type'
import type { ITenant } from '@/modules/Tenant/tenant.type'
import type { IMembership } from '@/modules/Membership/membership.type'
import type { IApiKey } from '@/modules/ApiKey/apikey.type'
import type { IPlan } from '@/modules/Plan/plan.type'
import type { Logger } from 'winston'

declare global {
  namespace Express {
    interface Request {
      requestId?: string
      logger?: Logger
      user?: IUser
      tenant?: ITenant
      membership?: IMembership
      apiKey?: IApiKey
      plan?: IPlan
    }
  }
}

export {}
