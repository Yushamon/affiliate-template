import {recommendAdvisorCandidates} from '../advisor/recommendProducts.ts';
import type {AdvisorProduct,AdvisorRequirement} from '../advisor/types';

export const giftGoals = {
 feeding:{label:'Fütterung organisieren',short:'Fütterung',category:'futterautomaten',note:'Futterart und Zugang zum Napf entscheiden.'},
 drinking:{label:'Wasserstellen einrichten',short:'Trinken',category:'trinkbrunnen',note:'Reinigung gehört immer dazu.'},
 outdoors:{label:'Draußen den Überblick behalten',short:'Ortung',category:'gps-tracker',note:'Passform, Mobilfunk und Folgekosten vorher klären.'},
 connection:{label:'Zuhause nachsehen',short:'Kamera',category:'haustierkameras',note:'Konto, Internet und Privatsphäre mitdenken.'},
 open:{label:'Ich lasse mich inspirieren',short:'Offen für Ideen',category:null,note:'Alltagstaugliche Ideen aus mehreren Bereichen.'}
} as const;
export const giftBudgets = {'50':'Bis 50 €','150':'Bis 150 €','300':'Bis 300 €',open:'Budget offen'} as const;
export type GiftAnswers={animal:'cat'|'dog'|'both';goal:keyof typeof giftGoals;budget:keyof typeof giftBudgets;food:'dry'|'wet'|'unknown';weight:number|null;catWeight?:number|null;dogWeight?:number|null;catSize?:GiftSize;dogSize?:GiftSize;subscription?:'yes'|'no'|'any'};
export type GiftCandidate={slug:string;title:string;category:string;price:number|null;maximumWeight?:number|null;advisor:AdvisorProduct};
export type GiftSize='small'|'medium'|'large';
// Open endpoints matter: a cat under 3 kg can never meet a 3 kg minimum.
export const giftWeightClasses={
 cat:{small:{label:'Klein',text:'unter 3 kg',min:0,max:3,maxOpen:true},medium:{label:'Normal',text:'3 bis 6 kg',min:3,max:6},large:{label:'Groß',text:'über 6 kg',min:6,max:Infinity,minOpen:true}},
 dog:{small:{label:'Klein',text:'unter 10 kg',min:0,max:10,maxOpen:true},medium:{label:'Mittel',text:'10 bis 25 kg',min:10,max:25},large:{label:'Groß',text:'über 25 kg',min:25,max:Infinity,minOpen:true}}
} as const;
const parseWeight=(raw:string|null)=>raw&&/^\d{1,3}(?:[.,]\d{1,2})?$/.test(raw)&&Number(raw.replace(',','.'))>0&&Number(raw.replace(',','.'))<=150?Number(raw.replace(',','.')):null;
const parseSize=(raw:string|null):GiftSize=>['small','medium','large'].includes(raw??'')?raw as GiftSize:'medium';
export function parseGiftAnswers(params:URLSearchParams):GiftAnswers|null{
 const animal=params.get('tier'),goal=params.get('ziel'),budget=params.get('budget');
 if(!['cat','dog','both'].includes(animal??'')||!Object.hasOwn(giftGoals,goal??'')||!Object.hasOwn(giftBudgets,budget??''))return null;
 return {animal,goal,budget,food:['dry','wet'].includes(params.get('futter')??'')?params.get('futter'):'unknown',weight:parseWeight(params.get('gewicht')),catWeight:parseWeight(params.get('gewicht-katze')),dogWeight:parseWeight(params.get('gewicht-hund')),catSize:parseSize(params.get('groesse-katze')),dogSize:parseSize(params.get('groesse-hund'))} as GiftAnswers;
}
export function giftSearchParams(a:GiftAnswers){
 const p=new URLSearchParams({tier:a.animal,ziel:a.goal,budget:String(a.budget)});
 if(a.goal==='feeding')p.set('futter',a.food);
 if(a.goal==='outdoors'){
  if(a.weight&&a.animal!=='both')p.set('gewicht',String(a.weight));
  for(const [animal,key] of [['cat','katze'],['dog','hund']] as const)if(a.animal===animal||a.animal==='both'){
   p.set('groesse-'+key,a[animal==='cat'?'catSize':'dogSize']??'medium');
   const weight=a[animal==='cat'?'catWeight':'dogWeight'];if(weight)p.set('gewicht-'+key,String(weight));
  }
 }
 return p;
}
export function selectGifts<T extends GiftCandidate>(catalog:T[],answers:GiftAnswers){
 const chosenCategory=giftGoals[answers.goal].category;
 const pool=catalog.filter(p=>chosenCategory?p.category===chosenCategory:['trinkbrunnen','haustierkameras'].includes(p.category));
 const requirements:AdvisorRequirement[]=[];
 const require=(field:string,desired:string|number|boolean,operator:AdvisorRequirement['operator'],label:string)=>requirements.push({field,desired,operator,label,step:2,importance:'hard'});
 for(const animal of answers.animal==='both'?['cat','dog']:[answers.animal])require('animal',animal,'includes',animal==='cat'?'Für Katzen geeignet':'Für Hunde geeignet');
 if(answers.budget!=='open')require('giftPrice',Number(answers.budget),'minimum','Gerätepreis im Budget');
 if(answers.goal==='feeding'&&answers.food!=='unknown')require('giftFood',answers.food,'includes',answers.food==='wet'?'Für Nassfutter geeignet':'Für Trockenfutter geeignet');
 const ranked=recommendAdvisorCandidates(pool.map(p=>p.advisor),{requirements,preferences:[],answers:{priorities:[]}});
 const bySlug=new Map(pool.map(p=>[p.slug,p]));
 const matches:any[]=[];let excluded=ranked.filter(m=>m.status==='unsupported').length;
 for(const m of ranked){
  if(m.status==='unsupported')continue;
  if(m.product.decisionFacts?.giftAvailable?.status==='known'&&m.product.decisionFacts.giftAvailable.value===false){excluded++;continue}
  const product=bySlug.get(m.product.slug)!,facts=m.product.decisionFacts??{},notes:string[]=[],reasons=[...m.reasons];let near=false,blocked=false;
  // Missing facts never create positive reasons. They only qualify a recommendation.
  if(facts.animal?.status!=='known'){notes.push('Eignung für die gewählte Tierart vor dem Kauf klären.');near=true}
  if(answers.goal==='feeding'&&(answers.food==='unknown'||facts.giftFood?.status!=='known')){notes.push(answers.food==='unknown'?'Vor dem Kauf die passende Futterart prüfen.':'Eignung für die gewählte Futterart vor dem Kauf klären.');near=true}
  if(answers.goal==='outdoors')for(const animal of answers.animal==='both'?['cat','dog'] as const:[answers.animal] as ('cat'|'dog')[]){
   const exact=answers[animal==='cat'?'catWeight':'dogWeight']??(answers.animal!=='both'?answers.weight:null);
   const range:any=exact?{min:exact,max:exact}:giftWeightClasses[animal][answers[animal==='cat'?'catSize':'dogSize']??'medium'];
   const minimum=facts.minimumWeight?.status==='known'?Number(facts.minimumWeight.value):null,maximum=product.maximumWeight??null;
   const name=animal==='cat'?'Katze':'Hund';
   if((minimum!==null&&(range.max<minimum||(range.max===minimum&&range.maxOpen)))||(maximum!==null&&(range.min>maximum||(range.min===maximum&&range.minOpen)))){blocked=true;break}
   if(minimum===null){notes.push(`${name}: Mindestgewicht vor dem Kauf prüfen.`);near=true}
   else if(range.min<minimum){notes.push(`${name}: erst ab ${minimum} kg geeignet – genaues Gewicht prüfen.`);near=true}
   else reasons.push(`${name}: Mindestgewicht von ${minimum} kg eingehalten`);
   if(maximum!==null&&range.max>maximum){notes.push(`${name}: nur bis ${maximum} kg geeignet – genaues Gewicht prüfen.`);near=true}
  }
  if(blocked){excluded++;continue}
  const priceUnknown=product.price==null||facts.giftPrice?.status!=='known';
  if(priceUnknown&&answers.budget!=='open')notes.push('Der aktuelle Preis kann über deinem Budget liegen.');
  if(facts.giftAvailable?.status!=='known')notes.push('Lieferbarkeit vor dem Kauf beim Händler prüfen.');
  matches.push({product,reasons,cautions:notes,near,priceUnknown});
 }
 // One shared ranking: budget certainty first, technical fit next, then existing
 // editorial recommendation and score. Stock uncertainty is never a separate tier.
 matches.sort((a,b)=>Number(a.priceUnknown)-Number(b.priceUnknown)||Number(a.near)-Number(b.near)||Number(b.product.advisor.recommendationStatus==='recommended')-Number(a.product.advisor.recommendationStatus==='recommended')||(b.product.advisor.score??0)-(a.product.advisor.score??0)||a.product.slug.localeCompare(b.product.slug));
 const diverse=answers.goal==='open'?matches.filter((m,i)=>matches.findIndex(p=>p.product.category===m.product.category)===i):[];
 const ordered=[...diverse,...matches.filter(m=>!diverse.includes(m))];
 return {matches:ordered,possible:[],excluded,closest:ordered.length>0&&ordered.every(m=>m.near||m.priceUnknown)};
}
