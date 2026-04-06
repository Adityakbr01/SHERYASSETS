import PlanService from '@/modules/Plan/plan.service'
import { ApiError } from '@/utils/ApiError'
import UsageDAO from './usage.dao'
import type { CacheStatus, IUsage } from './usage.type'

type UsageSummary = {
    month: string
    usage: {
        uploadCount: number
        transformationCount: number
        bandwidthBytes: number
        bandwidthGb: number
        originFetchCount: number
        cacheHitCount: number
    }
    limits: {
        maxImages: number
        maxTransformations: number
        maxBandwidthGb: number
    }
    utilization: {
        imagesPercent: number | null
        transformationsPercent: number | null
        bandwidthPercent: number | null
    }
}

type UsageTotals = {
    uploadCount: number
    transformationCount: number
    bandwidthBytes: number
    bandwidthGb: number
    originFetchCount: number
    cacheHitCount: number
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/
const BYTE_TO_GB = 1024 * 1024 * 1024

const toMonthKey = (date = new Date()): string => {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
}

const normalizeMonth = (month?: string): string => {
    if (!month) {
        return toMonthKey()
    }

    const trimmedMonth = month.trim()

    if (!MONTH_PATTERN.test(trimmedMonth)) {
        throw new ApiError({
            statusCode: 400,
            message: 'Month must be in YYYY-MM format',
        })
    }

    return trimmedMonth
}

const bytesToGb = (bytes: number): number => Number((bytes / BYTE_TO_GB).toFixed(4))

const calculatePercent = (value: number, limit: number): number | null => {
    if (limit === -1) return null
    if (limit === 0) return 100

    const percent = (value / limit) * 100
    return Number(Math.min(100, percent).toFixed(2))
}

const normalizeHistoryLimit = (limit: number): number => {
    if (Number.isNaN(limit)) return 6
    return Math.max(1, Math.min(24, limit))
}

const UsageService = {
    async incrementUpload(tenantId: string, sizeBytes: number, monthInput?: string): Promise<IUsage> {
        if (sizeBytes <= 0) {
            throw new ApiError({ statusCode: 400, message: 'sizeBytes must be greater than 0' })
        }

        const month = normalizeMonth(monthInput)

        return UsageDAO.incrementCounters(tenantId, month, {
            uploadCount: 1,
            bandwidthBytes: sizeBytes,
        })
    },

    async incrementDelivery(
        tenantId: string,
        bandwidthBytes: number,
        cacheStatus: CacheStatus,
        transformationCount: number,
        monthInput?: string,
    ): Promise<IUsage> {
        if (bandwidthBytes < 0) {
            throw new ApiError({ statusCode: 400, message: 'bandwidthBytes cannot be negative' })
        }

        if (transformationCount < 0) {
            throw new ApiError({ statusCode: 400, message: 'transformationCount cannot be negative' })
        }

        const month = normalizeMonth(monthInput)

        return UsageDAO.incrementCounters(tenantId, month, {
            bandwidthBytes,
            transformationCount,
            cacheHitCount: cacheStatus === 'hit' ? 1 : 0,
            originFetchCount: cacheStatus === 'miss' ? 1 : 0,
        })
    },

    async getMonthlySummary(
        tenantId: string,
        planId: string,
        monthInput?: string,
    ): Promise<UsageSummary> {
        const month = normalizeMonth(monthInput)
        const usage = await UsageDAO.upsertMonth(tenantId, month)
        const plan = await PlanService.getById(planId)

        const bandwidthGb = bytesToGb(usage.bandwidthBytes)

        return {
            month,
            usage: {
                uploadCount: usage.uploadCount,
                transformationCount: usage.transformationCount,
                bandwidthBytes: usage.bandwidthBytes,
                bandwidthGb,
                originFetchCount: usage.originFetchCount,
                cacheHitCount: usage.cacheHitCount,
            },
            limits: {
                maxImages: plan.data.limits.maxImages,
                maxTransformations: plan.data.limits.maxTransformations,
                maxBandwidthGb: plan.data.limits.maxBandwidthGb,
            },
            utilization: {
                imagesPercent: calculatePercent(usage.uploadCount, plan.data.limits.maxImages),
                transformationsPercent: calculatePercent(
                    usage.transformationCount,
                    plan.data.limits.maxTransformations,
                ),
                bandwidthPercent: calculatePercent(bandwidthGb, plan.data.limits.maxBandwidthGb),
            },
        }
    },

    async getHistory(tenantId: string, limitInput: number): Promise<IUsage[]> {
        const limit = normalizeHistoryLimit(limitInput)
        return UsageDAO.findLatestByTenant(tenantId, limit)
    },

    async getTotals(tenantId: string): Promise<UsageTotals> {
        const totals = await UsageDAO.aggregateTotalsByTenant(tenantId)

        return {
            ...totals,
            bandwidthGb: bytesToGb(totals.bandwidthBytes),
        }
    },
}

export default UsageService
