export type FunnelStage="orientation"|"education"|"problem"|"comparison"|"product"|"manufacturer";
export type IntentOwner={id:string;clusterId:string;route:string;label:string;primaryIntent:string;secondaryIntents:string[];funnelStage:FunnelStage;owns:string[];mustNotOwn:string[];preferredTargets:string[]};
export type IntentDocument={route:string;title?:string;type?:string;links?:string[]};
export type IntentConflict={intent:string;ownerRoute:string;conflictingRoutes:string[]};
export type IntentOwnershipResult={clusterId:string;applicable:boolean;owners:IntentOwner[];conflicts:IntentConflict[];missingOwners:string[];coveredIntents:number;totalIntents:number;complete:boolean};

const FEEDER_OWNERS:IntentOwner[]=[
{id:"feeder-cornerstone",clusterId:"futterautomaten",route:"/smarte-futterautomaten/",label:"Cornerstone-Hub",primaryIntent:"Futterautomaten verstehen und Auswahlwege überblicken",secondaryIntents:["Gerätetypen","Kaufkriterien","Funnel-Einstieg"],funnelStage:"orientation",owns:["Überblick","Gerätetypen","Kaufkriterien","Cluster-Navigation"],mustNotOwn:["Produktsieger","detaillierte Vergleichsmatrix","einzelnes Nutzungsszenario"],preferredTargets:["/welcher-futterautomat-ist-der-richtige/","/vergleiche/beste-futterautomaten-fuer-katzen/","/vergleiche/beste-futterautomaten-fuer-hunde/","/vergleiche/beste-futterautomaten-fuer-nassfutter/"]},
{id:"feeder-decision-hub",clusterId:"futterautomaten",route:"/welcher-futterautomat-ist-der-richtige/",label:"Auswahlhilfe",primaryIntent:"Passenden Vergleich aus Tier, Futterart und Nutzungssituation ableiten",secondaryIntents:["Tierart","Tierzahl","Futterart","Strom","App","Kamera","Budget"],funnelStage:"orientation",owns:["Entscheidungsbaum","Vergleichs-Routing","Szenarioauswahl"],mustNotOwn:["vollständige Produktmatrix","allgemeine Funktionsgrundlagen"],preferredTargets:["/vergleiche/beste-futterautomaten-fuer-berufstaetige/","/vergleiche/beste-futterautomaten-fuer-katzen/","/vergleiche/beste-futterautomaten-fuer-hunde/","/vergleiche/beste-futterautomaten-fuer-nassfutter/","/vergleiche/beste-futterautomaten-fuer-zwei-katzen/","/vergleiche/beste-futterautomaten-mit-akku/","/vergleiche/beste-futterautomaten-mit-kamera/","/vergleiche/beste-futterautomaten-ohne-wlan/","/vergleiche/futterautomat-mit-app/"]},
{id:"feeder-foundations",clusterId:"futterautomaten",route:"/wie-funktioniert-ein-futterautomat/",label:"Grundlagenratgeber",primaryIntent:"Funktionsweise und Bauarten verstehen",secondaryIntents:["Portionierung","Mechanik","Stromversorgung"],funnelStage:"education",owns:["Funktionsweise","Grundbegriffe","technische Grenzen"],mustNotOwn:["Kaufvergleich","Produktsieger"],preferredTargets:["/welcher-futterautomat-ist-der-richtige/","/smarte-futterautomaten/"]},
{id:"feeder-cat-comparison",clusterId:"futterautomaten",route:"/vergleiche/beste-futterautomaten-fuer-katzen/",label:"Katzen-Allround-Vergleich",primaryIntent:"Futterautomaten für Katzen modellbezogen vergleichen",secondaryIntents:["Portionierung","Trockenfutter","Alltag"],funnelStage:"comparison",owns:["Katzen-Allround-Auswahl"],mustNotOwn:["Mehrkatzen-Spezialfall","Nassfutter-Spezialfall","Senioren-Spezialfall"],preferredTargets:[]},
{id:"feeder-dog-comparison",clusterId:"futterautomaten",route:"/vergleiche/beste-futterautomaten-fuer-hunde/",label:"Hunde-Allround-Vergleich",primaryIntent:"Futterautomaten für Hunde modellbezogen vergleichen",secondaryIntents:["Kapazität","Portionierung","Alltag"],funnelStage:"comparison",owns:["Hunde-Allround-Auswahl"],mustNotOwn:["kleine Hunde","große Hunde","Welpen","Schlingen"],preferredTargets:[]},
{id:"feeder-wet-comparison",clusterId:"futterautomaten",route:"/vergleiche/beste-futterautomaten-fuer-nassfutter/",label:"Nassfutter-Vergleich",primaryIntent:"Nassfutterautomaten nach Kühlung und Fächern vergleichen",secondaryIntents:["Hygiene","Kühlung","Mahlzeitenfächer"],funnelStage:"comparison",owns:["Nassfutter-Auswahl"],mustNotOwn:["Trockenfutter-Allround-Auswahl"],preferredTargets:["/futterautomat-richtig-reinigen/","/trockenfutter-oder-nassfutter-katze/","/trockenfutter-oder-nassfutter-hund/"]},
{id:"feeder-multi-pet-comparison",clusterId:"futterautomaten",route:"/vergleiche/beste-futterautomaten-fuer-mehrtierhaushalte/",label:"Mehrtier-Vergleich",primaryIntent:"Zugriff und Rationstrennung im Mehrtierhaushalt vergleichen",secondaryIntents:["RFID","Mikrochip","Futterneid"],funnelStage:"comparison",owns:["Mehrtierhaushalt allgemein","Zugriffsschutz"],mustNotOwn:["zwei Katzen ohne Zugriffskonflikt"],preferredTargets:["/produkt/surefeed-microchip-pet-feeder/","/produkt/surefeed-microchip-pet-feeder-connect/","/hersteller/surefeed/"]}
];
const norm=(v:string)=>{const x=String(v??"").trim().split("#",1)[0]?.split("?",1)[0]??"";return x.startsWith("/")&&!x.endsWith("/")?`${x}/`:x};
export const getIntentOwners=(clusterId:string)=>clusterId==="futterautomaten"?FEEDER_OWNERS:[];
export function evaluateIntentOwnership(clusterId:string,documents:IntentDocument[]):IntentOwnershipResult{
 const owners=getIntentOwners(clusterId);
 if(!owners.length)return{clusterId,applicable:false,owners:[],conflicts:[],missingOwners:[],coveredIntents:0,totalIntents:0,complete:false};
 const routes=new Set(documents.map(x=>norm(x.route)).filter(Boolean));
 const missingOwners=owners.filter(x=>!routes.has(norm(x.route))).map(x=>x.route);
 const map=new Map<string,IntentOwner[]>();
 for(const owner of owners)for(const i of owner.owns)map.set(i,[...(map.get(i)??[]),owner]);
 const conflicts=[...map].filter(([,v])=>v.length>1).map(([intent,v])=>({intent,ownerRoute:v[0].route,conflictingRoutes:v.slice(1).map(x=>x.route)}));
 return{clusterId,applicable:true,owners,conflicts,missingOwners,coveredIntents:owners.length-missingOwners.length,totalIntents:owners.length,complete:!missingOwners.length&&!conflicts.length};
}
export function intentOwnershipReason(result:IntentOwnershipResult|undefined,fallback:string){
 if(!result?.applicable)return fallback;
 if(result.missingOwners.length)return`Intent-Owner fehlen im Repository: ${result.missingOwners.join(", ")}.`;
 if(result.conflicts.length)return`Mehrfach belegte Intents: ${result.conflicts.map(x=>x.intent).join(", ")}.`;
 return`${result.coveredIntents}/${result.totalIntents} zentrale Intent-Owner sind vorhanden; Konsolidierung und Journey bleiben vor Seitenausbau priorisiert.`;
}
