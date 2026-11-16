import {populateGiftCard} from './card.ts';
import {giftGoals,giftBudgets,parseGiftAnswers,giftSearchParams,selectGifts,type GiftAnswers} from '../../domain/gift-guide/selection.ts';

export function initializeGiftGuide(root:HTMLElement){
 const form=root.querySelector<HTMLFormElement>('[data-gift-form]');
 const payload=root.querySelector('[data-gift-catalog]');
 if(!form||!payload)return;
 const products=JSON.parse(payload.textContent??'[]'),bySlug=new Map<string,any>(products.map((p:any)=>[p.slug,p]));
 const template=root.querySelector<HTMLTemplateElement>('[data-gift-template]')!;
 const $=<T extends HTMLElement=HTMLElement>(selector:string)=>root.querySelector<T>(selector)!;
 const previewGrid=$('[data-gift-matches]').cloneNode(true) as HTMLElement;
 const previewCopy=['[data-results-eyebrow]','[id="gift-results-title"]','[data-gift-results-summary]','[data-result-count]'].map(selector=>[selector,$(selector).textContent??'']);
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)'),selected=new Set<string>();
 let step=1,furthest=1,answers:GiftAnswers|null=null,showAll=false,current:any=null;
 const announce=(text:string)=>{$('[data-gift-announcement]').textContent=text};
 const error=(message:string)=>{const el=$('[data-gift-error]');el.textContent=message;el.hidden=false};
 const pick=(name:string)=>form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value??'';
 const field=(name:string)=>form.elements.namedItem(name) as HTMLInputElement|HTMLSelectElement;
 const read=()=>parseGiftAnswers(new URLSearchParams({tier:pick('animal'),ziel:pick('goal'),budget:pick('budget'),futter:field('food').value,gewicht:field('weight').value,abo:field('subscription').value}));
 const contexts=()=>root.querySelectorAll<HTMLElement>('[data-goal-context]').forEach(el=>el.hidden=el.dataset.goalContext!==pick('goal'));
 const fill=(a:GiftAnswers)=>{
  for(const [name,value]of [['animal',a.animal],['goal',a.goal],['budget',a.budget]]){const radio=form.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`);if(radio)radio.checked=true}
  field('food').value=a.food;field('weight').value=a.weight?String(a.weight):'';field('subscription').value=a.subscription;contexts();
 };
 const go=(next:number,focus=true)=>{
  const viewport=$('[data-gift-viewport]'),oldHeight=viewport.getBoundingClientRect().height;
  step=Math.max(1,Math.min(4,next));furthest=Math.max(furthest,step);root.dataset.step=String(step);
  root.querySelectorAll<HTMLElement>('[data-gift-panel]').forEach(p=>p.hidden=p.dataset.giftPanel!==String(step));
  root.querySelectorAll<HTMLButtonElement>('[data-step-link]').forEach(button=>{const n=Number(button.dataset.stepLink);button.disabled=n>furthest;button.dataset.complete=String(n<step);button.toggleAttribute('aria-current',n===step);if(n===step)button.setAttribute('aria-current','step')});
  const captions=['Tier auswählen','Alltag eingrenzen','Preisrahmen wählen','Auswahl ansehen'];$('[data-progress-caption]').textContent=`${step} · ${captions[step-1]}`;$('[data-progress-fill]').style.width=`${step*25}%`;
  $('[data-gift-back]').hidden=step===1;$('[data-gift-next]').hidden=step===4;$('[data-step-label]').textContent=`Schritt ${step} von 4`;$('[data-gift-error]').hidden=true;
  const nextButton=$<HTMLButtonElement>('[data-gift-next]');nextButton.firstChild!.textContent=step===3?'Vorschläge ansehen ':'Weiter ';
  if(!reduce.matches){viewport.animate([{height:`${oldHeight}px`},{height:`${viewport.getBoundingClientRect().height}px`}],{duration:220,easing:'ease-out'});$(`[data-gift-panel="${step}"]`).animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'ease-out'})}
  if(focus&&step<4){const heading=$(`[data-gift-panel="${step}"] legend`);heading.tabIndex=-1;heading.focus({preventScroll:true})}
  announce(`Schritt ${step} von 4.`);
 };
 function compareStatus(){
  $('[data-compare-actions]').hidden=false;
  $('[data-compare-status]').textContent=selected.size?`${selected.size} von 3 Modellen im Vergleich.`:'Bis zu drei Modelle auswählen. Zwei genügen für einen Vergleich.';
  const open=$<HTMLButtonElement>('[data-open-comparison]');open.disabled=selected.size<2;open.textContent=`Direktvergleich öffnen${selected.size?` (${selected.size})`:''}`;
  root.querySelectorAll<HTMLButtonElement>('[data-compare-toggle]').forEach(b=>{const active=selected.has(b.dataset.compareToggle!);b.setAttribute('aria-pressed',String(active));b.textContent=active?'✓ Im Vergleich':'＋ Vergleichen'});
  if(selected.size<2)$('[data-gift-comparison]').hidden=true;
 }
 function renderComparison(){
  const products=[...selected].map(slug=>bySlug.get(slug)),table=$<HTMLTableElement>('[data-gift-comparison-table]');table.replaceChildren();
  const caption=document.createElement('caption');caption.textContent='Dokumentierte Eigenschaften deiner ausgewählten Modelle';table.append(caption);
  const thead=document.createElement('thead'),header=document.createElement('tr'),corner=document.createElement('th');corner.textContent='Entscheidungsfrage';header.append(corner);
  for(const p of products){const th=document.createElement('th');th.scope='col';const a=document.createElement('a');a.href=p.route;a.textContent=p.title;th.append(a);header.append(th)}thead.append(header);table.append(thead);
  const body=document.createElement('tbody');
  const rows=[['Produkttyp',(p:any)=>p.categoryLabel],['Gerätepreis',(p:any)=>p.priceLabel],['Digitale Folgekosten',(p:any)=>p.subscriptionLabel],['Redaktionelle Bewertung',(p:any)=>`${p.score}/100 – innerhalb des Produkttyps`],['Verfügbarkeitsbeleg',(p:any)=>p.availabilityConfirmed?'Nach letztem Datenstand bestätigt; Händler prüfen':'Nicht bestätigt'],...Object.keys(products[0]?.comparison??{}).filter(k=>k!=='abo').map(k=>[{tier:'Dokumentierte Tiere',stromversorgung:'Stromversorgung',kapazitaet:'Behälter / Kapazität',reinigung:'Reinigung',kamera:'Kamera',gewicht:'Gerätegewicht'}[k]??k,(p:any)=>p.comparison[k]??'Nicht dokumentiert'])];
  for(const [label,value]of rows){const tr=document.createElement('tr'),th=document.createElement('th');th.scope='row';th.textContent=String(label);tr.append(th);for(const p of products){const td=document.createElement('td');td.textContent=String((value as Function)(p));tr.append(td)}body.append(tr)}table.append(body);
 }
 const clone=(p:any,reasons:string[],possible=false,lead=false,position=1,peers:any[]=[])=>{
  const card=template.content.firstElementChild!.cloneNode(true) as HTMLElement;
  populateGiftCard(card,p,{reasons,possible,lead,position,peers});
  card.querySelector('[data-compare-toggle]')!.setAttribute('aria-pressed',String(selected.has(p.slug)));
  return card;
 };
 function renderResults(updateUrl=true,focus=true){
  if(!answers)return;
  current=selectGifts(products,answers);
  const sort=$<HTMLSelectElement>('[data-gift-sort]').value;
  const first=current.matches[0];let alternatives=current.matches.slice(1);if(sort==='price')alternatives.sort((a:any,b:any)=>(a.product.price??Infinity)-(b.product.price??Infinity));const matches=first?[first,...alternatives]:[];
  const shown=showAll?matches:matches.slice(0,3),possible=current.possible.slice(0,3),valid=new Set([...matches.map(m=>m.product.slug),...possible.map(m=>m.product.slug)]);
  for(const slug of selected)if(!valid.has(slug))selected.delete(slug);
  const grid=$('[data-gift-matches]');grid.replaceChildren();for(const [i,m] of shown.entries())grid.append(clone(m.product,m.reasons,false,i===0,i,shown.map((m:any)=>m.product)));
  const more=$('[data-show-more]');more.hidden=matches.length<=3||showAll;more.textContent=`Weitere ${Math.max(0,matches.length-3)} bestätigte Treffer zeigen`;
  $('[data-gift-empty]').hidden=matches.length>0;
  $('[data-gift-possible]').hidden=possible.length===0;$<HTMLDetailsElement>('[data-gift-possible]').open=matches.length===0;const possibleGrid=$('[data-gift-possible-grid]');possibleGrid.replaceChildren();for(const p of possible)possibleGrid.append(clone(p.product,p.unknowns,true));
  $('[data-result-tools]').hidden=false;$('[data-results-eyebrow]').textContent='Nach deinen Antworten eingegrenzt';
  const animal={cat:'Katze',dog:'Hund',both:'Hund und Katze'}[answers.animal];
  $('[data-result-count]').textContent=`${matches.length} bestätigte Treffer · ${current.possible.length} mit offenen Punkten`;
  $('[data-gift-results-summary]').textContent=`Für ${animal} · ${giftGoals[answers.goal].label} · ${giftBudgets[answers.budget]}. ${matches.length?'Tierart, ausgewählte Anforderungen und verfügbare Belege passen zu diesen Antworten.':'Es gibt derzeit keinen vollständig bestätigten Abgleich.'}`;
  $('[data-result-note]').hidden=false;$('[data-result-note]').textContent=answers.animal==='both'?'„Für beide“ bedeutet dokumentierte Eignung für beide Tierarten – keine Zusage zu gleichzeitiger Nutzung oder getrennten Rationen.':'Prüfe Tiergröße, Einrichtung und Nutzung gemeinsam mit der beschenkten Person. Liefertermine werden hier nicht zugesichert.';
  const title=$('[id="gift-results-title"]');title.textContent=matches.length?'Das könnte euren Alltag leichter machen.':'Hier lohnt sich zuerst eine Rückfrage.';
  root.querySelectorAll<HTMLElement>('[data-edit-step]').forEach(b=>{if(b.closest('.gift-answer-chips'))b.textContent=Number(b.dataset.editStep)===1?animal:Number(b.dataset.editStep)===2?giftGoals[answers!.goal].short:giftBudgets[answers!.budget]});
  compareStatus();if(!$( '[data-gift-comparison]').hidden)renderComparison();
  if(!reduce.matches&&focus){$('[data-gift-results] .gift-section-heading').animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'ease-out'});$('[data-gift-panel="4"] .gift-result-seal').animate([{transform:'scale(.85)',opacity:.4},{transform:'scale(1)',opacity:1}],{duration:240,easing:'ease-out'})}
  if(!reduce.matches)[...grid.children].forEach((card,i)=>(card as HTMLElement).animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,delay:i*45,easing:'ease-out',fill:'backwards'}));
  if(updateUrl){const url=new URL(location.href);url.search=giftSearchParams(answers).toString();url.hash='geschenkergebnis';history.pushState({gift:true},'',url)}
  announce(`${matches.length} bestätigte Treffer. ${current.possible.length} Vorschläge mit offenen Angaben.`);
  if(focus){title.focus({preventScroll:true});$('[data-gift-results]').scrollIntoView({behavior:reduce.matches?'instant':'smooth',block:'start'})}
 }
 root.addEventListener('toggle',event=>{const details=event.target as HTMLDetailsElement;if(details.matches?.('.gift-card__details')&&details.open&&!reduce.matches){[...details.children].filter(el=>el.tagName!=='SUMMARY').forEach(el=>(el as HTMLElement).animate([{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'}))}},true);
 form.addEventListener('change',contexts);
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(step===1&&!pick('animal')){error('Wähle Katze, Hund oder beide.');form.querySelector<HTMLInputElement>('[name="animal"]')?.focus();return}
  if(step===2&&!pick('goal')){error('Wähle einen Wunsch für den Alltag.');form.querySelector<HTMLInputElement>('[name="goal"]')?.focus();return}
  if(step===2&&pick('goal')==='outdoors'&&!(field('weight') as HTMLInputElement).checkValidity()){error('Trage ein gültiges Tiergewicht von 0,1 bis 150 kg ein oder lass das Feld offen.');field('weight').focus();return}
  if(step===3){if(!pick('budget')){error('Wähle einen Preisrahmen oder „Budget offen“.');return}answers=read();if(!answers)return;showAll=false;go(4,false);renderResults();return}
  go(step+1);
 });
 root.addEventListener('click',event=>{
  const target=(event.target as Element).closest<HTMLElement>('button,a');if(!target)return;
  if(target.hasAttribute('data-gift-back'))go(step-1);
  if(target.dataset.stepLink){const n=Number(target.dataset.stepLink);if(n===4){answers=read();if(answers){go(4,false);renderResults()}}else go(n)}
  if(target.dataset.editStep){go(Number(target.dataset.editStep));$('[id="geschenkfinder"]').scrollIntoView({behavior:reduce.matches?'instant':'smooth'})}
  if(target.dataset.presetGoal){const input=form.querySelector<HTMLInputElement>(`input[name="goal"][value="${target.dataset.presetGoal}"]`);if(input)input.checked=true;contexts();go(pick('animal')?2:1,false)}
  if(target.hasAttribute('data-show-more')){showAll=true;renderResults(false,false)}
  if(target.dataset.compareToggle){const slug=target.dataset.compareToggle;if(selected.has(slug))selected.delete(slug);else if(selected.size<3)selected.add(slug);else{announce('Es können höchstens drei Modelle verglichen werden. Entferne zuerst ein anderes.');return}compareStatus();if(!$( '[data-gift-comparison]').hidden)renderComparison()}
  if(target.hasAttribute('data-open-comparison')&&selected.size>=2){renderComparison();$('[data-gift-comparison]').hidden=false;$('[id="gift-comparison-title"]').focus({preventScroll:true});$('[data-gift-comparison]').scrollIntoView({behavior:reduce.matches?'instant':'smooth'})}
  if(target.hasAttribute('data-close-comparison')){$('[data-gift-comparison]').hidden=true;$('[data-open-comparison]').focus()}
  if(target.hasAttribute('data-copy-selection')){if(!navigator.clipboard){announce('Die Auswahl steht in der Adresszeile und kann dort kopiert werden.');return}navigator.clipboard.writeText(location.href).then(()=>announce('Link zu deiner Auswahl kopiert.')).catch(()=>announce('Die Auswahl steht in der Adresszeile und kann dort kopiert werden.'))}
 });
 $('[data-gift-sort]').addEventListener('change',()=>renderResults(false,false));
 const restore=()=>{const state=parseGiftAnswers(new URLSearchParams(location.search));if(state){answers=state;fill(state);go(4,false);renderResults(false,false)}else{answers=null;selected.clear();showAll=false;form.reset();contexts();$('[data-gift-matches]').replaceChildren(...[...previewGrid.childNodes].map(n=>n.cloneNode(true)));for(const [selector,text]of previewCopy)$(selector).textContent=text;for(const selector of ['[data-result-tools]','[data-result-note]','[data-gift-empty]','[data-gift-possible]','[data-show-more]','[data-gift-comparison]','[data-compare-actions]'])$(selector).hidden=true;furthest=1;go(1,false)}};
 window.addEventListener('popstate',restore);
 // Editorial tools use the same serialized source values; they never change the finder.
 const cost=$<HTMLSelectElement>('[data-cost-model]');cost.disabled=false;
 cost.addEventListener('change',()=>{const p=bySlug.get(cost.value);if(!p)return;const total=p.tco12,service=total&&p.price!=null?total.value-p.price:null;const money=(v:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(v);$('[data-cost-device]').textContent=p.priceLabel;$('[data-cost-service]').textContent=service==null?'Offen':money(service);$('[data-cost-total]').textContent=total?.label??'Nicht vollständig belegt';$('[data-cost-note]').textContent=`${p.subscriptionLabel}. Rechenbeispiel mit dem hinterlegten Tarif; optionale Dienste sind keine Pflicht. Versand und Verbrauchsteile sind nicht enthalten. Keine vollständige Lebenszykluskostenrechnung.`;$('[data-cost-availability]').textContent=p.availabilityConfirmed?'Verfügbarkeit nach Datenstand bestätigt; Händler prüfen.':'Verfügbarkeit nicht bestätigt.';$<HTMLAnchorElement>('[data-cost-link]').href=p.route;announce(`${p.title}: Gerät ${p.priceLabel}. Zusammen über zwölf Monate: ${total?.label??'nicht vollständig belegt'}.`)});
 const chooseNeed=(key:string)=>{root.querySelectorAll<HTMLElement>('[data-need-answer]').forEach(el=>el.hidden=el.dataset.needAnswer!==key);root.querySelectorAll<HTMLElement>('[data-need]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.need===key)))};
 chooseNeed('rations');root.querySelectorAll<HTMLButtonElement>('[data-need]').forEach(button=>button.addEventListener('click',()=>{chooseNeed(button.dataset.need!);const output=root.querySelector<HTMLElement>(`[data-need-answer="${button.dataset.need}"]`)!;announce(output.textContent??'');if(!reduce.matches)output.animate([{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'})}));
 form.hidden=false;$('[data-finder-fallback]').hidden=true;root.dataset.enhanced='true';restore();
 if('IntersectionObserver'in window&&!reduce.matches){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('gift-in-view');observer.unobserve(e.target)}}),{threshold:.08});root.querySelectorAll('.gift-reveal').forEach(section=>observer.observe(section))}else{root.querySelectorAll('.gift-reveal').forEach(section=>section.classList.add('gift-in-view'))}
}
