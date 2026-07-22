import type { AdvisorRule } from "./types";
import { quickWinsRule, ctrRule, rankingLossRule, internalLinksRule, freshnessRule, thinContentRule } from "./rules";
export const advisorRules:AdvisorRule[]=[quickWinsRule,ctrRule,rankingLossRule,internalLinksRule,freshnessRule,thinContentRule];
