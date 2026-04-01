# Image CDN SaaS - Plans and Roadmap

This document defines the initial product plan, pricing tiers, core architecture direction, and phased roadmap for an image optimization and CDN SaaS aimed at developers and startups. The architecture direction is a hybrid setup: frontend and backend on EC2, MongoDB for database, S3 for storage, and Cloudflare as the current CDN layer, with CloudFront planned as a future option when account access is enabled.[1][2][3]

## Product Overview

The product is designed to help developers upload images once, store them in object storage, and serve them through a CDN with optimized formats and variants. A common integration model for image CDNs is to keep the storage origin separate from the delivery layer, while exposing a single developer-friendly image URL and optional transformation parameters.[4][5][6]

### Core goals

- Fast image delivery for India-first and Asia-heavy traffic.[7][8]
- Simple developer integration with ACCESS_KEY authentication and SDK support.[9]
- Tiered plans where premium users receive stronger performance and higher limits.[10][11]
- URL-based transformations with precomputed variants for premium plans and on-demand generation for lower tiers.[12][13][14]

## Current Architecture Direction

The planned stack is practical for an early-stage SaaS and aligns with common hybrid architectures that combine AWS infrastructure with Cloudflare edge delivery.[1][2]

### Infrastructure

| Layer        | Planned choice | Notes                                                                     |
| ------------ | -------------- | ------------------------------------------------------------------------- |
| Frontend     | EC2            | Dashboard, docs, product UI served from the application layer.            |
| Backend      | EC2            | Upload API, auth, plan enforcement, image delivery API.                   |
| Database     | MongoDB        | Stores tenants, API keys, plans, image metadata, analytics.               |
| Storage      | AWS S3         | Stores original images and generated variants.[4][15]                     |
| CDN (now)    | Cloudflare     | Used as the current edge delivery layer in front of storage/origin.[3][2] |
| CDN (future) | CloudFront     | Planned feature when account verification is resolved.[16][17]            |

### Why this setup works

- S3 is already integrated well with image-storage workflows and is widely used as an origin for media delivery.[4][15]
- Cloudflare is a viable current alternative to CloudFront for caching and fast static/media delivery when CloudFront access is blocked.[3][2]
- Keeping the CDN base URL configurable allows a later switch from Cloudflare to CloudFront without redesigning the core upload or metadata model.[5][2]

## Plan Design

The product should start with a small number of clear pricing plans. Tiered billing is a standard SaaS pricing model, and many billing systems support fixed monthly tiers before adding usage-based pricing later.[11][18][10]

### Plans

| Plan  | Price       | Best for                                  | Delivery strategy                           | Transform strategy                                     |
| ----- | ----------- | ----------------------------------------- | ------------------------------------------- | ------------------------------------------------------ |
| Basic | ₹0          | Testing, small projects, indie developers | Standard CDN delivery                       | On-demand transformations with cache.[12][13]          |
| Pro   | ₹1200/month | Production apps, startups, e-commerce     | Faster experience with more prebuilt assets | Core and popular variants precomputed eagerly.[12][13] |
| enterprise   | ₹8000/month | Production apps, startups, e-commerce     | Faster experience with more prebuilt assets | Core and popular variants precomputed eagerly.[12][13] |
| pay as you go   | ₹0/month | Production apps, startups, e-commerce     | Faster experience with more prebuilt assets | Core and popular variants precomputed eagerly.[12][13] |

### Basic plan

The Basic plan should be the free onboarding tier and focus on easy adoption. It should allow image uploads, core CDN delivery, and on-demand transformations with caching, but use stricter limits and lower throughput controls.[12][19][20]

Recommended Basic features:

- Account creation and ACCESS_KEY generation.
- Limited monthly image uploads.
- Core image delivery through CDN.
- URL-based transformations on demand.
- Lower rate limits and lower monthly transformation quotas.[19][20][21]

### Pro plan

The Pro plan should be positioned around predictable speed, higher limits, and a better developer experience. Pre-upload or background eager generation of commonly used variants is a known strategy for reducing first-request latency on premium workloads.[12][13]

Recommended Pro features:

- Higher image and bandwidth limits.
- Higher API rate limits.[22][20]
- Precomputed variants for common sizes.
- Better transformation performance.
- Priority queue or faster processing for uploads.
- Expanded analytics and operational visibility.

### Suggested limit model

| Capability           | Basic                 | Pro                                   |
| -------------------- | --------------------- | ------------------------------------- |
| API keys             | 1-2                   | Multiple                              |
| Monthly uploads      | Low starter quota     | Higher production quota               |
| Transformations      | On-demand, limited    | Higher quota, faster path             |
| Precomputed variants | Minimal core variants | Core + premium eager variants         |
| Rate limits          | Strict                | Higher burst and sustained throughput |
| Support              | Basic docs            | Priority email/chat later             |

## Variant Strategy

A mixed eager-plus-on-demand strategy is the most practical option for this product. Industry guidance around media transformation generally treats pre-generated variants as useful for known, repeated sizes, and on-demand generation as better for flexible long-tail requests.[12][13][14]

### Recommended approach

- Generate core variants at upload time for all users, such as mobile, tablet, and desktop.[13]
- For Pro users, generate extra common variants eagerly, such as thumbnail, 600px width, 1200px width, or avatar crop presets.[12][13]
- For custom `tr=` requests, support on-demand generation and caching for all plans, but prioritize or prewarm the most common patterns for Pro users.[14][23][24]

### Why not precompute everything?

Precomputing every possible transformation wastes storage and processing because many combinations are never requested. On-demand generation remains the better fit for long-tail and highly custom URL transformations.[13][24]

## Authentication and Access Model

The product should separate dashboard authentication from API authentication. B2B SaaS systems commonly use account login for the human user and API keys for server-to-server integration.[9][25]

