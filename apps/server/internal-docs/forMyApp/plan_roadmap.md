# Image CDN SaaS - Plans, Models, and Roadmap

This document defines the initial product plan, pricing tiers, suggested data models, core architecture direction, and phased roadmap for an image optimization and CDN SaaS aimed at developers and startups. The architecture direction is a hybrid setup: frontend and backend on EC2, MongoDB for database, S3 for storage, and Cloudflare as the current CDN layer, with CloudFront planned as a future option when account access is enabled.

## Product Overview

The product is designed to help developers upload images once, store them in object storage, and serve them through a CDN with optimized formats and variants. A common integration model for image CDNs is to keep the storage origin separate from the delivery layer, while exposing a single developer-friendly image URL and optional transformation parameters.

### Core goals

- Fast image delivery for India-first and Asia-heavy traffic.
- Simple developer integration with ACCESS_KEY authentication and SDK support.
- Tiered plans where premium users receive stronger performance and higher limits.
- URL-based transformations with precomputed variants for premium plans and on-demand generation for lower tiers.

## Current Architecture Direction

The planned stack is practical for an early-stage SaaS and aligns with common hybrid architectures that combine AWS infrastructure with Cloudflare edge delivery.

### Infrastructure

| Layer | Planned choice | Notes |
|---|---|---|
| Frontend | EC2 | Dashboard, docs, product UI served from the application layer. |
| Backend | EC2 | Upload API, auth, plan enforcement, image delivery API. |
| Database | MongoDB | Stores tenants, API keys, plans, image metadata, analytics. |
| Storage | AWS S3 | Stores original images and generated variants. |
| CDN (now) | Cloudflare | Used as the current edge delivery layer in front of storage/origin.|
| CDN (future) | CloudFront | Planned feature when account verification is resolved. |

## Pricing Plans

Tiered billing is a standard SaaS pricing model, and many billing systems support fixed monthly tiers first, with custom enterprise or usage-based pricing added as products mature.

### Pricing table

| Plan | Price | Best for | Delivery strategy | Transform strategy |
|---|---|---|---|---|
| Basic | ₹0 | Testing, learning, side projects | Standard CDN delivery | On-demand transformations with cache. |
| Pro | ₹1200/month | Production apps, startups, e-commerce | Faster delivery with more prebuilt assets | Core and popular variants precomputed eagerly. |
| Pay as you go | Usage based | Teams with variable traffic | Flexible scaling by usage | On-demand plus metered transformation usage. |
| Enterprise | Custom pricing | Large companies, agencies, high-volume platforms | Premium delivery and support | Custom eager rules, custom limits, advanced support.
|
### Basic

The Basic plan should be the free onboarding tier and focus on easy adoption. It should allow image uploads, core CDN delivery, and on-demand transformations with caching, but use stricter limits and lower throughput controls.

Suggested features:

- Account creation and ACCESS_KEY generation.
- Limited monthly image uploads.
- Core image delivery through CDN.
- URL-based transformations on demand.
- Lower rate limits and lower monthly transformation quotas.

### Pro

The Pro plan should be positioned around predictable speed, higher limits, and a better developer experience. Pre-upload or background eager generation of commonly used variants is a known strategy for reducing first-request latency on premium workloads.

Suggested features:

- Higher image and bandwidth limits.
- Higher API rate limits.[cite:38][cite:40]
- Precomputed variants for common sizes.
- Better transformation performance.
- Priority queue or faster processing for uploads.
- Expanded analytics and operational visibility.

### Pay as you go

A pay-as-you-go tier works well when customer traffic fluctuates and strict fixed tiers become limiting. Usage-based pricing is a common model for infrastructure and API businesses because it aligns charges with actual consumption.

Suggested features:

- Smaller fixed base fee or no fixed fee.
- Billing by storage, bandwidth, transformations, or requests.
- Flexible scaling for seasonal traffic.
- Optional caps or alerts to avoid surprise bills.

### Enterprise

Enterprise pricing should be custom because large customers often need higher limits, contractual support, custom billing, and security or compliance features beyond self-serve plans.

Suggested features:

- Custom SLAs and support.
- Higher or custom rate limits.
- Dedicated onboarding.
- Custom domains and branding.
- Custom transformation presets.
- Annual billing and invoicing.

### Suggested limit model

| Capability | Basic | Pro | Pay as you go | Enterprise |
|---|---|---|---|---|
| API keys | 1-2 | Multiple | Multiple | Multiple with admin controls |
| Monthly uploads | Low starter quota | Higher production quota | Metered by usage | Custom |
| Transformations | On-demand, limited | Higher quota, faster path | Metered by usage | Custom policies |
| Precomputed variants | Minimal core variants | Core + premium eager variants | Optional paid add-on | Custom eager rules |
| Rate limits | Strict | Higher burst and sustained throughput | Metered tiers | Contractual/custom |
| Support | Docs only | Faster support later | Standard support | Priority support |

