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
 text('data-fit-reason','');
 get('data-fit-reason').hidden=!get('data-fit-reason').textContent;
 const budgetNotes=cautions.filter(c=>c.includes('Budget')),otherCautions=cautions.filter(c=>!c.includes('Budget'));
 get('data-gift-verification').hidden=otherCautions.length===0;text('data-gift-verification',otherCautions[0]??'');
 text('data-card-budget-note',budgetNotes[0]??'');get('data-card-budget-note').hidden=!budgetNotes.length;
 list('data-card-strengths',lead?p.strengths:[distinctive].filter(Boolean));list('data-card-further-strengths',lead?[]:p.strengths.filter((s:string)=>s!==distinctive));list('data-card-weaknesses',p.weaknesses.slice(0,1));list('data-card-further-cautions',[...p.weaknesses.slice(1),...otherCautions.slice(1)]);
 text('data-card-service',p.giftServiceLabel??p.subscriptionLabel);text('data-card-detail-service',p.giftServiceLabel??p.subscriptionLabel);const unknownService=p.giftServiceLabel?.startsWith('Mögliche');get('data-card-service').hidden=!!unknownService;get('data-card-detail-service').hidden=!unknownService;text('data-card-price',p.priceLabel);
 text('data-card-price-date',p.priceDetail);get('data-card-price-date').hidden=!p.priceDetail;
 const image=get('data-card-image') as HTMLImageElement;get('data-card-media').hidden=!p.image;
 if(p.image){image.src=p.image.src;image.srcset=p.image.srcset??'';image.alt=p.image.alt;image.width=p.image.width;image.height=p.image.height;image.sizes=lead?'(max-width: 760px) 90vw, 420px':'(max-width: 760px) 110px, 160px';image.loading=lead?'eager':'lazy'}else{image.removeAttribute('src');image.removeAttribute('srcset');image.alt=''}
 text('data-card-recommendation',p.recommendation);text('data-card-basis',`Bewertungen gelten innerhalb des jeweiligen Produkttyps. ${p.handsOn?'Eigener Praxistest.':'Bewertung anhand veröffentlichter Quellen; kein eigener Praxistest.'}`);text('data-card-review','Redaktionelle Bewertung');text('data-card-score',p.score);
 get('data-card-technical').replaceChildren(...p.technical.map((f:any)=>{const div=document.createElement('div'),dt=document.createElement('dt'),strong=document.createElement('strong'),dd=document.createElement('dd');dt.textContent=f.label+': ';strong.textContent=f.value;dt.append(strong);dd.textContent=f.consequence;div.append(dt,dd);return div}));
 const merchant=get('data-card-merchant')as HTMLAnchorElement;merchant.href=p.offerHref;merchant.rel=p.offerRel;
 get('data-compare-toggle').dataset.compareToggle=p.slug;
 return card;
}
