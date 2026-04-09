
import { redisConnection } from '@/configs/redis'
import { ApiError } from '@/utils/ApiError'

interface CooldownOptions {
    key: string
    ttl: number // seconds
    message?: string
}

export async function checkAndSetCooldown({
    key,
    ttl,
    message = 'Please wait before requesting again',
}: CooldownOptions): Promise<void> {
    const exists = await redisConnection.get(key)

    if (exists) {
        throw new ApiError({
            statusCode: 429,
            message,
        })
    }

    await redisConnection.set(key, '1', 'EX', ttl)
}