import { Queue } from 'bullmq'
import { env } from '@/configs/ENV'
import { redisConnection } from '@/configs/redis'

export const emailQueue = new Queue('email-queue', {
  connection: redisConnection,
  skipVersionCheck: env.NODE_ENV === 'test',
})

type SendEmailData = {
  to: string
  subject: string
  html: string
}

export const AuthQueueName = "send-auth-email"

export const addAuthEmailToQueue = async (data: SendEmailData): Promise<void> => {
  await emailQueue.add(AuthQueueName, data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  })
}
