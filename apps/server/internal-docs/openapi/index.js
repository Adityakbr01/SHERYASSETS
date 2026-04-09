// Import modules to register them
import './modules/auth/auth.openapi.js';
import './modules/billing/billing.openapi.js';
import './modules/tenant/tenant.openapi.js';
import './modules/membership/membership.openapi.js';
import './modules/apikey/apikey.openapi.js';
import './modules/plan/plan.openapi.js';
import './modules/assets/asset.openapi.js';
import './modules/usage/usage.openapi.js';
export { generateOpenApi } from './generator';
