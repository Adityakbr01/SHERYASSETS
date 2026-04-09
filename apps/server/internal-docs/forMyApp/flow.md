# SheryAssets Documentation & API Generation Flow

This document explains the architecture, flow, and roles of the different technologies involved in generating, defining, and serving documentation for the SheryAssets platform.

## 🌟 The Tech Stack

1. **Zod**: Used for runtime data validation and schema declaration. It defines exactly what headers, query parameters, request bodies, and responses should look like.
2. **OpenAPI / Swagger**: An industry-standard specification for describing RESTful APIs. It allows interactive playgrounds and automated SDK generation.
3. **`@asteasolutions/zod-to-openapi`**: A library that bridges Zod and OpenAPI. It parses our Zod schemas and automatically converts them into OpenAPI v3 specifications.
4. **Mintlify**: A modern documentation platform. It consumes the generated `swagger.json` files to render beautiful, interactive developer-facing API reference pages and guides.

---

## 🛠️ How It Works (The Flow)

### 1. Define Routes with Zod
In the platform's route controllers, we use Zod to define input and output structures. These Zod schemas ensure that bad data is rejected before it even hits our business logic.

```typescript
// Example: src/modules/Auth/auth.validation.ts
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const loginSchema = z.object({
  email: z.string().email().openapi({ example: 'dev@example.com' }),
  password: z.string().min(6).openapi({ example: 'Password123!' })
});
```

### 2. Register with OpenAPI Registry
Inside our `openapi/` folder (such as `openapi/registry.js` and `openapi/index.js`), an `OpenAPIRegistry` is used. We register all of the schemas and route definitions we created in step 1.

```javascript
// Example: openapi/index.js
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

const registry = new OpenAPIRegistry();

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': { schema: loginSchema }
      }
    }
  },
  responses: { ... }
});

export function generateOpenApi() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: { title: 'SheryAssets API', version: '1.0.0' }
  });
}
```

### 3. Generate Docs Data (`generate-docs.js`)
We run a script (`bun run docs:generate`) which triggers `generate-docs.js`. 
This script:
1. Calls `generateOpenApi()` to get the raw JSON configuration for all APIs.
2. Saves the master schema into `swagger.json`.
3. Splits the master schema into smaller, module-specific schemas (e.g. Auth, Asset, Billing) based on the "tags" assigned to each route.
4. Outputs these chunked JSON files into `openapi/modules/<modulename>/swagger-<modulename>.json`. 

```javascript
// Example logic in generate-docs.js
const moduleSpecs = [
  { tag: 'Auth', fileName: 'openapi/modules/auth/swagger-auth.json' },
  { tag: 'Asset', fileName: 'openapi/modules/assets/swagger-asset.json' }
];

// Generates specific specs
for (const moduleSpec of moduleSpecs) {
  const moduleDocument = buildTagSpec(document, moduleSpec.tag);
  writeJson(internalDocsDir, moduleSpec.fileName, moduleDocument);
}
```

### 4. Render with Mintlify
Mintlify reads our Markdown pages (`.mdx`) and the structure defined in `docs.json`. 

In `docs.json`, we point the navigation straight to the module specific swagger files generated above:
```json
{
  "group": "Authentication",
  "openapi": {
    "source": "openapi/modules/auth/swagger-auth.json",
    "directory": "api/auth"
  }
}
```
When `mintlify dev` spins up, or when it builds on production, it parses the `swagger-auth.json` document and generates the interactive UI (API Reference, Playground) developers use to test boundaries.

---

## 📂 File Roles Dictionary

- **`internal-docs/openapi/registry.js`**: Stores the central `OpenAPIRegistry`. All route modules import this registry to attach their own specific route configurations.
- **`internal-docs/openapi/index.js`**: Initializes the `OpenApiGeneratorV3` utilizing the populated registry to create the master JavaScript object representing the OpenAPI spec.
- **`internal-docs/openapi/generate-docs.js`**: CLI script executed by package.json. It builds the spec, slices it by groups/tags, and writes the multiple `.json` outputs to disk.
- **`internal-docs/docs.json`**: The heart of Mintlify. Controls UI settings, branding, navigation trees, and maps specific API documentation pages to the `.json` files.
- **`package.json`**: Contains the `"docs:generate"` and `"dev"` scripts so generation and serving can be easily controlled via npm/bun tasks.

