import { addAuthEmailToQueue } from '@/queues/Auth.email.queue'
import { logger } from '@/utils/logger'

type SendEmailOptions = {
  to: string
  subject: string
  html: string
}

export const sendAuthEmail = async ({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<void> => {
  try {
    await addAuthEmailToQueue({ to, subject, html })
    logger.info('Email added to queue successfully', {
      module: 'EMAIL',
      to,
      subject,
    })
  } catch (error) {
    logger.error('Failed to add email to queue', {
      module: 'EMAIL',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}
