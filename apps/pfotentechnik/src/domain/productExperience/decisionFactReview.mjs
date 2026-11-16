import { createHash } from 'node:crypto';
import registry from '../../config/decision-fact-approvals.json' with { type: 'json' };
import { decisionFactApprovalRegistrySchema, productDecisionFactSchema } from '../../content/schema/decision-facts.mjs';

export const decisionFactApprovals = decisionFactApprovalRegistrySchema.parse(registry).approvals;

export const decisionFactFingerprint = fact => createHash('sha256')
  .update(JSON.stringify([fact?.label, fact?.value, fact?.consequence]))
  .digest('hex');

// No product-level or global opt-in: approval covers one exact text on one product.
export const isDecisionFactApproved = (slug, fact, approvals = decisionFactApprovals) =>
  productDecisionFactSchema.safeParse(fact).success && approvals.some(approval =>
    approval.slug === slug && approval.fingerprint === decisionFactFingerprint(fact));
