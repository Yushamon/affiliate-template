import {distinctiveGiftStrength} from '../../domain/gift-guide/transport.ts';
// A single SSR-authored template serves every model. Values only enter as text
// or existing resolved URLs; no product strings are interpreted as HTML.
export function populateGiftCard(card:HTMLElement,p:any,{lead=false,reasons=[],cautions=[],position=1,peers=[]}:{lead?:boolean;cautions?:string[];reasons?:string[];position?:number;peers?:any[]}={}){
 const get=(key:string)=>card.querySelector<HTMLElement>(`[${key}]`)!;
 const text=(key:string,value:any)=>get(key).textContent=String(value??'');
 const list=(key:string,values:string[])=>{get(key).replaceChildren(...values.map(value=>{const li=document.createElement('li');li.textContent=value;return li}))};
 card.dataset.giftCard=p.slug;card.classList.toggle('gift-card--lead',lead);
 text('data-card-position',lead?'Erste Empfehlung':`Alternative ${position}`);text('data-card-category',p.categoryLabel);
 text('data-card-title',p.title);(get('data-card-title')as HTMLAnchorElement).href=p.route;(get('data-card-product')as HTMLAnchorElement).href=p.route;get('data-card-product').firstChild!.textContent=lead?'Zum Produkt ':'Zum Modell ';
 const distinctive=distinctiveGiftStrength(p,peers);
 text('data-fit-reason',lead?reasons.filter(r=>!r.includes('Gerätepreis')&&!r.startsWith('Für ')).slice(0,1).join(''):'');
 get('data-fit-reason').hidden=!get('data-fit-reason').textContent;
 get('data-gift-verification').hidden=cautions.length===0;text('data-gift-verification',cautions[0]??'');
 list('data-card-strengths',lead?p.strengths:[distinctive].filter(Boolean));list('data-card-further-strengths',lead?[]:p.strengths.filter((s:string)=>s!==distinctive));list('data-card-weaknesses',p.weaknesses.slice(0,1));list('data-card-further-cautions',[...p.weaknesses.slice(1),...cautions.slice(1)]);
 text('data-card-service',p.giftServiceLabel??p.subscriptionLabel);text('data-card-detail-service',p.giftServiceLabel??p.subscriptionLabel);const unknownService=p.giftServiceLabel?.startsWith('Mögliche');get('data-card-service').hidden=!!unknownService;get('data-card-detail-service').hidden=!unknownService;text('data-card-price',p.priceLabel);
 text('data-card-price-date',p.price!==null&&p.checkedAt?`Preisstand ${new Date(p.checkedAt).toLocaleDateString('de-DE')} · Versand ggf. zusätzlich`:'Aktuellen Gerätepreis prüfen');
 text('data-card-recommendation',p.recommendation);text('data-card-basis',`Bewertungen gelten innerhalb des jeweiligen Produkttyps. ${p.reviewBasis}`);text('data-card-review',p.reviewLabel);text('data-card-score',p.score);
 get('data-card-technical').replaceChildren(...p.technical.map((f:any)=>{const div=document.createElement('div'),dt=document.createElement('dt'),strong=document.createElement('strong'),dd=document.createElement('dd');dt.textContent=f.label+': ';strong.textContent=f.value;dt.append(strong);dd.textContent=f.consequence;div.append(dt,dd);return div}));
 const merchant=get('data-card-merchant')as HTMLAnchorElement;merchant.href=p.offerHref;merchant.rel=p.offerRel;
 get('data-compare-toggle').dataset.compareToggle=p.slug;
 return card;
}
