import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateOpenApi } from './index.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const internalDocsDir = resolve(currentDir, '..');

const operationMethods = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
  'trace',
];

const moduleSpecs = [
  { tag: 'Auth', fileName: 'openapi/modules/auth/swagger-auth.json' },
  { tag: 'Billing', fileName: 'openapi/modules/billing/swagger-billing.json' },
  { tag: 'Tenant', fileName: 'openapi/modules/tenant/swagger-tenant.json' },
  {
    tag: 'Membership',
    fileName: 'openapi/modules/membership/swagger-membership.json',
  },
  { tag: 'ApiKey', fileName: 'openapi/modules/apikey/swagger-apikey.json' },
  { tag: 'Plan', fileName: 'openapi/modules/plan/swagger-plan.json' },
  { tag: 'Asset', fileName: 'openapi/modules/assets/swagger-asset.json' },
  { tag: 'Usage', fileName: 'openapi/modules/usage/swagger-usage.json' },
];

const writeJson = (targetDir, fileName, payload) => {
  const outputPath = resolve(targetDir, fileName);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
};

const collectSwaggerFiles = (targetDir, relativeDir = '') => {
  const currentPath = resolve(targetDir, relativeDir);
  const files = [];

  for (const entry of readdirSync(currentPath, { withFileTypes: true })) {
    const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(...collectSwaggerFiles(targetDir, relativePath));
      continue;
    }

    if (entry.name.startsWith('swagger-') && entry.name.endsWith('.json')) {
      files.push(relativePath);
    }
  }

  return files;
};

const removeStaleModuleSpecs = (targetDir, allowedFileNames) => {
  const moduleDir = 'openapi/modules';
  const allowed = new Set(allowedFileNames);

  for (const fileName of collectSwaggerFiles(targetDir, moduleDir)) {
    if (allowed.has(fileName)) {
      continue;
    }

    unlinkSync(resolve(targetDir, fileName));
  }
};

const removeLegacyRootSplitSpecs = (targetDir) => {
  const legacySplitFiles = [
    'swagger-auth.json',
    'swagger-billing.json',
    'swagger-tenant.json',
    'swagger-membership.json',
    'swagger-apikey.json',
    'swagger-plan.json',
    'swagger-asset.json',
    'swagger-usage.json',
  ];

  for (const fileName of legacySplitFiles) {
    try {
      unlinkSync(resolve(targetDir, fileName));
    } catch {
      // Ignore missing legacy files.
    }
  }
};

const buildTagSpec = (document, tag) => {
  const filteredPaths = {};

  for (const [pathName, pathItem] of Object.entries(document.paths || {})) {
    const matchedOperations = {};

    for (const method of operationMethods) {
      const operation = pathItem[method];

      if (!operation) {
        continue;
      }

      if (Array.isArray(operation.tags) && operation.tags.includes(tag)) {
        matchedOperations[method] = operation;
      }
    }

    if (Object.keys(matchedOperations).length > 0) {
      filteredPaths[pathName] = matchedOperations;
    }
  }

  return {
    ...document,
    paths: filteredPaths,
  };
};

const main = () => {
  const document = generateOpenApi();

  // Internal docs: full API + module-local split specs.
  writeJson(internalDocsDir, 'swagger.json', document);

  for (const moduleSpec of moduleSpecs) {
    const moduleDocument = buildTagSpec(document, moduleSpec.tag);
    writeJson(internalDocsDir, moduleSpec.fileName, moduleDocument);
  }

  removeStaleModuleSpecs(
    internalDocsDir,
    moduleSpecs.map((moduleSpec) => moduleSpec.fileName),
  );
  removeLegacyRootSplitSpecs(internalDocsDir);
};

main();