## Suggested Data Models

The product should separate human users, tenants, API access, billing state, assets, and transformed variants. Multi-tenant SaaS systems commonly model organization ownership separately from usage resources and credentials.

### 1. User model

```ts
export type UserRole = 'owner' | 'admin' | 'member';

export interface User {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  isEmailVerified: boolean;
  role: UserRole;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Purpose:

- Human login for dashboard access.
- Belongs to one tenant initially.
- Can later support teams and role-based access.

### 2. Tenant model

```ts
export type PlanType = 'basic' | 'pro' | 'payg' | 'enterprise';
export type TenantStatus = 'active' | 'suspended' | 'trialing' | 'cancelled';

export interface Tenant {
  _id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  plan: PlanType;
  status: TenantStatus;
  billingEmail: string;
  customDomain?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Purpose:

- Core organization/account entity.
- Owns plan, usage, images, and API keys.

### 3. API key model

```ts
export type ApiKeyStatus = 'active' | 'revoked';

export interface ApiKey {
  _id: string;
  tenantId: string;
  name: string;
  keyHash: string;
  prefix: string;
  status: ApiKeyStatus;
  lastUsedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}
```

Purpose:

- Used by client backends to authenticate against upload and management APIs.
- Only hashed values should be stored server-side for security best practice.[cite:41][cite:56]

### 4. Plan config model

```ts
export interface PlanConfig {
  _id: string;
  code: PlanType;
  name: string;
  priceMonthly: number | null;
  isCustom: boolean;
  maxApiKeys: number;
  maxImagesPerMonth: number | null;
  maxBandwidthGbPerMonth: number | null;
  maxTransformationsPerMonth: number | null;
  eagerVariantPresets: string[];
  supportsCustomDomain: boolean;
  supportsPriorityProcessing: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

Purpose:

- Central plan policy object.
- Keeps feature limits out of hard-coded business logic.

### 5. Subscription / billing model

```ts
export type BillingProvider = 'stripe' | 'razorpay' | 'manual';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing';

export interface Subscription {
  _id: string;
  tenantId: string;
  plan: PlanType;
  provider: BillingProvider;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

Purpose:

- Stores current billing state and plan linkage.

### 6. Image asset model

```ts
export type AssetStatus = 'processing' | 'ready' | 'failed' | 'deleted';

export interface ImageAsset {
  _id: string;
  imageId: string;
  tenantId: string;
  folderPath: string;
  originalName: string;
  originalFormat: string;
  originalMimeType: string;
  originalSize: number;
  width: number;
  height: number;
  hasAlpha: boolean;
  colorSpace?: string;
  status: AssetStatus;
  urls: {
    original: string;
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

Purpose:

- Main record for every uploaded asset.
- Holds original file metadata and core URLs.

### 7. Image variant model

```ts
export type VariantKind = 'core' | 'eager' | 'ondemand';

export interface ImageVariant {
  _id: string;
  tenantId: string;
  imageId: string;
  cacheKey: string;
  kind: VariantKind;
  format: 'jpeg' | 'png' | 'webp' | 'avif';
  width?: number;
  height?: number;
  quality?: number;
  fit?: 'cover' | 'contain' | 'inside' | 'fill';
  transformationString?: string;
  sizeBytes: number;
  url: string;
  createdAt: Date;
}
```

Purpose:

- Stores transformed outputs and cacheable named variants.
- Supports both precomputed and on-demand URLs.

### 8. Usage metrics model

```ts
export interface UsageMetrics {
  _id: string;
  tenantId: string;
  month: string; // example: 2026-04
  uploadCount: number;
  transformationCount: number;
  bandwidthBytes: number;
  originFetchCount: number;
  cacheHitCount: number;
  updatedAt: Date;
}
```

Purpose:

- Used for limits, dashboards, and billing calculations.

### 9. Access log / analytics model

```ts
export interface AssetAccessLog {
  _id: string;
  tenantId: string;
  imageId: string;
  variantId?: string;
  country?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  formatServed?: 'jpeg' | 'png' | 'webp' | 'avif';
  cacheStatus?: 'hit' | 'miss';
  responseTimeMs?: number;
  createdAt: Date;
}
```

Purpose:

- Enables analytics, cache reporting, and future plan insights.

### 10. Transformation preset model

```ts
export interface TransformationPreset {
  _id: string;
  tenantId?: string;
  name: string;
  code: string;
  operations: {
    width?: number;
    height?: number;
    quality?: number;
    fit?: 'cover' | 'contain' | 'inside' | 'fill';
    format?: 'jpeg' | 'png' | 'webp' | 'avif' | 'auto';
  };
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

Purpose:

- Supports reusable named transformations, especially useful for Pro and Enterprise customers.

## Variant Strategy

A mixed eager-plus-on-demand strategy is the most practical option for this product. Industry guidance around media transformation generally treats pre-generated variants as useful for known, repeated sizes, and on-demand generation as better for flexible long-tail requests.[cite:3]

### Recommended approach

- Generate core variants at upload time for all users, such as mobile, tablet, and desktop.
- For Pro users, generate extra common variants eagerly, such as thumbnail, 600px width, 1200px width, or avatar crop presets.
- For Pay as you go users, meter long-tail transformations while allowing elastic usage.
- For Enterprise users, allow custom presets and tenant-specific eager rules.
- For custom `tr=` requests, support on-demand generation and caching for all plans, but prioritize or prewarm the most common patterns for Pro users.[cite:3][cite:13][cite:14]

## Authentication and Access Model

The product should separate dashboard authentication from API authentication. B2B SaaS systems commonly use account login for the human user and API keys for server-to-server integration.[cite:41][cite:56]

### Recommended auth layers

1. Dashboard auth: email/password login, verification, and tenant dashboard access.[cite:49][cite:55]
2. Tenant model: each account maps to a tenant or organization that owns plan, keys, usage, and assets.[cite:43][cite:53]
3. API auth: ACCESS_KEY sent in headers such as `X-ACCESS-KEY` for uploads and server integration.

## Product Flows

### Account and plan flow

1. User signs up on the product dashboard.
2. Email/account gets verified.
3. A tenant is created with default Basic plan.
4. The tenant generates an ACCESS_KEY.
5. The key is used from the tenant's backend.
6. The tenant can later upgrade to Pro, Pay as you go, or Enterprise based on usage and business need.

### Upload flow

1. Tenant backend calls the upload API with `X-ACCESS-KEY`.
2. The backend validates tenant, plan, and limits.
3. The file is processed and stored in S3.[cite:34][cite:37]
4. Core variants are generated for all plans.
5. Extra eager variants are generated for Pro or custom-plan users.
6. Metadata is stored in the product database.
7. The API returns a stable CDN URL and asset ID.

### Delivery flow

1. Tenant app stores the product CDN URL in its own database.
2. End users request the image through the CDN URL.
3. The delivery layer chooses the best format and variant based on request conditions and cached assets.[cite:3]
4. Cloudflare currently serves as the edge layer; CloudFront can be introduced later as a configurable alternative.

## Roadmap

The roadmap should begin with identity, tenancy, and plan controls before file delivery. This sequencing fits multi-tenant SaaS best practices because upload behavior, rate limits, and feature access depend on account and billing state.

### Phase 1 - Identity and tenancy

- User signup, login, and email verification (Resend Api/sdk).
- Tenant/organization model.
- Owner user mapping.
- JWT auth for dashboard.
- Basic tenant settings page.

### Phase 2 - Plans, pricing, and API keys

- Basic, Pro, Pay as you go, and Enterprise plan config.
- ACCESS_KEY generation and revocation.
- Middleware that resolves tenant from API key.
- Usage counters and limit enforcement.
- Manual admin ability to upgrade/downgrade a tenant.

### Phase 3 - Upload pipeline

- Upload API.[cite:34][cite:37]
- File validation.
- S3 upload path conventions.
- Core variants for all plans.
- Premium eager variants for Pro and custom presets for Enterprise.
- MongoDB image metadata storage.

### Phase 4 - Delivery layer

- Stable CDN URL format.[cite:3][cite:5]
- Device-aware and format-aware delivery rules.
- `tr=` URL transformation parser.
- On-demand transformation cache.
- Cloudflare-backed edge delivery.

### Phase 5 - Billing and dashboard polish

- Subscription billing integration.
- Usage-based billing support for Pay as you go.
- Upgrade/downgrade UI.
- Usage dashboard.
- Plan limit warnings.
- Key rotation UI.

### Phase 6 - SDK and developer platform

- JavaScript/TypeScript SDK.
- Upload helper.
- URL builder helper.
- Developer documentation.
- Example projects for Node.js and React.

### Phase 7 - Advanced delivery and platform improvements

- Analytics for views, bandwidth, and transformations.
- Popular transformation prewarming for Pro.
- Custom domains for premium tenants.
- CloudFront support when available.[cite:61][cite:64]
- Optional future evaluation of R2 or edge compute for cost optimization.

## Recommended Build Order

1. Authentication.
2. Tenant model.
3. Plans and limits.
4. API key system.
5. Upload pipeline.
6. Delivery and transformations.
7. Billing integration.
8. SDK and documentation.

This order reduces refactors because upload rules, processing policy, and rate limits all depend on tenant state and plan configuration.

## Final Direction

The product direction is sound: keep the application stack on EC2, use MongoDB for metadata and tenants, store media in S3, deliver through Cloudflare for now, and add CloudFront later if it becomes available and proves better in testing. The immediate priority should be authentication, tenancy, plans, API keys, and plan-aware usage models, because those pieces govern how uploads, limits, billing, and premium delivery behavior should work.
