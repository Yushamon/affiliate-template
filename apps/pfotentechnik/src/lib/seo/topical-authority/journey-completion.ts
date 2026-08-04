export type JourneyDocument={route:string;links:string[]};
export type JourneyRequirement={id:string;source:string;target:string;label:string};
export type JourneyCompletion={clusterId:string;applicable:boolean;complete:boolean;completedEdges:string[];missingEdges:string[];requiredEdges:number;completedCount:number};
const REQUIREMENTS:Record<string,JourneyRequirement[]>={
futterautomaten:[
{id:"hub-to-decision",source:"/smarte-futterautomaten/",target:"/welcher-futterautomat-ist-der-richtige/",label:"Cornerstone → Auswahlhilfe"},
{id:"decision-to-cat",source:"/welcher-futterautomat-ist-der-richtige/",target:"/vergleiche/beste-futterautomaten-fuer-katzen/",label:"Auswahlhilfe → Katzenvergleich"},
{id:"decision-to-dog",source:"/welcher-futterautomat-ist-der-richtige/",target:"/vergleiche/beste-futterautomaten-fuer-hunde/",label:"Auswahlhilfe → Hundevergleich"},
{id:"decision-to-wet",source:"/welcher-futterautomat-ist-der-richtige/",target:"/vergleiche/beste-futterautomaten-fuer-nassfutter/",label:"Auswahlhilfe → Nassfuttervergleich"},
{id:"decision-to-battery",source:"/welcher-futterautomat-ist-der-richtige/",target:"/vergleiche/beste-futterautomaten-mit-akku/",label:"Auswahlhilfe → Akkuvergleich"},
{id:"decision-to-offline",source:"/welcher-futterautomat-ist-der-richtige/",target:"/vergleiche/beste-futterautomaten-ohne-wlan/",label:"Auswahlhilfe → Offlinevergleich"},
{id:"decision-to-app",source:"/welcher-futterautomat-ist-der-richtige/",target:"/vergleiche/futterautomat-mit-app/",label:"Auswahlhilfe → App-Vergleich"},
{id:"decision-to-camera",source:"/welcher-futterautomat-ist-der-richtige/",target:"/vergleiche/beste-futterautomaten-mit-kamera/",label:"Auswahlhilfe → Kamera-Vergleich"},
{id:"power-guide-to-battery",source:"/futterautomat-bei-stromausfall/",target:"/vergleiche/beste-futterautomaten-mit-akku/",label:"Stromausfall-Ratgeber → Akkuvergleich"},
{id:"wet-comparison-to-cleaning",source:"/vergleiche/beste-futterautomaten-fuer-nassfutter/",target:"/futterautomat-richtig-reinigen/",label:"Nassfuttervergleich → Reinigungsratgeber"},
{id:"multi-pet-to-surefeed",source:"/vergleiche/beste-futterautomaten-fuer-mehrtierhaushalte/",target:"/hersteller/surefeed/",label:"Mehrtiervergleich → SureFeed"}
],
trinkbrunnen:[
{id:"hub-to-material",source:"/trinkbrunnen/",target:"/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/",label:"Hub → Materialratgeber"},
{id:"hub-to-cleaning",source:"/trinkbrunnen/",target:"/katzentrinkbrunnen-richtig-reinigen/",label:"Hub → Reinigungsratgeber"},
{id:"hub-to-filter",source:"/trinkbrunnen/",target:"/filter-im-katzentrinkbrunnen-wechseln/",label:"Hub → Filterratgeber"},
{id:"hub-to-comparison",source:"/trinkbrunnen/",target:"/vergleiche/beste-trinkbrunnen-fuer-katzen/",label:"Hub → Katzenvergleich"},
{id:"material-to-comparison",source:"/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/",target:"/vergleiche/beste-trinkbrunnen-fuer-katzen/",label:"Materialratgeber → Katzenvergleich"},
{id:"cleaning-to-comparison",source:"/katzentrinkbrunnen-richtig-reinigen/",target:"/vergleiche/beste-trinkbrunnen-fuer-katzen/",label:"Reinigungsratgeber → Katzenvergleich"},
{id:"filter-to-comparison",source:"/filter-im-katzentrinkbrunnen-wechseln/",target:"/vergleiche/beste-trinkbrunnen-fuer-katzen/",label:"Filterratgeber → Katzenvergleich"},
{id:"comparison-to-material",source:"/vergleiche/beste-trinkbrunnen-fuer-katzen/",target:"/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/",label:"Katzenvergleich → Materialratgeber"},
{id:"comparison-to-cleaning",source:"/vergleiche/beste-trinkbrunnen-fuer-katzen/",target:"/katzentrinkbrunnen-richtig-reinigen/",label:"Katzenvergleich → Reinigungsratgeber"},
{id:"comparison-to-filter",source:"/vergleiche/beste-trinkbrunnen-fuer-katzen/",target:"/filter-im-katzentrinkbrunnen-wechseln/",label:"Katzenvergleich → Filterratgeber"}
],
katzenklappen:[
{id:"overview-to-hub",source:"/smarte-haustiertechnik/",target:"/smarte-katzenklappen/",label:"Haustiertechnik → Katzenklappen-Hub"},
{id:"hub-to-sureflap",source:"/smarte-katzenklappen/",target:"/produkt/sureflap-mikrochip-katzenklappe-connect/",label:"Hub → vollständige Mikrochip-Klappe"},
{id:"hub-to-zeromouse",source:"/smarte-katzenklappen/",target:"/produkt/zeromouse-2-0/",label:"Hub → Beuteerkennungs-Nachrüstung"},
{id:"sureflap-to-hub",source:"/produkt/sureflap-mikrochip-katzenklappe-connect/",target:"/smarte-katzenklappen/",label:"Mikrochip-Klappe → Hub"},
{id:"zeromouse-to-hub",source:"/produkt/zeromouse-2-0/",target:"/smarte-katzenklappen/",label:"Nachrüstung → Hub"},
{id:"surefeed-to-hub",source:"/hersteller/surefeed/",target:"/smarte-katzenklappen/",label:"Sure Petcare → Hub"},
{id:"zeromouse-brand-to-hub",source:"/hersteller/zeromouse/",target:"/smarte-katzenklappen/",label:"ZeroMOUSE → Hub"}
]};
const norm=(v:string)=>{const x=String(v??"").trim().split("#",1)[0]?.split("?",1)[0]??"";return x.startsWith("/")&&!x.endsWith("/")?`${x}/`:x};
export const getJourneyRequirements=(clusterId:string)=>REQUIREMENTS[clusterId]??[];
export function evaluateClusterJourney(clusterId:string,documents:JourneyDocument[]):JourneyCompletion{
 const req=getJourneyRequirements(clusterId);if(!req.length)return{clusterId,applicable:false,complete:false,completedEdges:[],missingEdges:[],requiredEdges:0,completedCount:0};
 const graph=new Map<string,Set<string>>();
 for(const d of documents){const route=norm(d.route);if(!route)continue;const targets=graph.get(route)??new Set<string>();for(const l of d.links??[]){const t=norm(l);if(t&&t!==route)targets.add(t)}graph.set(route,targets)}
 const completedEdges:string[]=[],missingEdges:string[]=[];
 for(const r of req)(graph.get(norm(r.source))?.has(norm(r.target))??false?completedEdges:missingEdges).push(r.label);
 return{clusterId,applicable:true,complete:!missingEdges.length,completedEdges,missingEdges,requiredEdges:req.length,completedCount:completedEdges.length};
}
export function journeyOpportunityReason(c:JourneyCompletion|undefined,fallback:string){
 if(!c?.applicable)return fallback;if(c.complete)return`Alle ${c.requiredEdges} kaufnahen Pflichtkanten sind vorhanden.`;
 return`${c.completedCount}/${c.requiredEdges} kaufnahe Pflichtkanten vorhanden. Fehlend: ${c.missingEdges.join(", ")}.`;
}
