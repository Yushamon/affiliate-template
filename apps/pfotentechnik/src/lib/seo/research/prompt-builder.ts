type Input={generatedAt:string;clusters:any[];products?:number;manufacturers?:number;comparisons?:number;pages?:number};
export const buildWeeklyResearchPrompt=(input:Input)=>[
"Du führst die wöchentliche externe Research-Runde für PfotenTechnik.de durch.","",
"Untersuche ausschließlich:","1. fehlende eigenständige Themen und Suchintentionen","2. neue oder wesentlich aktualisierte Produkte","3. relevante Hersteller oder Sortimentserweiterungen","4. konkrete Refresh-Chancen für bestehende Inhalte","",
"Für neue Produkte prüfen: offizieller Name, Modellkennung, Hersteller-Primärquelle, Markteinführung, Nachfolger/Variante, Relevanz für bestehende Vergleiche. Keine Farbvarianten oder Marketplace-Dubletten.","",
"Regeln: Keine Themen nur aus Keyword-Nähe ableiten. Prüfe zuerst, ob ein Abschnitt auf einer bestehenden Seite besser ist. Keine Verkaufszahlen aus Marktsignalen ableiten. Jede Empfehlung braucht mindestens einen konkreten Beleg.","",
`Repository-Stand: ${input.generatedAt}`,
`Bestand: ${input.pages??0} Ratgeber/Hubs, ${input.comparisons??0} Vergleiche, ${input.products??0} Produkte, ${input.manufacturers??0} Hersteller.`,"",
"Clusterstruktur:",JSON.stringify(input.clusters.map(c=>({id:c.id,label:c.label,score:c.score,status:c.status,gaps:c.gaps??[],counts:c.counts??{},routes:(c.documents??[]).slice(0,40).map((d:any)=>({type:d.type,title:d.title,route:d.route}))})),null,2),"",
"Gib ausschließlich valides JSON zurück. Kein Markdown.",
JSON.stringify({version:1,updatedAt:"ISO-8601",provider:"manual-chatgpt",scope:["Cluster"],items:[{id:"stabile-kebab-case-id",type:"topic | product | manufacturer | content-refresh",title:"konkreter Vorschlag",slug:"optional",manufacturer:"optional",category:"optional",intent:"optional",status:"open",priority:0,confidence:0,reason:"konkrete Begründung",repositoryMatch:{exists:false,route:"optional",file:"optional",similarRoutes:[]},actions:[{type:"create-page | update-page | create-product | update-product | update-manufacturer | update-comparison | add-internal-links | manual-review",target:"Route, Slug oder Datei",reason:"warum"}],evidence:[{source:"Quelle",url:"https://...",note:"welche Aussage",accessedAt:"ISO-8601"}],discoveredAt:"ISO-8601",lastConfirmedAt:"ISO-8601"}]},null,2)
].join("\n");
