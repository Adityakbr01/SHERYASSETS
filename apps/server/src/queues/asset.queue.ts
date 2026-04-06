import { env } from '@/configs/ENV'
import { redisConnection } from '@/configs/redis'
import { Queue } from 'bullmq'

export const assetQueueName = 'asset-queue'
export const processAssetJobName = 'process-asset-variants'

export type AssetProcessingJobData = {
    assetId: string
    tenantId: string
    originalKey: string
    variantKeys: {
        mobile: string
        tablet: string
        desktop: string
    }
}

export const assetQueue = new Queue(assetQueueName, {
    connection: redisConnection,
    skipVersionCheck: env.NODE_ENV === 'test',
})

export const addAssetToProcessingQueue = async (data: AssetProcessingJobData): Promise<void> => {
    await assetQueue.add(processAssetJobName, data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: 500,
        removeOnFail: 500,
    })
}
