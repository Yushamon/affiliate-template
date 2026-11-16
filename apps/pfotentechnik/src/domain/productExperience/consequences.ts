import {decisionFactApprovals} from './decisionFactReview.mjs';
import {buildLegacyDecisionFacts, type DecisionFact} from './legacyConsequences.ts';
import {inspectDecisionFacts,protectedDecisionSlugs} from './decisionQuality.mjs';

// Experiment 35.5 freezes its product text and link entrances. The legacy
// renderer is isolated to these exact slugs, with no editorial approval bypass.
export const buildDecisionFacts = (
 data: any, specs: Array<{label:string;value:string}>, approvals=decisionFactApprovals
): DecisionFact[] => protectedDecisionSlugs.includes(data?.slug)
 ? buildLegacyDecisionFacts(data,specs,approvals)
 : inspectDecisionFacts(data,specs,approvals).facts;
export type {DecisionFact};
