import {decisionFactApprovals, isDecisionFactApproved} from './decisionFactReview.mjs';
import {buildLitterCompatibilityModel} from '../litterCompatibility.ts';
import {reviewProductDecisionFacts} from './editorialQuality.mjs';

export const normalizeDecisionText = value => String(value ?? '').trim().toLowerCase()
 .replaceAll('ä','ae').replaceAll('ö','oe').replaceAll('ü','ue').replaceAll('ß','ss').replace(/[^a-z0-9]+/g,' ').trim();
const norm=normalizeDecisionText;
const scalar=v=>typeof v==='string'||typeof v==='number'||typeof v==='boolean'?String(v).trim():'';
export const protectedDecisionSlugs = Object.freeze([
 'aqara-smart-pet-feeder-c1','cat-mate-c200','cat-mate-c500','catit-pixi-smart-6-meal-feeder','pawsync-smart-pet-feeder',
 'oneisall-3-5l-cordless-fountain','petkit-eversweet-solo-2-fountain','petkit-eversweet-solo-se','petlibro-dockstream-cordless','petlibro-polar-wet-food-feeder'
]);
const unknown=v=>/\b(?:unbekannt|unklar|keine angaben|nicht (?:vom hersteller |eindeutig |ausreichend |belastbar )?(?:dokumentiert|ausgewiesen|angegeben|belegt|bekannt|bestaetigt)|nicht spezifiziert|offen)\b/.test(norm(v));
const negative=v=>/^(?:nein|ohne|kein(?:e[nrs]?)?|nicht (?:vorhanden|unterstuetzt|vorgesehen|integriert|erforderlich))\b|\b(?:app|kamera|wlan) (?:ist )?nicht (?:vorhanden|integriert|unterstuetzt)\b/.test(norm(v));
const batteryAbsent=v=>/^(?:nein\b|ohne (?:integrierten? )?akku\b|kein(?:e[nrs]?)? (?:integrierter? )?akku\b)|\bakku (?:ist )?nicht (?:vorhanden|integriert|vorgesehen)\b/.test(norm(v));
const batteryKnown=v=>/\b(?:integrierter? (?:wiederaufladbarer? )?akku|akku (?:ist )?(?:vorhanden|integriert)|mit (?:einem )?akku|\d+(?: \d+)? (?:mah|ah|wh|tage|stunden|wochen))\b/.test(norm(v))||batteryAbsent(v)||/^ja\b/.test(norm(v));
const units={volume:/\d[\d.,]*\s*(?:l\b|liter\b|ml\b|kg\b|g\b)/i,energy:/\d[\d.,]*\s*(?:mAh|Ah|Wh)\b/i,weight:/\d[\d.,]*\s*(?:g|kg)\b/i,length:/\d[\d.,]*\s*(?:mm|cm|m)\b/i};
const categoryOf=data=>norm(data?.category?.key??data?.category?.label??data?.category);

