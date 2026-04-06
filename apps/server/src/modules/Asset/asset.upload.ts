import { env } from '@/configs/ENV'
import { ApiError } from '@/utils/ApiError'
import Busboy from 'busboy'
import type { Request } from 'express'

export type ParsedAssetUpload = {
    fileBuffer: Buffer
    fileName: string
    mimeType: string
    folder?: string
    path?: string
    metadata?: Record<string, unknown>
}

const parseMetadataField = (value: string): Record<string, unknown> => {
    try {
        const parsed = JSON.parse(value) as unknown

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('Metadata must be an object')
        }

        return parsed as Record<string, unknown>
    } catch {
        throw new ApiError({ statusCode: 400, message: 'metadata must be a valid JSON object' })
    }
}

export const parseAssetUploadRequest = (req: Request): Promise<ParsedAssetUpload> => new Promise((resolve, reject) => {
    const contentType = req.headers['content-type']

    if (!contentType || !contentType.includes('multipart/form-data')) {
        reject(new ApiError({ statusCode: 415, message: 'Use multipart/form-data for file upload' }))
        return
    }

    const busboy = Busboy({
        headers: req.headers,
        limits: {
            files: 1,
            fields: 20,
            fileSize: env.ASSET_MAX_UPLOAD_BYTES,
        },
    })

    let hasFinished = false
    let hasFile = false
    let fileName = 'upload.bin'
    let mimeType = 'application/octet-stream'
    const chunks: Buffer[] = []
    let totalBytes = 0
    let folder: string | undefined
    let path: string | undefined
    let metadata: Record<string, unknown> | undefined

    const safeResolve = (payload: ParsedAssetUpload) => {
        if (hasFinished) return
        hasFinished = true
        resolve(payload)
    }

    const safeReject = (error: unknown) => {
        if (hasFinished) return
        hasFinished = true
        reject(error)
    }

    busboy.on('field', (name, value) => {
        if (name === 'folder') {
            folder = value
            return
        }

        if (name === 'path') {
            path = value
            return
        }

        if (name === 'metadata') {
            try {
                metadata = parseMetadataField(value)
            } catch (error) {
                safeReject(error)
            }
        }
    })

    busboy.on('file', (fieldName, stream, info) => {
        if (fieldName !== 'file') {
            stream.resume()
            return
        }

        hasFile = true
        fileName = info.filename || fileName
        mimeType = info.mimeType || mimeType

        stream.on('data', (chunk: Buffer) => {
            totalBytes += chunk.length
            chunks.push(Buffer.from(chunk))
        })

        stream.on('limit', () => {
            safeReject(
                new ApiError({
                    statusCode: 413,
                    message: `File too large. Maximum allowed size is ${env.ASSET_MAX_UPLOAD_BYTES} bytes`,
                }),
            )
        })
    })

    busboy.on('error', (error) => {
        const errorMessage = error instanceof Error ? error.message : 'Invalid multipart upload payload'

        safeReject(
            new ApiError({
                statusCode: 400,
                message: errorMessage,
            }),
        )
    })

    busboy.on('close', () => {
        if (!hasFile) {
            safeReject(new ApiError({ statusCode: 400, message: 'File is required in form field "file"' }))
            return
        }

        if (totalBytes <= 0) {
            safeReject(new ApiError({ statusCode: 400, message: 'Uploaded file is empty' }))
            return
        }

        safeResolve({
            fileBuffer: Buffer.concat(chunks, totalBytes),
            fileName,
            mimeType,
            folder,
            path,
            metadata,
        })
    })

    req.pipe(busboy)
})
