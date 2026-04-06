import { Types } from 'mongoose'
import { Usage } from './usage.model'
import type { IUsage, UsageIncrementInput } from './usage.type'

type UsageTotals = {
    uploadCount: number
    transformationCount: number
    bandwidthBytes: number
    originFetchCount: number
    cacheHitCount: number
}

const buildIncrementDocument = (input: UsageIncrementInput): Record<string, number> => {
    const update: Record<string, number> = {}

    if (input.uploadCount && input.uploadCount > 0) update.uploadCount = input.uploadCount
    if (input.transformationCount && input.transformationCount > 0) {
        update.transformationCount = input.transformationCount
    }
    if (input.bandwidthBytes && input.bandwidthBytes > 0) update.bandwidthBytes = input.bandwidthBytes
    if (input.originFetchCount && input.originFetchCount > 0) update.originFetchCount = input.originFetchCount
    if (input.cacheHitCount && input.cacheHitCount > 0) update.cacheHitCount = input.cacheHitCount

    return update
}

const UsageDAO = {
    async findByTenantAndMonth(tenantId: string, month: string): Promise<IUsage | null> {
        return Usage.findOne({ tenantId, month })
    },

    async upsertMonth(tenantId: string, month: string): Promise<IUsage> {
        const usage = await Usage.findOneAndUpdate(
            { tenantId, month },
            {
                $setOnInsert: {
                    tenantId,
                    month,
                },
            },
            {
                upsert: true,
                setDefaultsOnInsert: true,
                returnDocument: 'after',
            },
        )

        if (!usage) {
            throw new Error('Failed to initialize usage document')
        }

        return usage
    },

    async incrementCounters(
        tenantId: string,
        month: string,
        increments: UsageIncrementInput,
    ): Promise<IUsage> {
        const incrementDoc = buildIncrementDocument(increments)

        const usage = await Usage.findOneAndUpdate(
            { tenantId, month },
            {
                $inc: incrementDoc,
                $setOnInsert: {
                    tenantId,
                    month,
                },
            },
            {
                upsert: true,
                setDefaultsOnInsert: true,
                returnDocument: 'after',
            },
        )

        if (!usage) {
            throw new Error('Failed to increment usage counters')
        }

        return usage
    },

    async findLatestByTenant(tenantId: string, limit: number): Promise<IUsage[]> {
        return Usage.find({ tenantId }).sort({ month: -1 }).limit(limit)
    },

    async aggregateTotalsByTenant(tenantId: string): Promise<UsageTotals> {
        const rows = await Usage.aggregate<UsageTotals>([
            {
                $match: {
                    tenantId: new Types.ObjectId(tenantId),
                },
            },
            {
                $group: {
                    _id: null,
                    uploadCount: { $sum: '$uploadCount' },
                    transformationCount: { $sum: '$transformationCount' },
                    bandwidthBytes: { $sum: '$bandwidthBytes' },
                    originFetchCount: { $sum: '$originFetchCount' },
                    cacheHitCount: { $sum: '$cacheHitCount' },
                },
            },
        ])

        const aggregated = rows[0]
        if (!aggregated) {
            return {
                uploadCount: 0,
                transformationCount: 0,
                bandwidthBytes: 0,
                originFetchCount: 0,
                cacheHitCount: 0,
            }
        }

        return aggregated
    },
}

export default UsageDAO