// Every rule selects an existing value and a bounded decision implication. No
// external facts, inferred specifications, stock claims or product recommendations.
function ruleFor(spec,category){
 const key=norm(spec.label),v=scalar(spec.value),n=norm(v);
 const gps=/gps|tracker/.test(category),feeder=/futter/.test(category),water=/trink|brunnen/.test(category),litter=/katzentoilett/.test(category),flap=/klappe/.test(category),camera=/kamera/.test(category);
 const r=(topic,priority,consequence)=>({topic,priority,consequence});
 if(!key||!v)return {issue:'MISSING_VALUE'};
 if(/(?:unbekannt|unklar|keine angaben|nicht dokumentiert) (?:darueber |dazu )?ob\b/.test(n))return {issue:'UNKNOWN_VALUE'};
 if(/(?:kapazitaet|volumen|gewicht|laufzeit|krokett|abmess)/.test(key)&&(/^-\s*\d/.test(v)||/^0(?:[.,]0+)?\s*(?:mAh|Ah|Wh|l|Liter|ml|g|kg|mm|cm|Tage|Stunden)\b/i.test(v)))return {issue:'INVALID_UNIT'};
 if(/akkulaufzeit/.test(key)&&units.energy.test(v))return {issue:'INVALID_UNIT'};
 if(units.energy.test(v)&&! /^(?:akku|kapazitaet|stromversorgung)/.test(key))return {issue:'INVALID_UNIT'};
 if(/gewicht/.test(key)&&units.energy.test(v))return {issue:'INVALID_UNIT'};
 if(unknown(v)&&!( /akku/.test(key)&&batteryKnown(v)&&! /ob .*akku|akkustatus/.test(n))&&!/^(?:ja|nein)\b|\b(?:app|kamera|wlan) (?:ist )?vorhanden\b/.test(n))return {issue:'UNKNOWN_VALUE'};
 if(/akku/.test(key)||units.energy.test(v)){
  if(!batteryKnown(v))return {issue:'UNSUPPORTED_BATTERY'};
  if(batteryAbsent(v))return r('power',82,'Kein integrierter Akku: Ohne Netzstrom läuft das Gerät nur weiter, wenn eine separate Batterie- oder Notstromlösung ausdrücklich vorgesehen ist.');
  if(gps)return r('battery',99,'Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.');
  if(/backup|notstrom/.test(key+' '+n))return r('power',91,'Der dokumentierte Akku ist als Backup einzuordnen; daraus folgt kein uneingeschränkter kabelloser Betrieb aller Funktionen.');
  return r('battery',83,'Die Akkuangabe allein belegt keine Laufzeit im Dauerbetrieb. Vergleiche sie mit dem dokumentierten Betriebsmodus, bevor du einen Standort ohne Steckdose wählst.');
 }
 if(gps){
  if(/abo|kosten danach|enthaltener service|gesamtzeitraum/.test(key))return r('subscription',98,negative(v)?'Ein verpflichtendes Geräteabo ist hier nicht angegeben; prüfe separat, ob SIM, Mobilfunkdienst oder ein Zusatzgerät bezahlt werden müssen.':'Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.');
  if(/uebertragung|mobilfunk|abdeckung|netze|reichweite|benoetigtes zusatzgeraet|^funk$/.test(key))return r('network',96,/funk|vhf|handgeraet|alpha/.test(n)&&! /mobilfunk|sim|lte|4g/.test(n)?'Die dokumentierte Funkverbindung setzt die passende Gegenstelle und deren Reichweite voraus; eine Smartphone-Ortung über Mobilfunk ist damit nicht zugesichert.':'Prüfe vor dem Kauf die unterstützten Netze und Länder für deinen Einsatzort. Satellitenortung allein garantiert noch keine Übertragung des Standorts an dich.');
  if(/geeignet|herstellerempfehlung|mindestgewicht|halsbandumfang|befestigung/.test(key))return r('animal-fit',97,'Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.');
  if(/gewicht/.test(key)&&units.weight.test(v))return r('weight',93,'Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.');
  if(/ortung|live tracking|geozaun|aktualisier|superlive/.test(key))return r('location',94,'Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.');
 }
 if(feeder){
  if(/krokett/.test(key))return units.length.test(v)?r('food-fit',98,'Miss die längste Seite des verwendeten Futters und halte die angegebene Größenfreigabe ein; eine passende Behältergröße sagt nichts über die Eignung der Kroketten aus.'):{issue:'INVALID_UNIT'};
  if(/futterart/.test(key))return r('food-fit',96,'Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.');
  if(/portion|dosier|waage|wiegenapf/.test(key))return r('portion',97,'Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.');
  if(/tiererkennung|zugang|schutz vor futterzugriff|napfanzahl|^naepfe$/.test(key))return r('access',95,/zwei|2|dual/.test(n)&&!/rfid|chip/.test(n)?'Mehrere Näpfe teilen das Futter räumlich auf; sie belegen keine getrennte Ration oder Zugangskontrolle pro Tier.':'Prüfe die dokumentierte Zugangskontrolle pro Tier, wenn unterschiedliche Rationen oder Diätfutter getrennt bleiben müssen.');
  if(/kuehlung|frischhaltesystem/.test(key))return r('food-storage',87,'Plane die Futterstandzeit nach der dokumentierten Kühl- oder Frischhaltetechnik; die Angabe ist keine allgemeine Haltbarkeitsgarantie für jede Futterart.');
  if(/mahlzeiten|zeitplan|programmierung/.test(key))return r('schedule',81,'Gleiche die Zahl und Verteilung der planbaren Ausgaben mit dem Tagesplan deines Tieres ab; mehrere Ausgaben ersetzen keine Kontrolle der Tagesration.');
 }
 if(water){
  if(/filter/.test(key)){
   if(negative(v))return r('filter',89,'Die dokumentierte Filterausstattung ersetzt keine Reinigung; plane für dieses Modell nur die tatsächlich angegebenen Ersatzteile ein.');
   return r('filter',/wechsel|ersatzfilter/.test(key)?92:89,'Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.');
  }
  if(/laut|geraeusch/.test(key))return /\d.*db/i.test(v)?r('noise',79,'Ein Herstellerwert in dB ist nur bei gleichen Messbedingungen vergleichbar. Prüfe den Aufstellort besonders bei Nutzung im Schlafzimmer.'):{issue:'NO_MEASURED_NOISE'};
  if(/wasserreserve bei stromausfall/.test(key))return r('power',94,'Unterscheide frei zugängliches Restwasser von weiterlaufender Wasserförderung: Eine dokumentierte Reserve belegt keinen Pumpenbetrieb bei Stromausfall.');
  if(/trinkmengenmessung/.test(key))return r('measurement',86,negative(v)?'Ohne dokumentierte Trinkmengenmessung lässt sich aus Pumpenlaufzeit oder Tankstand keine Trinkmenge eines einzelnen Tieres ableiten.':'Prüfe, was tatsächlich gemessen wird; eine Gesamtmenge ordnet den Verbrauch in einem Mehrtierhaushalt nicht automatisch einem Tier zu.');
 }
 if(litter){
  if(/sicherheit|sensorik|automatischer stopp|kitten.*grenze/.test(key))return r('safety',100,'Die dokumentierten Schutzfunktionen sind keine Sicherheitsgarantie. Halte die Alters- und Gewichtsgrenzen ein und beobachte die Eingewöhnung und ersten Reinigungszyklen.');
  if(/katzengewicht|mindestalter|katzenprofil/.test(key))return r('animal-fit',99,'Nutze die Automatik nur innerhalb der dokumentierten Alters- und Gewichtsgrenzen; besonders leichte oder junge Katzen sind nicht pauschal freigegeben.');
  if(/streu|siebgrenze/.test(key))return r('litter-fit',96,'Halte Streuart und Korngrößengrenzen des Modells ein; eine ungeeignete Streu kann durch das Sieb fallen oder die Trennung beeinträchtigen.');
  if(/abfall|entleerung|kapazitaet/.test(key))return r('waste',88,'Plane die Entleerung nach Anzahl der Katzen und tatsächlicher Nutzung. Das Behältervolumen oder eine Maximaldauer ist keine feste Wartungsfrist.');
  if(/reinigungssystem|wartung|abdichtung/.test(key))return r('cleaning',87,'Plane neben den automatischen Zyklen die dokumentierte manuelle Reinigung ein; automatische Trennung bedeutet keine selbstständige Grundreinigung.');
 }
 if(flap){
  if(/chip|kompatibilitaet/.test(key))return r('chip-fit',99,'Lass das Chipformat deines Tieres mit der dokumentierten Kompatibilität abgleichen; Mikrochip, RFID-Anhänger und Kameraerkennung sind nicht austauschbar.');
  if(/zugang|erkennung|richtungsrechte|verschluss/.test(key))return r('access',98,'Prüfe, welche Richtung und welche Tiere die dokumentierte Erkennung tatsächlich steuert; eine Eingangskontrolle belegt keine individuellen Ausgangsrechte.');
  if(/speicher|kapazitaet/.test(key)&&/\d/.test(v)&&/tier|chip|identitaet/.test(n))return r('animal-count',90,'Vergleiche die speicherbare Tierzahl mit deinem Haushalt. Gespeicherte Identitäten belegen keine individuellen Zeitpläne oder Richtungsrechte.');
  if(/ausfall|offline|notstrom/.test(key))return r('power',97,'Gleiche das dokumentierte Verhalten bei Strom- oder Verbindungsausfall mit dem nötigen Zugang deines Tieres ab; die Klappe darf dabei nicht als pauschal ausfallsicher gelten.');
  if(/beute/.test(key))return r('prey',94,'Beuteerkennung ist keine lückenlose Beutesperre. Prüfe die dokumentierten Grenzen, bevor du dich beim unbeaufsichtigten Zugang darauf verlässt.');
  if(/einbau|montage|ausschnitt/.test(key))return r('installation',88,'Gleiche Ausschnitt und Einbaumaterial vor dem Kauf mit den dokumentierten Montagevorgaben ab; Rahmenmaß und benötigte Öffnung sind unterschiedliche Maße.');
 }
 if(camera){
  if(/video|aufloesung|zoom|^sicht$|sichtfeld|schwenken|abdeckung/.test(key))return r('image',97,'Vergleiche die dokumentierte Auflösung und den erfassten Bildbereich mit dem gewünschten Raum. Hohe Auflösung allein schließt tote Winkel nicht aus.');
  if(/navigation|einsatzgrenze|^einsatz$/.test(key))return r('mobility',96,'Prüfe den vorgesehenen Fahrbereich auf die dokumentierten Hindernisse; die Kamera erschließt nicht automatisch mehrere Etagen.');
  if(/speicher|aufzeichnung|cloud|datenschutz/.test(key))return r('storage',95,'Prüfe Speicherort und Aufbewahrungsdauer getrennt vom Livebild; eine Liveansicht garantiert keine später abrufbare Aufnahme.');
  if(/tracking|erkennung|katzenfunktionen/.test(key))return r('recognition',92,'Vergleiche die dokumentierten Erkennungsfunktionen mit deinem Tier; Ereignismeldungen sind keine lückenlose Verhaltens- oder Gesundheitsüberwachung.');
  if(/audio|interaktion/.test(key))return r('interaction',85,'Prüfe die hier genannten Interaktionsmöglichkeiten für deinen Alltag; Audio oder Leckerligabe ersetzen keine Betreuung vor Ort.');
  if(/nachtsicht|nachtmodus/.test(key))return r('night',86,'Prüfe die dokumentierte Nachtfunktion für den geplanten Raum; Tagesbilder allein zeigen nicht die Erkennbarkeit bei Dunkelheit.');
 }
 if((feeder||water)&&/kapazitaet|volumen|wassertank|wasserbehaelter/.test(key)){
  if(!units.volume.test(v)||units.energy.test(v)||(water&&!/\d[\d.,]*\s*(?:l\b|liter\b|ml\b)/i.test(v)))return {issue:'INVALID_UNIT'};
  return r('capacity',water?(/nutzbar/.test(key)?98:95):80,water?'Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.':'Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.');
 }
 if(feeder&&/offline/.test(key))return r('connectivity',94,'Richte den Futterplan vorab ein und prüfe das dokumentierte Offline-Verhalten. Ein App-Protokoll allein belegt keine tatsächlich ausgegebene Mahlzeit.');
 if(gps&&/(?:stromversorgung|laden|ladezeit)/.test(key))return {issue:'COVERED_BY_BATTERY'};
 if(/batterielaufzeit/.test(key)&&/\d/.test(v))return r('power',93,'Plane den Batteriewechsel vor dem angegebenen Maximalzeitraum ein. Ein Hersteller-Maximalwert ist keine Zusage, dass jede Nutzung so lange ohne Wechsel auskommt.');
 if(/batterie|notstrom|backup|stromversorgung|netzteil|netzbetrieb|^strom$|^versorgung$/.test(key))return r('power',90,/backup|notstrom/.test(n+' '+key)?'Prüfe, welche Funktionen laut Dokumentation im Backup weiterlaufen; Batterie-Backup bedeutet weder volle App-Funktion noch unbegrenzte Überbrückung.':/batterie/.test(n)?'Plane passende Ersatzbatterien nach dem dokumentierten Batterietyp ein; aus der Stromquelle allein folgt keine feste Laufzeit.':'Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.');
 if(/abo|pflichtabo|laufende kosten|folgekosten/.test(key))return r('subscription',93,'Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.');
 if(/app|wlan|wifi|bluetooth|konnektivitaet|verbindung/.test(key)){
  if(gps)return {issue:'COVERED_BY_NETWORK'};
  if(negative(v))return r('connectivity',74,'Ohne diese dokumentierte Verbindung steht dieser Bedienweg nicht zur Verfügung; daraus folgt keine Zusage über andere App-, Cloud- oder Offline-Funktionen.');
  if(/2[,. ]4|5[,. ]0|ghz/.test(n+' '+v))return r('connectivity',85,'Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.');
  if(/bluetooth/.test(n+' '+key))return r('connectivity',85,'Bluetooth belegt eine Verbindung im Nahbereich; ein Fernzugriff von unterwegs ist damit allein nicht zugesichert.');
  return r('connectivity',76,'Prüfe die dokumentierten App- und Kontovoraussetzungen vor dem Kauf; App-Unterstützung allein belegt keinen Fernzugriff und keinen Betrieb bei Cloud-Ausfall.');
 }
 if(water&&/trinkhoehe/.test(key)&&units.length.test(v))return r('drinking-height',81,'Vergleiche die dokumentierte Trinkhöhe mit der Haltung deines Tieres; ein großes Tankvolumen sagt nichts über eine passend erreichbare Trinkfläche aus.');
 if(/reinigung|spuelmaschine/.test(key))return r('cleaning',water?93:84,'Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.');
 if(/kamera/.test(key))return r('visual',70,negative(v)?'Ohne Kamera ist keine visuelle Kontrolle über dieses Gerät möglich; Statusmeldungen oder Protokolle werden damit nicht zugesichert.':'Prüfe den dokumentierten Bildbereich: Eine Kameraansicht belegt nicht die tatsächlich gefressene Menge oder eine vollständige Überwachung des Tieres.');
 if(/durchgang|oeffnung|einstieg|schulterbreite/.test(key)&&! /manuell/.test(key)&&units.length.test(v))return r('animal-dimensions',flap?96:89,'Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.');
 if(!gps&&/(?:abmess|^masse$|stellflaeche)/.test(key)&&units.length.test(v))return r('dimensions',60,'Miss den vorgesehenen Stellplatz vor dem Kauf aus und berücksichtige zusätzlich den Zugang zum Befüllen und Reinigen.');
 if(/geeignet|geeignete tiere/.test(key))return r('animal-fit',78,'Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.');
 if(/wasserschutz|schutzklasse|wasserdicht/.test(key)&&/\bip\s*\d{2}\b/i.test(v))return r('protection',72,'Halte dich beim Kontakt mit Wasser an die konkrete IP-Angabe und die Reinigungsvorgaben; daraus folgt keine allgemeine Freigabe für Hochdruck oder Reinigungsmittel.');
 return {issue:'NO_SPECIFIC_RULE'};
}

