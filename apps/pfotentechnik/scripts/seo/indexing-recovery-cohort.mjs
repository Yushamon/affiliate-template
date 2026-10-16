import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
const counts=(rows,key)=>Object.fromEntries([...new Set(rows.map(row=>row[key]??'unknown'))].sort().map(value=>[value,rows.filter(row=>(row[key]??'unknown')===value).length]));
const median=values=>{const v=values.filter(Number.isFinite).sort((a,b)=>a-b);return v.length? v.length%2?v[(v.length-1)/2]:(v[v.length/2-1]+v[v.length/2])/2:null;};
export function writeCrawledCohort({snapshot,repoRoot,outputRoot,candidates}) {
  const members=snapshot.observations.filter(row=>row.status==='crawled-not-indexed').map(row=>{
    const target=snapshot.inventory.find(page=>page.url===(row.inCurrentInventory?row.url:row.targetUrl));
    let data={};
    if(target?.sourceFile?.endsWith('.md')){
      const source=fs.readFileSync(path.join(repoRoot,target.sourceFile),'utf8');
      const match=source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);if(match)data=yaml.load(match[1])??{};
    }
    return {...row,exactCurrentCanonical:row.inCurrentInventory,analysisTarget:target?.url??null,
      // Target characteristics describe the current document, never its Google index status.
      currentDocument:target?{pageType:target.pageType,cluster:target.cluster,primaryIntent:target.primaryIntent,intentSubject:target.intentSubject,
        incomingLinks:target.incomingLinks,contextualIncoming:target.contextualIncoming,clickDepth:target.clickDepth,wordCount:target.wordCount,
        headings:target.headings,schemaTypes:target.schemaTypes,sourceFile:target.sourceFile,overlaps:target.overlaps,
        testStatus:data.testStatus??null,ownHandsOn:data.editorial?.testedHandsOn??null,
        editorialMethodology:data.experience?.methodology??null,editorialReviewedAt:data.editorial?.lastVerifiedAt??null}:null};
  });
  const canonical=members.filter(row=>row.exactCurrentCanonical).map(row=>row.currentDocument);
  const rawCrawls=members.flatMap(row=>row.observations.map(obs=>({url:row.url,raw:obs.lastCrawledRaw,source:obs.source})));
  const product=canonical.filter(row=>row.pageType==='product');
  const findEvidence = directory => !fs.existsSync(directory) ? [] : fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    const file=path.join(directory,entry.name);return entry.isDirectory()?findEvidence(file):/googlebot|url[-_]?inspection|access[._-]log|crawl[-_]?stats/i.test(entry.name)?[path.relative(repoRoot,file)]:[];
  });
  const evidenceFiles=[...findEvidence(path.join(repoRoot,'apps/pfotentechnik/reports')),...findEvidence(path.join(repoRoot,'apps/pfotentechnik/src/data'))];
  const summary={exactExportUrls:members.length,exactCurrentCanonicals:canonical.length,urlVariants:members.length-canonical.length,
    byExactExportPageType:counts(members,'pageType'),byCanonicalPageType:counts(canonical,'pageType'),byCanonicalCluster:counts(canonical,'cluster'),
    canonicalClickDepth:counts(canonical,'clickDepth'),canonicalMedianIncoming:median(canonical.map(row=>row.incomingLinks)),canonicalMedianWords:median(canonical.map(row=>row.wordCount)),
    canonicalLowIncoming:members.filter(row=>row.exactCurrentCanonical&&row.currentDocument.incomingLinks<=2).map(row=>({url:row.url,incomingLinks:row.currentDocument.incomingLinks})),
    canonicalProductTestStatus:counts(product,'testStatus'),canonicalProductsOwnHandsOn:counts(product,'ownHandsOn'),
    duplicateFindings:snapshot.summary.duplicateFindings,
    comparisonCandidates:candidates.filter(pair=>members.some(row=>row.exactCurrentCanonical&&(row.url.endsWith(pair.a)||row.url.endsWith(pair.b)))).slice(0,20),
    evidenceFileCandidates:evidenceFiles,
    dataLimitations:{serverGooglebotLogs:evidenceFiles.length ? 'Mögliche Evidenzdateien vorhanden; Dateiname allein belegt keinen verifizierten Googlebot.' : 'Keine Repository-Dateien mit tatsächlichen Server-Zugriffen von verifiziertem Googlebot gefunden.',urlInspectionResults:evidenceFiles.length ? 'Mögliche Evidenzdateien vorhanden; für Google-Canonical-Entscheidungen Inhaltsprüfung erforderlich.' : 'Keine URL-Inspection-Ergebnisse oder Google-Canonical-Entscheidungen im Repository gefunden.',httpObservations:'Vorhanden, aber eigener Audit-User-Agent; weder Googlebot-Protokoll noch URL-Inspection.',lastCrawled:`${rawCrawls.length} Export-Rohwerte vorhanden. Fehlende Excel-Dateisystemmetadaten im Legacy-Import verhindern eine verifizierte ISO-Crawlzeit; Metadaten neuer Importe werden separat bewahrt. Kein Beleg eines Crawls der aktuell geänderten Version.`,indexedControlCohort:'Kein aktueller Indexiert-/Inspection-Export. Andere URLs sind discovered oder unknown; keine belegte positive Kontrollgruppe.',causalAttribution:'Keine Serverversion je Google-Crawl, kein Nachher-Export, keine Crawlstatistik, kein externer Qualitäts-/Linkvergleich.'}};
  fs.writeFileSync(path.join(outputRoot,'crawled-cohort.json'),JSON.stringify({summary,rawCrawls,members},null,2)+'\n');
  fs.writeFileSync(path.join(outputRoot,'crawled-urls.md'),`# ${members.length} URLs: gecrawlt, zurzeit nicht indexiert\n\nExakte Export-URLs, einschließlich Varianten. Der Zielinhalt und sein Exportstatus werden getrennt behandelt. Aktuelle Ziel-Merkmale sind keine behaupteten Google-Merkmale oder Indexierungsentscheidungen.\n\n| Export-URL | Aktuelle kanonische URL? | Aktueller Dokumenttyp / Cluster | Eingehende Quellseiten / Tiefe | Suchintention | Überschneidungen (Kandidaten) |\n| --- | --- | --- | --- | --- | --- |\n`+members.map(row=>`| ${row.url} | ${row.exactCurrentCanonical?'ja':'nein; Ziel: '+row.analysisTarget} | ${row.currentDocument?.pageType??'unbekannt'} / ${row.currentDocument?.cluster??'unbekannt'} | ${row.currentDocument?.incomingLinks??'unbekannt'} / ${row.currentDocument?.clickDepth??'unbekannt'} | ${row.currentDocument?.primaryIntent??'unbekannt'}: ${row.currentDocument?.intentSubject??''} | ${(row.currentDocument?.overlaps??[]).map(pair=>pair.route+' ('+pair.score+')').join('; ')||'kein algorithmischer Kandidat; kein Beweis der Eigenständigkeit'} |`).join('\n')+'\n');
  const config=JSON.parse(fs.readFileSync(path.join(repoRoot,'apps/pfotentechnik/scripts/seo/indexing-recovery-experiment.json'),'utf8'));
  const plan=config.map((item,index)=>{
    const page=snapshot.inventory.find(page=>page.route===item.route);
    return {priority:index+1,...item,url:page?.url??'https://pfotentechnik.de'+item.route,
      status:page?.googleStatus??'unknown',memberOfCurrentCrawledCohort:!!page&&members.some(row=>row.url===page.url),
      incomingLinks:page?.incomingLinks??null,clickDepth:page?.clickDepth??null,
      baselineGoogleCanonical:null,baselineInspectionVerdict:null,verifiedGooglebotLastVisit:null,
      automaticAction:false};
  });
  fs.writeFileSync(path.join(outputRoot,'experiment-plan.json'),JSON.stringify({notice:'Vorschlag: keine Inspection oder Indexierungsanforderung automatisch ausgeführt. Vier Anfragefälle und acht Beobachtungsfälle sind eine explorative Auswahl, keine randomisierte kausale Studie.',urls:plan},null,2)+'\n');
  fs.writeFileSync(path.join(outputRoot,'experiment-plan.md'),'# Kontrollierter Indexierungsversuch: 12 URLs\n\nAlle Ausgangsziele sind exakte kanonische Mitglieder des 84er-Exports. Für spätere Exporte zeigt memberOfCurrentCrawledCohort in der JSON-Datei, ob dies noch gilt. Keine Anforderung wurde ausgeführt.\n\n| Priorität | URL / Gruppe | Konkreter Ausgangsbefund | Vorgeschlagene Maßnahme |\n| --- | --- | --- | --- |\n'+plan.map(row=>`| ${row.priority} | ${row.url}<br>${row.arm==='request'?'einmalige Anforderung nach Inspection':'unverändert beobachten'} | ${row.finding} | ${row.action} |`).join('\n')+'\n');
  fs.writeFileSync(path.join(outputRoot,'experiment-observations-template.csv'),'round,URL,arm,observedAt,Status,inspectionVerdict,googleCanonical,userCanonical,lastCrawlTime,liveFetchState,renderedVersion,requestSubmittedAt,verifiedGooglebotVisit,notes\n'+plan.map(row=>['T0',row.url,row.arm,...Array(11).fill('')].join(',')).join('\n')+'\n');
  return summary;
}
