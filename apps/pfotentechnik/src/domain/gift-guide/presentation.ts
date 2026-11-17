// Customer-facing presentation of the shared Commerce selection. Historical
// amounts are informative only and never become giftPrice/budget evidence.
export function giftPricePresentation(selected:any,{now=Date.now()}={}){
 const date=selected?.checkedAt?new Date(selected.checkedAt):null;
 const verifiedDate=date&&Number.isFinite(+date)&&+date<=Number(now);
 const amount=Number(selected?.storedCurrent),usable=verifiedDate&&Number.isFinite(amount)&&amount>0&&selected?.currency==='EUR'&&selected?.offer?.priceState!=='removed';
 const current=usable&&!selected?.offer?.error&&selected.current!=null?selected.current:null;
 const historical=usable&&current==null?amount:null;
 const format=(value:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(value);
 const sourceLabel=selected?.source?.label;
 const stamp=verifiedDate?date.toLocaleDateString('de-DE',{timeZone:'Europe/Berlin'}):null;
 return {price:current,historicalPrice:historical,priceState:current!=null?'current':historical!=null?'historical':'unknown',
  priceLabel:current!=null?format(current):historical!=null?`Zuletzt ${format(historical)}`:'Preis beim Händler prüfen',
  priceDetail:current!=null?`Preisstand ${stamp} · Versand ggf. zusätzlich`:historical!=null?`Preisstand ${stamp}${sourceLabel?` · ${sourceLabel}`:''} · Aktuellen Preis beim Händler prüfen`:'',
  priceSourceLabel:usable?selected.source?.label??selected.offer?.label??null:null};
}

// Presence of an asset or operator download approval does not establish web
// publication rights. Consume an explicit existing provenance grant only.
export function giftModelImage(media:any,provenance:any,slug:string,{assetHash,role='comparison'}:{assetHash?:string;role?:string}={}){
 const grant=provenance?.authorization;
 if(grant?.websiteUseGranted!==true||!grant?.evidence||grant?.aiImagesGenerated!==false)return null;
 if(provenance.modelSlug!==slug)return null;
 const source=media?.src&&typeof media.src==='object'?media.src:media;
 if(!source||typeof source.src!=='string'||!(source.width>0&&source.height>0))return null;
 const asset=provenance.assets?.find((a:any)=>a.role===role||a.file===`${role}.webp`);
 if(!asset||asset.generated===true||!['manufacturer-product-image','amazon-product-image','own-product-photo','licensed-product-photo'].includes(asset.sourceKind??asset.kind)||!asset.sha256||asset.sha256!==assetHash)return null;
 return {src:source,alt:`${slug.replaceAll('-',' ')} – Produktansicht`};
}
