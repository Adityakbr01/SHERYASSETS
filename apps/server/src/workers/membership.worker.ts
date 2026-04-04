import { env } from '@/configs/ENV'
import { redisConnection } from '@/configs/redis'
import { logger } from '@/utils/logger'
import { type Job, Worker } from 'bullmq'
import { Resend } from 'resend'
import type { InviteEmailData } from '@/queues/membership.queue'

const FROM_EMAIL = 'no-reply@edulaunch.shop'

const getResendClient = (): Resend | null => {
  if (!env.RESEND_API_KEY) {
    return null
  }
  return new Resend(env.RESEND_API_KEY)
}

const getInvitationEmailContent = (tenantName: string, role: string, inviteLink: string): string => `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
    <h2>You've been invited to join ${tenantName}!</h2>
    <p>You have been invited to join the organization <strong>${tenantName}</strong> as an <strong>${role}</strong>.</p>
    <p>Click the link below to accept your invitation:</p>
    <a href="${inviteLink}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#ffffff;text-decoration:none;border-radius:5px;">Accept Invitation</a>
    <p style="margin-top:20px;font-size:12px;color:#666;">If you didn't expect this invitation, you can safely ignore this email.</p>
  </div>
`

export const membershipWorker = new Worker(
  'membership-queue',
  async (job: Job<InviteEmailData>) => {
    const { email, tenantName, role, inviteLink } = job.data
    const resend = getResendClient()

    if (!resend) {
      logger.warn('RESEND_API_KEY is missing; skipping email send in membership worker', {
        jobId: job.id,
        module: 'MEMBERSHIP_WORKER',
        email,
        tenantName,
      })
      return
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Invitation to join ${tenantName}`,
      html: getInvitationEmailContent(tenantName, role, inviteLink),
    })

    if (error) {
      throw new Error(error.message || 'Failed to send invite email via Resend')
    }

    logger.info('Membership invite email sent successfully via BullMQ worker', {
      jobId: job.id,
      email,
    })
  },
  {
    connection: redisConnection,
    skipVersionCheck: env.NODE_ENV === 'test',
  },
)

membershipWorker.on('completed', (job) => {
  logger.info(`Membership job ${job.id} has completed!`)
})

membershipWorker.on('failed', (job, err) => {
  logger.error(`Membership job ${job?.id} has failed with ${err.message}`)
})
