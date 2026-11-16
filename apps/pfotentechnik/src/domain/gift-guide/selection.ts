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
export type GiftAnswers={animal:'cat'|'dog'|'both';goal:keyof typeof giftGoals;budget:keyof typeof giftBudgets;food:'dry'|'wet'|'unknown';weight:number|null;subscription:'yes'|'no'|'any'};
export type GiftCandidate={slug:string;title:string;category:string;price:number|null;maximumWeight?:number|null;advisor:AdvisorProduct};
export function parseGiftAnswers(params:URLSearchParams):GiftAnswers|null{
 const animal=params.get('tier'),goal=params.get('ziel'),budget=params.get('budget');
 if(!['cat','dog','both'].includes(animal??'')||!Object.hasOwn(giftGoals,goal??'')||!Object.hasOwn(giftBudgets,budget??''))return null;
 const raw=params.get('gewicht'),weight=raw&&/^\d{1,3}(?:[.,]\d{1,2})?$/.test(raw)?Number(raw.replace(',','.')):null;
 const food=['dry','wet'].includes(params.get('futter')??'')?params.get('futter'):'unknown';
 const subscription=['yes','no'].includes(params.get('abo')??'')?params.get('abo'):'any';
 return {animal,goal,budget,food,subscription,weight:weight&&weight>0&&weight<=150?weight:null} as GiftAnswers;
}
export function giftSearchParams(a:GiftAnswers){
 const p=new URLSearchParams({tier:a.animal,ziel:a.goal,budget:String(a.budget)});
 if(a.goal==='feeding')p.set('futter',a.food);
 if(a.goal==='outdoors'){if(a.weight)p.set('gewicht',String(a.weight));p.set('abo',a.subscription)}
 return p;
}
export function selectGifts<T extends GiftCandidate>(catalog:T[],answers:GiftAnswers){
 const chosenCategory=giftGoals[answers.goal].category;
 const pool=catalog.filter(p=>!(answers.goal==='outdoors'&&answers.weight&&p.maximumWeight&&answers.weight>p.maximumWeight)).filter(p=>chosenCategory?p.category===chosenCategory:['trinkbrunnen','haustierkameras'].includes(p.category));
 const requirements:AdvisorRequirement[]=[];
 const require=(field:string,desired:string|number|boolean,operator:AdvisorRequirement['operator'],label:string,step:number)=>requirements.push({field,desired,operator,label,step,importance:'hard'});
 require('giftAvailable',true,'equals','Verfügbarkeit vor dem Kauf bestätigen',3);
 for(const animal of answers.animal==='both'?['cat','dog']:[answers.animal])require('animal',animal,'includes',animal==='cat'?'Für Katzen dokumentiert':'Für Hunde dokumentiert',1);
 if(answers.budget!=='open')require('giftPrice',Number(answers.budget),'minimum','Gerätepreis innerhalb deines Budgets',3);
 if(answers.goal==='feeding')require('giftFood',answers.food,'includes',answers.food==='wet'?'Für Nassfutter dokumentiert':answers.food==='dry'?'Für Trockenfutter dokumentiert':'Futterart vorab klären',2);
 if(answers.goal==='outdoors'){
  // The existing advisor compares documented minimum requirements to user values.
  require('minimumWeight',answers.weight??0,'minimum',answers.weight?'Dokumentierte Mindestgewichtsgrenze eingehalten':'Tiergewicht vorab klären',2);
  if(answers.subscription==='no')require('subscription',false,'equals','Kein verpflichtender Dienst gewünscht',2);
 }
 const ranked=recommendAdvisorCandidates(pool.map(p=>({...p.advisor,decisionFacts:{...p.advisor.decisionFacts,...(answers.goal==='feeding'&&answers.food==='unknown'?{giftFood:{status:'unknown' as const}}:{}),...(answers.goal==='outdoors'&&!answers.weight?{minimumWeight:{status:'unknown' as const}}:{})}})),{requirements,preferences:[],answers:{priorities:[]}});
 const bySlug=new Map(pool.map(p=>[p.slug,p]));
 const matched=ranked.filter(m=>m.status==='pass').map(m=>({product:bySlug.get(m.product.slug)!,reasons:m.reasons,cautions:m.cautions}));
 const possible=ranked.filter(m=>m.status==='possible').map(m=>({product:bySlug.get(m.product.slug)!,unknowns:m.unknowns}));
 // Discovery diversity only; the central editorial score and ranking are unchanged.
 const diverse=answers.goal==='open'?matched.filter((m,i)=>matched.findIndex(p=>p.product.category===m.product.category)===i):[];
 const ordered=[...diverse,...matched.filter(m=>!diverse.includes(m))];
 return {matches:ordered,possible,excluded:ranked.filter(m=>m.status==='unsupported').length};
}
