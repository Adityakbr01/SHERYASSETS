import { env } from '@/configs/ENV'
import { redisConnection } from '@/configs/redis'
import { AuthQueueName } from '@/queues/Auth.email.queue'
import { logger } from '@/utils/logger'
import { type Job, Worker } from 'bullmq'
import { Resend } from 'resend'

type SendEmailData = {
  to: string
  subject: string
  html: string
}

const FROM_EMAIL = 'no-reply@edulaunch.shop'

const getResendClient = (): Resend | null => {
  if (!env.RESEND_API_KEY) {
    return null
  }
  return new Resend(env.RESEND_API_KEY)
}

export const emailWorker = new Worker(
  AuthQueueName,
  async (job: Job<SendEmailData>) => {
    const { to, subject, html } = job.data
    const resend = getResendClient()

    if (!resend) {
      logger.warn('RESEND_API_KEY is missing; skipping email send in worker', {
        jobId: job.id,
        module: 'EMAIL_WORKER',
        to,
        subject,
      })
      return
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      throw new Error(error.message || 'Failed to send email via Resend')
    }

    logger.info('Email sent successfully via BullMQ worker', {
      jobId: job.id,
      to,
    })
  },
  {
    connection: redisConnection,
    skipVersionCheck: env.NODE_ENV === 'test',
  },
)

emailWorker.on('completed', (job) => {
  logger.info(`Email job ${job.id} has completed!`)
})

emailWorker.on('failed', (job, err) => {
  logger.error(`Email job ${job?.id} has failed with ${err.message}`)
})