export function decisionInputSpecs(data,specs=data?.specs??[]){
 const rows=(Array.isArray(specs)?specs:[]).map((s,i)=>({...s,path:`specs[${i}]`,source:'technical-specification'}));
 const append=(label,value,path)=>{if(scalar(value)&&!rows.some(s=>norm(s.label)===norm(label)))rows.push({label,value:scalar(value),path,source:'product-data'})};
 const g=data?.gps;
 if(g){
  if(Array.isArray(g.animal)&&g.animal.length)append('Geeignet für',g.animal.map(v=>({cat:'Katzen',dog:'Hunde'})[v]).filter(Boolean).join(' und ')+(Number(g.minimumPetWeightKg)>0?` ab ${g.minimumPetWeightKg} kg`:''),'gps.animal / gps.minimumPetWeightKg');
  if(['lte','radio','gsm','lte-m','nb-iot'].includes(g.transmission))append('Übertragung',g.transmission.toUpperCase(),'gps.transmission');
  if(g.liveTracking===true)append('Live-Ortung','Live-Tracking dokumentiert','gps.liveTracking');
 }
 const custom=data?.comparisonData?.custom??{};
 const mapping={zugang:'Zugang',richtungsrechte:'Richtungsrechte',durchgang:'Durchgang',einbau:'Einbau',speicher:'Speicherung',video:'Video',bild:'Video',interaktion:'Interaktion',abdeckung:'Abdeckung',abo:'Abo',pflichtabo:'Pflichtabo',datenschutz:'Datenschutz'};
 for(const [key,label]of Object.entries(mapping))if(typeof custom[key]==='string')append(label,custom[key],`comparisonData.custom.${key}`);
 const sub=data?.subscription;
 if(sub&&['optional-subscription','required-subscription','no-subscription'].includes(sub.status))append('Abo',sub.status==='optional-subscription'?'Optionales Abonnement für '+(sub.paidFunctions??[]).join(', '):sub.status==='no-subscription'?'Kein Pflichtabonnement':'Abonnement für Kernfunktionen erforderlich','subscription.status / subscription.paidFunctions');
 return rows;
}
export function inspectDecisionFacts(data,specs=data?.specs??[],approvals=decisionFactApprovals){
 specs=decisionInputSpecs(data,specs);
 const category=categoryOf(data),rejected=[],candidates=[],conflicts=new Set();
 const labelValues=new Map();
 const dataConflicts=[];
 const subRequired=data?.subscription?.requiredForCoreFunction;
 if(typeof data?.gps?.subscriptionRequired==='boolean'&&typeof subRequired==='boolean'&&data.gps.subscriptionRequired!==subRequired)dataConflicts.push({topic:'subscription',code:'CONFLICTING_STRUCTURED_VALUES',paths:['gps.subscriptionRequired','subscription.requiredForCoreFunction']});
 for(const spec of specs){
  const key=norm(spec.label),v=norm(spec.value);
  if(/^(?:abo|pflichtabo)$/.test(key)&&typeof subRequired==='boolean'&&!unknown(spec.value)){
   const yes=/^(?:ja|erforderlich|pflicht)|pflichtabo erforderlich|fuer mobilfunkortung erforderlich/.test(v),no=/^(?:nein|ohne|kein pflicht|optional)/.test(v);
   if(yes&&!subRequired||no&&subRequired)dataConflicts.push({topic:'subscription',code:'CONFLICTING_STRUCTURED_VALUES',paths:[spec.path,'subscription.requiredForCoreFunction']});
  }
  if(data?.gps?.animal?.length&&/^(?:geeignet fuer|herstellerempfehlung)$/.test(key)){
   const named=[/hunde/.test(v)?'dog':null,/katzen/.test(v)?'cat':null].filter(Boolean);
   if(named.length&&named.every(animal=>!data.gps.animal.includes(animal)))dataConflicts.push({topic:'animal-fit',code:'CONFLICTING_ANIMAL_SPECIES',paths:[spec.path,'gps.animal']});
  }
 }
 rejected.push(...dataConflicts);
 for(const s of specs){const k=norm(s.label),v=norm(s.value);if(k&&v&&!unknown(s.value)){if(labelValues.has(k)&&labelValues.get(k)!==v)conflicts.add(k);labelValues.set(k,v)}}
 for(const spec of specs){
  const label=scalar(spec.label),value=scalar(spec.value),rule=ruleFor({label,value},category);
  if(conflicts.has(norm(label)))rejected.push({label,value,code:'CONFLICTING_VALUES'});
  else if(dataConflicts.some(c=>c.topic===rule.topic))rejected.push({label,value,code:'CONFLICTING_VALUES'});
  else if(rule.issue)rejected.push({label,value,code:rule.issue});
  else candidates.push({label,value,consequence:rule.consequence,source:spec.source,topic:rule.topic,priority:rule.priority});
 }
 const compatibility=buildLitterCompatibilityModel(data?.litterCompatibility);
 if(compatibility&&/katzentoilett/.test(category))candidates.push({...compatibility.decisionFact,topic:'litter-fit',priority:98});
 const editorial=reviewProductDecisionFacts({...data,specs},{approvals});
 const explicit=(Array.isArray(data?.decisionFacts)?data.decisionFacts:[]).filter((f,i)=>isDecisionFactApproved(data?.slug,f,approvals)&&!dataConflicts.some(c=>c.topic===ruleFor(f,category).topic)&&!editorial[i]?.issues.some(issue=>['FEATURE_CONTRADICTION','NUMERIC_VALUE_DIFFERS','PRESENCE_WITH_UNKNOWN_PROPERTY','WRONG_DECISION_CONTEXT','CONSEQUENCE_CONTRADICTS_VALUE','INCOMPLETE_FACT'].includes(issue.code))).map(f=>({...f,source:'editorial',topic:ruleFor(f,category).topic??`editorial:${norm(f.label)}`,priority:1000}));
 const seen=new Map(),selected=[];
 for(const candidate of [...explicit,...candidates].sort((a,b)=>b.priority-a.priority)){
  const existing=seen.get(candidate.topic)??selected.find(f=>norm(f.consequence)===norm(candidate.consequence));
  if(existing){
   rejected.push({label:candidate.label,value:candidate.value,code:'DUPLICATE_TOPIC',topic:candidate.topic});
   // Preserve complementary documented values without repeating the decision topic.
   if(existing.source!=='editorial'&&candidate.source===existing.source&&!existing.value.includes(candidate.value)&&((['battery','subscription'].includes(candidate.topic)&&/gps|tracker/.test(category))||(['food-fit','filter','power'].includes(candidate.topic)&&existing.value.split(' · ').length<2))){
    existing.label+=` / ${candidate.label}`;existing.value+=` · ${candidate.value}`;
   }
   continue;
  }
  const selectedCandidate={...candidate};
  seen.set(candidate.topic,selectedCandidate);
  if(selected.length<6)selected.push(selectedCandidate);
  else rejected.push({label:candidate.label,value:candidate.value,code:'LOWER_PRIORITY',topic:candidate.topic});
 }
 const facts=selected.map(({topic,priority,...f})=>f);
 return {version:'35.9',inputs:specs,protected:protectedDecisionSlugs.includes(data?.slug),facts,topics:selected.map(f=>f.topic),rejected,editorial,
  uncertainties:rejected.filter(r=>r.code.startsWith('CONFLICTING_')||['MISSING_VALUE','UNKNOWN_VALUE','INVALID_UNIT','UNSUPPORTED_BATTERY','CONFLICTING_VALUES','NO_MEASURED_NOISE'].includes(r.code)),
  insufficientEvidence:facts.length<4};
}
export function decisionQualitySummary(data){
 const result=inspectDecisionFacts(data);
 return {version:result.version,protected:result.protected,generated:result.facts.length,unreviewedOriginals:result.editorial.filter(f=>f.editorialReview!=='approved-exact-text').length,
  originalFindings:result.editorial.filter(f=>f.issues.length).length,uncertainValues:result.uncertainties.length,removedDuplicateTopics:result.rejected.filter(r=>r.code==='DUPLICATE_TOPIC').length,insufficientEvidence:result.insufficientEvidence};
}

