import { Queue } from 'bullmq'
import { env } from '@/configs/ENV'
import { redisConnection } from '@/configs/redis'

export const membershipQueue = new Queue('membership-queue', {
  connection: redisConnection,
  skipVersionCheck: env.NODE_ENV === 'test',
})

export type InviteEmailData = {
  email: string
  tenantName: string
  role: string
  inviteLink: string
}

export const membershipQueueName = 'send-invite-email'

export const addMembershipInviteToQueue = async (data: InviteEmailData): Promise<void> => {
  await membershipQueue.add(membershipQueueName, data, {
    priority: 100, // Explicitly lower priority number
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
}
