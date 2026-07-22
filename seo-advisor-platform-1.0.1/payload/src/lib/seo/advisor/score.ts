import type { AdvisorEffort, AdvisorPriority } from "./types";
const effortWeight:Record<AdvisorEffort,number>={low:1,medium:.82,high:.64};
export function calculateScore(impact:number,confidence:number,effort:AdvisorEffort):number { const i=Math.max(0,Math.min(100,impact)); const c=Math.max(0,Math.min(100,confidence)); return Math.round(i*.62+c*.28+effortWeight[effort]*10); }
export function priorityForScore(score:number):AdvisorPriority { if(score>=85)return "A"; if(score>=70)return "B"; if(score>=50)return "C"; return "D"; }
