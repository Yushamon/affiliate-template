import {giftPricePresentation} from './presentation.ts';
import {mapProductToAdvisor} from '../advisor/mapProduct.ts';
import {assessProductReview} from '../productReview.ts';
import {calculateProductScore} from '../productScore.ts';
import {resolveCommerceOffers,selectCommercePrice} from '../commerceOffers.mjs';
import {deriveProductOperations} from '../../lib/product-operations/policy.mjs';
import {resolveProductMedia} from '../mediaResolver.mjs';
import {buildDecisionFacts} from '../productExperience/consequences.ts';
import {protectedDecisionSlugs} from '../productExperience/decisionQuality.mjs';
import {buildSubscriptionCostModel} from '../subscriptionCosts.ts';
import {resolveComparisonValue} from '../comparison/comparisonDataPlatform.ts';
import {isPublishedProduct} from '../productPublication.mjs';

export const giftComparisonRows=[
 {key:'tier',label:'Dokumentierte Tiere'},
 {key:'abo',label:'Digitale Folgekosten'},
 {key:'stromversorgung',label:'Stromversorgung'},
 {key:'kapazitaet',label:'Behälter / Kapazität'},
 {key:'reinigung',label:'Reinigung'},
 {key:'kamera',label:'Kamera'},
 {key:'gewicht',label:'Gerätegewicht'}
];
export function documentedFoodType(value:unknown){
 const text=String(value??'').toLowerCase().trim();
 if(/nicht dokumentiert|unbekannt|^kein|^ohne|^nicht|^(?:trockenfutter|nassfutter) (?:nicht|ungeeignet)/.test(text))return undefined;
 if(/^(?:trocken-? und nassfutter|nass-? und trockenfutter)/.test(text))return ['dry','wet'];
 if(/^trockenfutter(?:[ (;/,]|$)/.test(text))return ['dry'];
 if(/^nassfutter(?:[ (;/,]|$)/.test(text))return ['wet'];
 return undefined;
}
const known=(value:any)=>value==null?{status:'unknown' as const}:{status:'known' as const,value};
export function buildGiftCatalog(entries:any[],{now=Date.now()}={}){
 const allowed=new Set(['futterautomaten','trinkbrunnen','gps-tracker','haustierkameras']);
 const records:any[]=[],omitted:any[]=[];
 for(const entry of entries){
  const d=entry.data,slug=d.slug,category=d.category?.key;
  if(!allowed.has(category))continue;
  const operations=deriveProductOperations(d,{now});
  // Keep the running experiment's product text and every incoming link frozen.
  const reason=!isPublishedProduct(d)?'publication-blocked':protectedDecisionSlugs.includes(slug)?'experiment-35.5':
   ['discontinued','legacy'].includes(d.productStatus)||operations.archived?'archived':['out-of-stock','temporarily-unavailable','discontinued'].includes(operations.availability)?'unavailable':null;
  if(reason){omitted.push({slug,reason});continue}
  const offers=resolveCommerceOffers(d,{}, {now}).filter((o:any)=>o.canLink&&!['out-of-stock','temporarily-unavailable','discontinued'].includes(o.availability)&&o.currency==='EUR');
  const offer=selectCommercePrice(d,{now,offers})?.offer??offers.find((o:any)=>o.fresh&&o.current>0&&o.availability==='available')??offers.find((o:any)=>o.fresh&&o.current>0)??offers[0];
  if(!offer){omitted.push({slug,reason:'no-verified-eur-destination'});continue}
  const selected=selectCommercePrice(d,{now,offers});
  const presentation=giftPricePresentation(selected,{now});
  const score=calculateProductScore(d);
  // Existing comparison fallback also requires >=60 editorial points. This is
  // an eligibility boundary, never a new gift score or a changed product rating.
  if(score.score==null||score.score<60){omitted.push({slug,reason:'below-editorial-recommendation-boundary'});continue}
  const review=assessProductReview(d);
  if(!review.eligible){omitted.push({slug,reason:'review-basis-incomplete'});continue}
  const advisor=mapProductToAdvisor({...entry,id:slug});
  const animals=advisor.common.animals;
  if(animals.status!=='known'||!animals.value.length){omitted.push({slug,reason:'animal-unknown'});continue}
  advisor.score=score.score??undefined;
  const food=advisor.common.foodTypes.status==='known'?advisor.common.foodTypes:known(documentedFoodType(resolveComparisonValue({product:entry,item:{slug},criterion:{key:'futterart',label:'Futterart',fallback:''}})));
  advisor.decisionFacts={animal:animals,giftPrice:known(presentation.price),giftAvailable:known(operations.availability==='available'?true:null),giftFood:food,
   minimumWeight:known(d.gps?.minimumPetWeightKg),subscription:known(typeof d.subscription?.requiredForCoreFunction==='boolean'?d.subscription.requiredForCoreFunction:d.gps?.subscriptionRequired)};
  const subscription=buildSubscriptionCostModel({subscription:d.subscription,devicePrice:presentation.price,now:new Date(now)});
  advisor.decisionCautions=[];
  const technical=buildDecisionFacts(d,d.specs??[]).slice(0,6);
  const comparison=Object.fromEntries(giftComparisonRows.map(row=>[row.key,resolveComparisonValue({product:entry,item:{slug},criterion:{...row,fallback:'Nicht dokumentiert'}})]));
  records.push({slug,title:d.title,category,categoryLabel:d.category.label,route:`/produkt/${slug}/`,...presentation,availabilityConfirmed:operations.availability==='available',
   checkedAt:offer.price?.checkedAt??d.priceUpdated??null,availabilityUpdated:offer.availabilityUpdated??d.availabilityUpdated??null,merchant:offer.label,offerHref:offer.affiliateUrl,offerRel:offer.rel,
   maximumWeight:Number(d.gps?.maximumPetWeightKg)||Number((d.specs??[]).find((s:any)=>/geeignet|herstellerempfehlung/i.test(s.label)&&/\d+(?:[.,]\d+)?\s*(?:bis|–|-)\s*(\d+(?:[.,]\d+)?)\s*kg/i.test(s.value))?.value.match(/\d+(?:[.,]\d+)?\s*(?:bis|–|-)\s*(\d+(?:[.,]\d+)?)\s*kg/i)?.[1]?.replace(',','.'))||null,
   score:score.score,scoreSource:score.source,reviewLabel:'Redaktionelle Bewertung',reviewBasis:review.handsOn?'Eigener Praxistest.':'Bewertung anhand veröffentlichter Quellen; kein eigener Praxistest.',animals:animals.value,advisor,technical,comparison,
   giftServiceLabel:giftServiceCopy(subscription,d.gps?.subscriptionRequired),subscriptionLabel:subscription?.runningCostLabel??'Digitale Folgekosten nicht abschließend dokumentiert',tco12:subscription?.totals?.months12??null,
   recommendation:d.recommendation,strengths:(d.strengths??[]).slice(0,2),weaknesses:(d.weaknesses??[]).slice(0,2),
   media:resolveProductMedia(d.images),testStatus:d.testStatus});
 }
 return {products:records,omitted};
}

// Reuse the central tariff model, including included months and price freshness.
// No inferred annual service cost and no optional-service total in the gift UI.
export function giftServiceCopy(model:ReturnType<typeof buildSubscriptionCostModel>,gpsRequired?:boolean){
 if(!model)return gpsRequired===true?'Für die Ortungsfunktion ist ein kostenpflichtiges Abo erforderlich. Aktuellen Tarif prüfen.':'Mögliche digitale Zusatzkosten vor dem Kauf prüfen.';
 const price=model.featuredPlan?.current?model.featuredPlan.paymentLabel:null;
 if(model.status==='no-subscription')return 'Keine verpflichtenden digitalen Servicekosten.';
 if(model.optional&&model.requiredForCoreFunction!==true)return `Optionaler Digitaldienst: ${price??'aktuellen Tarif prüfen'}.`;
 if(model.status==='service-included')return `Digitaldienst: ${model.runningCostLabel}. Kosten nach dem enthaltenen Zeitraum prüfen.`;
 if(model.requiresPayment||model.requiredForCoreFunction===true)return `${gpsRequired===true?'Für die Ortungsfunktion ist ein kostenpflichtiger Dienst erforderlich':'Kostenpflichtiger Dienst erforderlich'}${price?`: ${price}`:'. Aktuellen Tarif prüfen'}.`;
 return 'Mögliche digitale Zusatzkosten vor dem Kauf prüfen.';
}