### Recommended auth layers

1. Dashboard auth: email/password login, verification, and tenant dashboard access.[26][27]
2. Tenant model: each account maps to a tenant or organization that owns plan, keys, usage, and assets.[28][29]
3. API auth: ACCESS_KEY sent in headers such as `X-ACCESS-KEY` for uploads and server integration.[9]

### Important rule

ACCESS_KEY should be used from the client company's backend, not exposed directly in browser code. API key management should include create, rotate, and revoke actions from the dashboard.[9][25]

## Product Flows

### Account and plan flow

1. User signs up on the product dashboard.
2. Email/account gets verified.
3. A tenant is created with default Basic plan.
4. The tenant generates an ACCESS_KEY.
5. The key is used from the tenant's backend.
6. The tenant can later upgrade to Pro for higher limits and eager variants.[9][11][10]

### Upload flow

1. Tenant backend calls the upload API with `X-ACCESS-KEY`.
2. The backend validates tenant, plan, and limits.
3. The file is processed and stored in S3.[4][15]
4. Core variants are generated for all plans.[13]
5. Extra eager variants are generated for Pro users.[12][13]
6. Metadata is stored in the product database.
7. The API returns a stable CDN URL and asset ID.

### Delivery flow

1. Tenant app stores the product CDN URL in its own database.
2. End users request the image through the CDN URL.
3. The delivery layer chooses the best format and variant based on request conditions and cached assets.[14][30][31]
4. Cloudflare currently serves as the edge layer; CloudFront can be introduced later as a configurable alternative.[3][16][17]

## Roadmap

The roadmap should begin with identity, tenancy, and plan controls before file delivery. This sequencing fits multi-tenant SaaS best practices because upload behavior, rate limits, and feature access depend on account and billing state.[32][29][9]

### Phase 1 - Identity and tenancy

Build the product's human authentication and account model first.[26][27]

Deliverables:

- User signup, login, and email verification.
- Tenant/organization model.
- Owner user mapping.
- Session auth for dashboard.
- Basic tenant settings page.

### Phase 2 - Plans and API keys

Define billing tiers and API access before upload logic, because media limits and processing behavior depend on plan configuration.[10][9]

Deliverables:

- Basic and Pro plans in database/config.
- ACCESS_KEY generation and revocation.
- Middleware that resolves tenant from API key.
- Usage counters and limit enforcement.
- Manual admin ability to upgrade/downgrade a tenant.

### Phase 3 - Upload pipeline

Once tenancy and plans are in place, implement uploads and image processing.[4][15]

Deliverables:

- Upload API.
- File validation.
- S3 upload path conventions.
- Core variants for all plans.
- Premium eager variants for Pro.
- MongoDB image metadata storage.

### Phase 4 - Delivery layer

Build the public asset delivery path and transformation URLs after the upload pipeline is stable.[14][6]

Deliverables:

- Stable CDN URL format.
- Device-aware and format-aware delivery rules.[30][31]
- `tr=` URL transformation parser.
- On-demand transformation cache.
- Cloudflare-backed edge delivery.

### Phase 5 - Billing and dashboard polish

After the core media path works, integrate billing and improve account self-service.[11][10]

Deliverables:

- Subscription billing integration.
- Upgrade/downgrade UI.
- Usage dashboard.
- Plan limit warnings.
- Key rotation UI.

### Phase 6 - SDK and developer platform

The SDK should be built after the API contract is stable so the client library does not need frequent breaking changes.[9][32]

Deliverables:

- JavaScript/TypeScript SDK.
- Upload helper.
- URL builder helper.
- Developer documentation.
- Example projects for Node.js and React.

### Phase 7 - Advanced delivery and platform improvements

This phase adds differentiation and operational maturity.

Deliverables:

- Analytics for views, bandwidth, and transformations.
- Popular transformation prewarming for Pro.
- Custom domains for premium tenants.
- CloudFront support when available.[16][17]
- Optional future evaluation of R2 or edge compute for cost optimization.[33][34][1]

## Recommended Build Order

The clearest implementation order is:

1. Authentication.
2. Tenant model.
3. Plans and limits.
4. API key system.
5. Upload pipeline.
6. Delivery and transformations.
7. Billing integration.
8. SDK and documentation.

This order reduces refactors because upload rules, processing policy, and rate limits all depend on tenant state and plan configuration.[9][10][29]

## Notes on CDN Choice

Cloudflare is a practical current CDN layer, especially while CloudFront account verification is unresolved. Public comparisons indicate Cloudflare and CloudFront are generally close in performance, and India-focused traffic can still achieve strong response times with a well-cached CDN setup.[8][35][7]

### Current recommendation

- Keep S3 as storage.
- Use Cloudflare as current CDN.
- Keep `CDN_BASE_URL` configurable.
- Add CloudFront later as an optional or benchmarked delivery backend.[3][2][17]

## MVP Definition

The MVP should not try to match full Cloudinary or ImageKit breadth on day one. A strong first release is a narrow product with reliable auth, plan enforcement, uploads, stable CDN URLs, and a simple transformation syntax.[14][23][13]

### MVP scope

- Signup and tenant creation.
- Basic and Pro plans.
- ACCESS_KEY generation.
- Upload API.
- S3 storage.
- Cloudflare delivery.
- Core variants.
- Pro eager variants.
- URL-based transforms.
- Basic docs and JS SDK.

## Final Direction

The product direction is sound: keep the application stack on EC2, use MongoDB for metadata and tenants, store media in S3, deliver through Cloudflare for now, and add CloudFront later if it becomes available and proves better in testing. The immediate priority should be authentication, tenancy, plans, and API keys, because those pieces govern how uploads, limits, and premium delivery behavior should work.[1][2][9][10]
