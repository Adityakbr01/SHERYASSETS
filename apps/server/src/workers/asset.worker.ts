import { env } from '@/configs/ENV'
import { redisConnection } from '@/configs/redis'
import AssetService from '@/modules/Asset/asset.service'
import { type AssetProcessingJobData, assetQueueName } from '@/queues/asset.queue'
import S3Service from '@/services/s3.service'
import { logger } from '@/utils/logger'
import { type Job, Worker } from 'bullmq'
import sharp from 'sharp'

const generateWebpVariant = async (originalBuffer: Buffer, width: number): Promise<Buffer> => sharp(originalBuffer)
    .resize({
        width,
        fit: 'inside',
        withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer()

export const assetWorker = new Worker(
    assetQueueName,
    async (job: Job<AssetProcessingJobData>) => {
        const { assetId, tenantId, originalKey, variantKeys } = job.data

        try {
            const originalBuffer = await S3Service.getObjectBuffer(originalKey)
            const metadata = await sharp(originalBuffer).metadata()

            const [mobileBuffer, tabletBuffer, desktopBuffer] = await Promise.all([
                generateWebpVariant(originalBuffer, 100),
                generateWebpVariant(originalBuffer, 300),
                generateWebpVariant(originalBuffer, 600),
            ])

            await Promise.all([
                S3Service.uploadBuffer({
                    key: variantKeys.mobile,
                    buffer: mobileBuffer,
                    contentType: 'image/webp',
                    cacheControl: S3Service.cacheControlHeader,
                }),
                S3Service.uploadBuffer({
                    key: variantKeys.tablet,
                    buffer: tabletBuffer,
                    contentType: 'image/webp',
                    cacheControl: S3Service.cacheControlHeader,
                }),
                S3Service.uploadBuffer({
                    key: variantKeys.desktop,
                    buffer: desktopBuffer,
                    contentType: 'image/webp',
                    cacheControl: S3Service.cacheControlHeader,
                }),
            ])

            await AssetService.markProcessingCompleted(assetId, tenantId, {
                width: metadata.width,
                height: metadata.height,
                urls: {
                    original: S3Service.buildCdnUrl(originalKey),
                    mobile: S3Service.buildCdnUrl(variantKeys.mobile),
                    tablet: S3Service.buildCdnUrl(variantKeys.tablet),
                    desktop: S3Service.buildCdnUrl(variantKeys.desktop),
                },
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown processing error'
            await AssetService.markProcessingFailed(assetId, tenantId, errorMessage)
            throw error
        }
    },
    {
        connection: redisConnection,
        skipVersionCheck: env.NODE_ENV === 'test',
        concurrency: 2,
    },
)

assetWorker.on('completed', (job) => {
    logger.info(`Asset job ${job.id} completed`)
})

assetWorker.on('failed', (job, error) => {
    logger.error(`Asset job ${job?.id} failed: ${error.message}`)
})
