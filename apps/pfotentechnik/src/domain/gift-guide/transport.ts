// Presentation transport only. The shared advisor consumes these exact fields;
// marketing copy/common/spec objects are already represented in the card data.
export function giftTransport(products:any[]){
 return products.map(p=>({...p,advisor:{slug:p.advisor.slug,category:p.advisor.category,score:p.advisor.score,recommendationStatus:p.advisor.recommendationStatus,decisionFacts:p.advisor.decisionFacts,decisionCautions:p.advisor.decisionCautions}}));
}

// Prefer an existing wording that distinguishes the visible alternatives.
// This selects display copy only; it never changes eligibility, order or score.
export function distinctiveGiftStrength(product:any,peers:any[]=[]){
 return product.strengths.find((value:string)=>!peers.some(other=>other.slug!==product.slug&&other.strengths.includes(value)))??product.strengths[0];
}