export function decisionTopicFor(fact,category){return ruleFor(fact,norm(category?.key??category?.label??category)).topic??null;}

// The same audit can inspect legacy output and new candidates. Findings are
// deterministic warnings, never a substitute for source or editorial review.
export function reviewRenderedConsequences(data,facts=[]){
 const plain=facts.map(({label,value,consequence})=>({label,value,consequence}));
 const original=reviewProductDecisionFacts({...data,decisionFacts:plain});
 const seen=new Map();
 return original.map((row,index)=>{
  const f=plain[index],topic=decisionTopicFor(f,data.category),issues=[...row.issues];
  const add=(code,problem)=>issues.push({check:'decisionUsefulness',code,problem,evidence:[{label:f.label,value:f.value}]});
  if(topic&&seen.has(topic))add('EQUIVALENT_DECISION_TOPIC',`Entscheidungsthema bereits in Hinweis ${seen.get(topic)+1} behandelt.`);
  else if(topic)seen.set(topic,index);
  const c=norm(f.consequence),category=categoryOf(data);
  if(/filter verbessern die wasser|batterien oder notstrom ueberbruecken|die kontrolle beschraenkt sich auf statusmeldungen|edelstahl nimmt gerueche|keramik ist schwer und standfest/.test(c))add('UNSUPPORTED_GENERALIZATION','Die Konsequenz behauptet eine Funktion oder Materialwirkung, die aus dem einzelnen angegebenen Wert nicht folgt.');
  if(/^(?:das gewicht beeinflusst|die masse sollten|die angabe zeigt|geraeusche koennen|die schutzklasse ist besonders)/.test(c))add('GENERIC_CONSEQUENCE','Die Konsequenz nennt allgemeine Relevanz, aber keine konkrete Auswahlgrenze oder Handlung.');
  if(/brunnen/.test(category)&&/futterdichte|portion|mahlzeit/.test(c)||/gps|tracker/.test(category)&&/nachgefuellt|nachfuellen|stellplatz/.test(c))add('WRONG_DECISION_CONTEXT','Die Konsequenz verwendet den Kontext einer anderen Produktart.');
  return {...row,topic,issues,automatedResult:issues.length?'needs-review':'no-rule-findings'};
 });
}
