import { env } from '@/configs/ENV'
import { logger } from '@/utils/logger'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import type { Readable } from 'node:stream'

const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable'

const hasRealS3Config =
    env.AWS_ACCESS_KEY.length > 0
    && env.AWS_SECRET_KEY.length > 0
    && env.AWS_REGION.length > 0
    && env.AWS_BUCKET_NAME.length > 0
    && !env.AWS_ACCESS_KEY.startsWith('fake_')
    && !env.AWS_SECRET_KEY.startsWith('fake_')
    && !env.AWS_REGION.startsWith('fake_')
    && !env.AWS_BUCKET_NAME.startsWith('fake_')

const useMockS3 = env.NODE_ENV === 'test' || !hasRealS3Config

const s3Client = useMockS3
    ? null
    : new S3Client({
        region: env.AWS_REGION,
        forcePathStyle: env.AWS_S3_FORCE_PATH_STYLE,
        credentials: {
            accessKeyId: env.AWS_ACCESS_KEY,
            secretAccessKey: env.AWS_SECRET_KEY,
        },
    })

const mockS3Store = new Map<string, Buffer>()

if (useMockS3) {
    logger.warn('S3 is running in mock mode (test/local fallback)')
}

type UploadStreamInput = {
    key: string
    stream: Readable
    contentType?: string
    cacheControl?: string
}

type UploadBufferInput = {
    key: string
    buffer: Buffer
    contentType?: string
    cacheControl?: string
}

const toBuffer = async (stream: AsyncIterable<Uint8Array>): Promise<Buffer> => {
    const chunks: Buffer[] = []

    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk))
    }

    return Buffer.concat(chunks)
}

const normalizeKey = (key: string): string => key.replace(/^\/+/, '')

const normalizeCdnBaseUrl = (url: string): string => url.replace(/\/+$/, '')

const encodeS3KeyForUrl = (key: string): string => key.split('/').map((segment) => encodeURIComponent(segment)).join('/')

const S3Service = {
    bucketName: env.AWS_BUCKET_NAME,
    cacheControlHeader: DEFAULT_CACHE_CONTROL,

    buildCdnUrl(key: string): string {
        const base = normalizeCdnBaseUrl(env.CDN_BASE_URL)
        const encodedKey = encodeS3KeyForUrl(normalizeKey(key))
        return `${base}/${encodedKey}`
    },

    async uploadStream({
        key,
        stream,
        contentType,
        cacheControl = DEFAULT_CACHE_CONTROL,
    }: UploadStreamInput): Promise<void> {
        const normalizedKey = normalizeKey(key)

        if (useMockS3 || !s3Client) {
            const buffer = await toBuffer(stream)
            mockS3Store.set(normalizedKey, buffer)
            return
        }

        const uploader = new Upload({
            client: s3Client,
            params: {
                Bucket: env.AWS_BUCKET_NAME,
                Key: normalizedKey,
                Body: stream,
                ContentType: contentType,
                CacheControl: cacheControl,
            },
        })

        await uploader.done()
    },

    async uploadBuffer({
        key,
        buffer,
        contentType,
        cacheControl = DEFAULT_CACHE_CONTROL,
    }: UploadBufferInput): Promise<void> {
        const normalizedKey = normalizeKey(key)

        if (useMockS3 || !s3Client) {
            mockS3Store.set(normalizedKey, buffer)
            return
        }

        await s3Client.send(
            new PutObjectCommand({
                Bucket: env.AWS_BUCKET_NAME,
                Key: normalizedKey,
                Body: buffer,
                ContentType: contentType,
                CacheControl: cacheControl,
            }),
        )
    },

    async getObjectBuffer(key: string): Promise<Buffer> {
        const normalizedKey = normalizeKey(key)

        if (useMockS3 || !s3Client) {
            const cached = mockS3Store.get(normalizedKey)
            if (!cached) {
                throw new Error(`S3 mock object not found for key: ${normalizedKey}`)
            }
            return cached
        }

        const response = await s3Client.send(
            new GetObjectCommand({
                Bucket: env.AWS_BUCKET_NAME,
                Key: normalizedKey,
            }),
        )

        const body = response.Body as AsyncIterable<Uint8Array> | undefined

        if (!body) {
            throw new Error(`S3 object has no body for key: ${normalizedKey}`)
        }

        return toBuffer(body)
    },
}

export default S3Service
