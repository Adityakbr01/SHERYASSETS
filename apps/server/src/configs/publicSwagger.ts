import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const publicSwaggerJsonPath = resolve(currentDir, '../../docs/swagger.json')

const FALLBACK_PUBLIC_SWAGGER_SPEC: Record<string, unknown> = {
  openapi: '3.0.0',
  info: {
    title: 'SHERYASSETS Public Developer API',
    version: '1.0.0',
    description: 'Fallback public API specification',
  },
  paths: {},
}

const loadPublicSwaggerSpec = (): Record<string, unknown> => {
  try {
    const fileContent = readFileSync(publicSwaggerJsonPath, 'utf-8').replace(
      /^\uFEFF/,
      '',
    )
    return JSON.parse(fileContent) as Record<string, unknown>
  } catch {
    return FALLBACK_PUBLIC_SWAGGER_SPEC
  }
}

export const publicSwaggerSpec = loadPublicSwaggerSpec()
