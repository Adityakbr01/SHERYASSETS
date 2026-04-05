import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const swaggerJsonPath = resolve(currentDir, '../../docs/swagger.json');

const loadSwaggerSpec = (): Record<string, unknown> => {
    const fileContent = readFileSync(swaggerJsonPath, 'utf-8');
    return JSON.parse(fileContent) as Record<string, unknown>;
};

export const swaggerSpec = loadSwaggerSpec();