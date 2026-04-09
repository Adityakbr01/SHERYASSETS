import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateOpenApi } from '../../internal-docs/openapi/index.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const publicDocsDir = resolve(currentDir, '..');

const operationMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'];

const publicModuleSpecs = [
  { tag: 'Auth', fileName: 'openapi/modules/auth/swagger-auth.json' },
  { tag: 'Asset', fileName: 'openapi/modules/asset/swagger-asset.json' },
];

const writeJson = (targetDir, fileName, payload) => {
  const outputPath = resolve(targetDir, fileName);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
};

const collectSwaggerFiles = (targetDir, relativeDir = '') => {
  const currentPath = resolve(targetDir, relativeDir);
  const files = [];
  for (const entry of readdirSync(currentPath, { withFileTypes: true })) {
    const relativePath = relativeDir ? relativeDir + '/' + entry.name : entry.name;
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

const removeStalePublicSpecs = (targetDir, allowedFileNames) => {
  const allowed = new Set(allowedFileNames);
  for (const fileName of collectSwaggerFiles(targetDir)) {
    if (allowed.has(fileName)) continue;
    unlinkSync(resolve(targetDir, fileName));
  }
};

const buildTagSpec = (document, tag) => {
  const filteredPaths = {};
  for (const [pathName, pathItem] of Object.entries(document.paths ?? {})) {
    const matchedOperations = {};
    for (const method of operationMethods) {
      const operation = pathItem[method];
      if (!operation) continue;
      if (Array.isArray(operation.tags) && operation.tags.includes(tag)) {
        matchedOperations[method] = operation;
      }
    }
    if (Object.keys(matchedOperations).length > 0) {
      filteredPaths[pathName] = matchedOperations;
    }
  }
  return { ...document, paths: filteredPaths };
};

const buildTagsSpec = (document, tags) => {
  const tagSet = new Set(tags);
  const filteredPaths = {};
  for (const [pathName, pathItem] of Object.entries(document.paths ?? {})) {
    const matchedOperations = {};
    for (const method of operationMethods) {
      const operation = pathItem[method];
      if (!operation) continue;
      if (Array.isArray(operation.tags) && operation.tags.some(item => tagSet.has(item))) {
        matchedOperations[method] = operation;
      }
    }
    if (Object.keys(matchedOperations).length > 0) {
      filteredPaths[pathName] = matchedOperations;
    }
  }
  return { ...document, paths: filteredPaths };
};

const main = () => {
  const document = generateOpenApi();
  const publicAllowedTags = publicModuleSpecs.map(m => m.tag);
  const publicDocument = buildTagsSpec(document, publicAllowedTags);
  writeJson(publicDocsDir, 'swagger.json', publicDocument);
  for (const moduleSpec of publicModuleSpecs) {
    const moduleDocument = buildTagSpec(publicDocument, moduleSpec.tag);
    writeJson(publicDocsDir, moduleSpec.fileName, moduleDocument);
  }
  const publicAllowedFileNames = ['swagger.json', ...publicModuleSpecs.map(m => m.fileName)];
  removeStalePublicSpecs(publicDocsDir, publicAllowedFileNames);
};
main();

