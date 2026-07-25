const norm=v=>String(v??"").toLocaleLowerCase("de-DE").replaceAll("ä","ae").replaceAll("ö","oe").replaceAll("ü","ue").replaceAll("ß","ss").replace(/[^a-z0-9]/g,"");
const rec=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const fmt=v=>v===undefined||v===null||v===""?undefined:Array.isArray(v)?v.filter(Boolean).join(", "):typeof v==="boolean"?(v?"Ja":"Nein"):String(v).trim();
const byKey=(o,keys)=>{const wanted=new Set(keys.map(norm));return Object.entries(rec(o)).find(([k])=>wanted.has(norm(k)))?.[1]};
const spec=(p,rx)=>p?.specs?.find(s=>rx.some(r=>r.test(s.label)))?.value;
const list=p=>[p?.title,p?.description,p?.recommendation,p?.useCase,p?.capacity,...(p?.features??[]),...(p?.strengths??[]),...(p?.weaknesses??[]),...(p?.decision?.bestFor??[]),...(p?.decision?.attention??[]),...(p?.specs??[]).map(s=>`${s.label}: ${s.value}`)].filter(Boolean);
const first=(p,rx)=>list(p).find(v=>rx.test(String(v)));
const derive=(p,item,c)=>{const k=norm(c.key||c.label),f=p?.comparisonFilters??{},g=p?.gps,e=list(p).join(" ").toLocaleLowerCase("de-DE");
 if(["profil","einordnung","einsatzprofil"].includes(k))return item?.recommendation??p?.recommendation;
 if(["futterart","foodtype"].includes(k)){if(f.foodType?.length)return f.foodType.map(x=>x==="wet"?"Nassfutter":"Trockenfutter").join(", ");const w=/nassfutter|wet food|feuchtfutter/.test(e),d=/trockenfutter|dry food|kroketten/.test(e);return w&&d?"Nass- und Trockenfutter":w?"Nassfutter":d?"Trockenfutter":undefined}
 if(["tier","eignung","geeignetfuer","geeignetetiere"].includes(k)){const a=f.animal?.length?f.animal:g?.animal??[];return a.length?a.map(x=>x==="dog"?"Hund":"Katze").join(", "):spec(p,[/geeignet/i,/tier/i])}
 if(["tiergroesse","petsize"].includes(k))return f.petSize?.length?f.petSize.map(x=>x==="small"?"Klein":x==="medium"?"Mittel":"Groß").join(", "):spec(p,[/tiergröße/i,/tiergroesse/i]);
 if(["kapazitaet","volumen","fassungsvermoegen"].includes(k))return p?.capacity??spec(p,[/kapazität/i,/kapazitaet/i,/volumen/i,/fassungs/i]);
 if(["portionierung","ausgabemenge","portion"].includes(k))return spec(p,[/portion/i,/ausgabemenge/i,/dosierung/i])??first(p,/portion|ausgabe|dosier/i);
 if(["mahlzeiten","mahlzeitenzahl","mealcount"].includes(k))return spec(p,[/mahlzeit/i,/fächer/i,/faecher/i])??first(p,/mahlzeit|fächer|faecher|öffnungszeit|oeffnungszeit/i);
 if(["app","steuerung","appundverbindung"].includes(k))return typeof f.app==="boolean"?(f.app?"App-Steuerung":"Keine App"):spec(p,[/app/i,/steuerung/i,/wlan/i,/wifi/i]);
 if(["kamera","video"].includes(k))return typeof f.camera==="boolean"?(f.camera?"Ja":"Nein"):spec(p,[/kamera/i,/video/i]);
 if(["zugang","futterzugang","zugangskontrolle"].includes(k))return f.access==="microchip"?"Mikrochip oder RFID":f.access==="open"?"Freier Zugang":spec(p,[/zugang/i,/mikrochip/i,/rfid/i])??first(p,/zugang|mikrochip|rfid|futterklau/i);
 if(["mehrkatzen","mehrtiereignung","mehrkatzenhaushalt"].includes(k))return first(p,/mehrkatzen|mehrtier|zwei katzen|doppelschale|futterklau|getrennte ration/i)??"Keine individuelle Trennung dokumentiert";
 if(["ausfallsicherheit","notstrom","stromreserve"].includes(k))return typeof f.backupPower==="boolean"?(f.backupPower?"Batterie-Backup vorhanden":"Kein Batterie-Backup dokumentiert"):spec(p,[/stromversorgung/i,/batterie/i,/akku/i,/notstrom/i])??first(p,/batterie|akku|notstrom|stromausfall|offline/i);
 if(["stromversorgung","strom","power"].includes(k))return spec(p,[/stromversorgung/i,/batterie/i,/akku/i,/netz/i]);
 if(["reinigung","pflege"].includes(k))return spec(p,[/reinigung/i,/spülmaschine/i,/spuelmaschine/i])??p?.experience?.maintenance??first(p,/reinig|spülmaschine|spuelmaschine|abnehmbar|zerlegbar/i);
 if(["kuehlung","kuehlprinzip","cooling"].includes(k))return spec(p,[/kühl/i,/kuehl/i])??first(p,/kühl|kuehl|thermoelektr|kühlakku|kuehlakku/i);
 if(["material","werkstoff"].includes(k))return spec(p,[/material/i,/edelstahl/i,/keramik/i])??first(p,/edelstahl|keramik|kunststoff/i);
 if(["lautstaerke","geraeusch"].includes(k))return spec(p,[/lautstärke/i,/lautstaerke/i,/geräusch/i,/geraeusch/i])??first(p,/leise|laut|geräusch|geraeusch/i);
 if(["filter","filtersystem"].includes(k))return spec(p,[/filter/i])??first(p,/filter/i);
 if(["besonderheit","wichtigstervorteil"].includes(k))return p?.strengths?.[0]??p?.recommendation;
 if(["grenze","einschraenkung","attention"].includes(k))return p?.decision?.attention?.[0]??p?.weaknesses?.[0];
 if(["ortung","satellitensysteme"].includes(k))return spec(p,[/ortung/i,/satellit/i,/gps/i])??(g?"GPS-Ortung":undefined);
 if(["uebertragung","mobilfunk","funksystem"].includes(k))return spec(p,[/übertragung/i,/uebertragung/i,/mobilfunk/i,/vhf/i])??g?.transmission;
 if(["reichweite","funkreichweite"].includes(k))return spec(p,[/reichweite/i]);
 if(["abo","abonnement","laufendekosten"].includes(k))return typeof g?.subscriptionRequired==="boolean"?(g.subscriptionRequired?"Abo erforderlich":"Kein Mobilfunkabo erforderlich"):spec(p,[/abo/i,/abonnement/i,/laufende kosten/i]);
 if(["akkulaufzeit","batterielaufzeit"].includes(k))return g?.batteryMaxDays?`Bis zu ${g.batteryMaxDays} Tage`:spec(p,[/akkulaufzeit/i,/batterielaufzeit/i]);
 if(["gewicht","geraetegewicht"].includes(k)){const x=g?.deviceWeightGrams??g?.totalWeightGrams;return x?`${x} g`:spec(p,[/gewicht/i])}
 if(["abmessungen","masse","groesse"].includes(k))return spec(p,[/maße/i,/masse/i,/abmess/i]);
 if(["wasserschutz","wasserdicht","ipschutz"].includes(k))return g?.waterproofRating??spec(p,[/wasserschutz/i,/wasserdicht/i,/ip\d/i]);
 if(["befestigung","halsband"].includes(k))return g?.attachmentType??spec(p,[/befestigung/i,/halsband/i,/clip/i]);
 if(["preisklasse","pricetier"].includes(k))return f.priceTier??p?.priceCategory;
 if(["score","bewertung"].includes(k))return p?.score??(typeof p?.rating==="number"?Math.round(p.rating*20):undefined);
};
export function resolveComparisonValue({product,item={},criterion}){const keys=[criterion.key,criterion.label,norm(criterion.key||criterion.label)];for(const source of [item.overrides,item.values]){const v=fmt(byKey(source,keys));if(v!==undefined)return v}if(!product)return criterion.fallback??"–";if(criterion.source){let cur=product;for(const part of criterion.source.split(".")){cur=cur&&typeof cur==="object"?cur[part]:undefined}const v=fmt(cur);if(v!==undefined)return v}const cd=rec(product.comparisonData);for(const section of [rec(cd.custom),...Object.values(cd).map(rec)]){const v=fmt(byKey(section,keys));if(v!==undefined)return v}return fmt(derive(product,item,criterion))??criterion.fallback??"–"}
