import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const swaggerJsonPath = resolve(currentDir, '../../docs/swagger.json');

const FALLBACK_SWAGGER_SPEC: Record<string, unknown> = {
    openapi: '3.0.0',
    info: {
        title: 'SHERYASSETS API',
        version: '1.0.0',
        description: 'Fallback API specification',
    },
    paths: {},
};

const loadSwaggerSpec = (): Record<string, unknown> => {
    try {
        const fileContent = readFileSync(swaggerJsonPath, 'utf-8').replace(/^\uFEFF/, '');
        return JSON.parse(fileContent) as Record<string, unknown>;
    } catch {
        return FALLBACK_SWAGGER_SPEC;
    }
};

export const swaggerSpec = loadSwaggerSpec();