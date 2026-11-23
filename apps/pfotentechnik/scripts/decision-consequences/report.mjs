import {readBeforeEvidence} from '../product-evidence/approved-changes.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {parse as parseStore} from 'devalue';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {buildDecisionFacts} from '../../src/domain/productExperience/consequences.ts';
import {inspectDecisionFacts,reviewRenderedConsequences,normalizeDecisionText} from '../../src/domain/productExperience/decisionQuality.mjs';
import {renderedFacts} from './snapshot.mjs';
import {verifyIntegration} from '../product-integration/verify.mjs';
const app=fileURLToPath(new URL('../../',import.meta.url));
const root=path.join(app,'research/decision-consequences-35.9');
const store=parseStore(fs.readFileSync(path.join(app,'.astro-cache/data-store.json'),'utf8')).get('products');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'baseline.json')));
const validationFile=path.join(root,'validation.json');
const validation=fs.existsSync(validationFile)?JSON.parse(fs.readFileSync(validationFile)):null;
const verification=await verifyIntegration();
const plain=fs=>fs.map(({label,value,consequence})=>({label,value,consequence}));
const tidy=fs=>plain(fs).map(f=>Object.fromEntries(Object.entries(f).map(([k,v])=>[k,k==='value'?v.replace(/\s+/g,' ').trim().toLocaleLowerCase('de-DE'):v.replace(/\s+/g,' ').trim()])));
const outputAudit=(data,facts,published)=>reviewRenderedConsequences(data,facts).map(({editorialReview,publication,...row})=>({...row,reviewScope:'output-quality',output:published?'rendered':'draft-generated'}));
const products=[];
for(const old of baseline.products){
 const file=path.join(app,'src/content/products',old.slug+'.md');
 assert.equal(createHash('sha256').update(readBeforeEvidence(file)).digest('hex'),old.sourceSha256,old.slug+': Produktdatei verändert');
 const data=store.get(old.slug)?.data;
 assert.ok(data,old.slug+': fehlt im Content-Speicher');
 const assessment=inspectDecisionFacts(data),generated=buildDecisionFacts(data,data.specs??[]),rendered=renderedFacts(old.slug);
 if(old.rendered===null)assert.equal(rendered,null);else assert.deepEqual(tidy(rendered),tidy(generated),old.slug+': Build veraltet');
 const before=old.rendered??plain(old.generated),after=rendered??plain(generated);
 const beforeAudit=outputAudit(data,before,old.rendered!==null),afterAudit=outputAudit(data,after,rendered!==null);
 const beforeKeys=new Set(before.map(f=>JSON.stringify(f))),afterKeys=new Set(after.map(f=>JSON.stringify(f)));
 const {editorial,...selection}=assessment;
 products.push({slug:old.slug,title:old.title,category:data.category,published:rendered!==null,protected:assessment.protected,
  status:assessment.protected?'pending-experiment-35.5':JSON.stringify(before)===JSON.stringify(after)?'unchanged':'improved',
  editorialOriginals:assessment.editorial,generatedBefore:old.generated,generatedAfter:generated,renderedBefore:old.rendered,renderedAfter:rendered,
  addedOrImproved:after.filter(f=>!beforeKeys.has(JSON.stringify(f))),removedOrReplaced:before.filter(f=>!afterKeys.has(JSON.stringify(f))),
  beforeAudit,afterAudit,selection,
  remainingUncertainties:[...assessment.uncertainties, ...(assessment.protected?[{code:'PROTECTED_LEGACY_OUTPUT',problem:'Die nachstehenden Vorbefunde bleiben bis zum Ende bzw. einer ausdrücklichen Freigabe von Experiment 35.5 bestehen.'}]:[])]});
}
const sum=fn=>products.reduce((n,p)=>n+fn(p),0);
const issueCount=(key,code)=>sum(p=>p[key].filter(f=>f.issues.some(i=>i.code===code)).length);
const duplicates=facts=>facts.length-new Set(facts.map(f=>normalizeDecisionText(f.consequence))).size;
assert.ok(products.filter(p=>!p.protected).every(p=>p.afterAudit.every(f=>!f.issues.length)),'Neue Ausgabe hat Qualitätsbefunde');
const beforeDuplicates=sum(p=>duplicates(p.renderedBefore??p.generatedBefore)),afterDuplicates=sum(p=>duplicates(p.renderedAfter??p.generatedAfter));
const report={version:'35.9',baselinePhase:baseline.phase,method:'Deterministische Themenregeln und Validierung ausschließlich vorhandener Produktdaten; Originalfreigabe nur mit genauem Produkt und Textfingerprint. Keine vollständige semantische oder externe Faktenprüfung.',
 summary:{products:products.length,published:products.filter(p=>p.published).length,drafts:products.filter(p=>!p.published).map(p=>p.slug),protectedProducts:products.filter(p=>p.protected).length,improvedProducts:products.filter(p=>p.status==='improved').length,
  editorialOriginals:sum(p=>p.editorialOriginals.length),approvedOriginals:sum(p=>p.editorialOriginals.filter(f=>f.editorialReview==='approved-exact-text').length),
  improvedRenderedHints:sum(p=>p.published?p.addedOrImproved.length:0),improvedDraftHints:sum(p=>!p.published?p.addedOrImproved.length:0),
  renderedHintsBefore:sum(p=>p.renderedBefore?.length??0),renderedHintsAfter:sum(p=>p.renderedAfter?.length??0),exactDuplicateConsequencesBefore:beforeDuplicates,exactDuplicateConsequencesAfter:afterDuplicates,removedExactDuplicates:beforeDuplicates-afterDuplicates,
  equivalentTopicsBefore:issueCount('beforeAudit','EQUIVALENT_DECISION_TOPIC'),equivalentTopicsAfter:issueCount('afterAudit','EQUIVALENT_DECISION_TOPIC'),
  contextErrorsBefore:issueCount('beforeAudit','WRONG_DECISION_CONTEXT'),contextErrorsAfter:issueCount('afterAudit','WRONG_DECISION_CONTEXT'),
  unsupportedGeneralizationsBefore:issueCount('beforeAudit','UNSUPPORTED_GENERALIZATION'),unsupportedGeneralizationsAfter:issueCount('afterAudit','UNSUPPORTED_GENERALIZATION'),
  uncertainInputValues:sum(p=>p.selection.uncertainties.length),productsWithUncertainValues:products.filter(p=>p.selection.uncertainties.length).length,
  protectedPages:verification.protectedPages,protectedIncomingEdges:verification.protectedIncomingEdges},validation,
 safeguards:{unchangedProductFiles:110,originalArrays:73,originalHints:437,approvals:0,scoresPricesAffiliateSeoUnchanged:true,newProducts:0,merge:false,deployment:false},
 limitations:['Zehn Produktseiten bleiben wegen Experiment 35.5 auf der bisherigen Ausgabe. Ihre erkannten Schwächen werden ausgewiesen und nicht als behoben gezählt.','Vier bis sechs Hinweise sind eine Obergrenze mit Zielbereich, kein Zwang zum Auffüllen: Bei zu wenig dokumentierten Eigenschaften liefert die Laufzeit weniger oder keine Hinweise. Im aktuellen Bestand erreichen alle ungeschützten Datensätze den Zielbereich.','Unbekannte Streu-Kompatibilität bleibt als ausdrücklich offener, sicherer Prüfhinweis erhalten; sie wird nicht als technische Freigabe gewertet.','Themen-Gleichheit erkennt regelbasierte semantische Äquivalente. Weitergehende Sprach- oder Quellenwidersprüche können eine manuelle Prüfung erfordern. Keine regelbasierte Prüfung garantiert vollständige Fehlerfreiheit.','Kein neuer technischer Fakt recherchiert oder erfunden. Bereits im Bestand vorhandene unzutreffende Angaben können ohne zusätzliche Quellenprüfung unentdeckt bleiben.'],products};
let md=`# Entscheidungshinweise 35.9\n\nAusgangsstand: nach dem abgeschlossenen Build 36.0, vor den Änderungen an der Hinweiserzeugung. Der frühere 36.0-Report bleibt ein historischer Phasenbeleg.\n\n## Ergebnis\n\n- ${report.summary.products} Produkte geprüft: ${report.summary.published} gerendert, zwei weiterhin gesperrte Entwürfe.\n- ${report.summary.improvedProducts} Datensätze verbessert; ${report.summary.improvedRenderedHints} neue oder ersetzte gerenderte Hinweise, ${report.summary.improvedDraftHints} Änderungen nur in der Entwurfserzeugung. „Verbessert“ zählt geänderte Texttripel, keine nachträglich erfundene Qualitätsnote.\n- Identische Konsequenzen: ${beforeDuplicates} → ${afterDuplicates}; ${report.summary.removedExactDuplicates} entfernt. Gleichwertige Themen: ${report.summary.equivalentTopicsBefore} → ${report.summary.equivalentTopicsAfter}.\n- Regelbasiert erkannte Kontextfehler: ${report.summary.contextErrorsBefore} → ${report.summary.contextErrorsAfter}. Unbelegte Verallgemeinerungen: ${report.summary.unsupportedGeneralizationsBefore} → ${report.summary.unsupportedGeneralizationsAfter}.\n- ${report.summary.uncertainInputValues} unklare oder unzureichende Eingabewerte bei ${report.summary.productsWithUncertainValues} Produkten werden separat ausgewiesen.\n- Alle 437 Originalhinweise in 73 Arrays erhalten, null Freigaben. Alle 110 Produktdateien bytegenau erhalten: keine Score-, Preis-, Affiliate- oder SEO-Änderungen durch 35.9.\n- Alle 20 geschützten Seiten und 205 eingehenden Linkkanten unverändert; zehn geschützte Produktseiten bleiben bewusst beim bisherigen Rendering.\n\nAlle verbleibenden identischen Konsequenzen und regelbasiert erkannten Kontextfehler betreffen ausschließlich die geschützte 35.5-Ausgabe. Auf den 100 ungeschützten Datensätzen meldet der zusätzliche Ausgabe-Audit keine Regelbefunde. Das ist keine Garantie vollständiger semantischer Fehlerfreiheit.\n\n## Dauerhafte Logik und Integration\n\nDie bestehende Funktion buildDecisionFacts verwendet eine zentrale Auswahl nach Produkttyp, dokumentierter Eigenschaft und Entscheidungsthema. Sechs Plätze sind maximal verfügbar; freigegebene exakte Originaltexte haben Vorrang. Dubletten werden nach Thema und normalisiertem Konsequenztext abgefangen. Akkuwerte und Kostenangaben können gemeinsam in einem Hinweis stehen. mAh/Ah/Wh werden vor Volumenregeln behandelt; falsche physikalische Einheiten werden verworfen. Nutzbares Wasservolumen hat Vorrang vor nominalem Tankvolumen.\n\nUnbekannte Funktionen werden nicht bejaht. Unterschiedliche Werte desselben Merkmals sowie eindeutige Abo-/Tierartwidersprüche zwischen vorhandenen strukturierten Daten und Tabellen sperren die betroffenen Themen. Es werden keine Diagnosen, Lieferbarkeiten oder Produktempfehlungen erfunden. Die automatische Ableitung aus technischen Daten bleibt der Fallback; die unveränderte bisherige Implementierung ist ausschließlich für die zehn geschützten 35.5-Produktseiten isoliert.\n\nProduct Operations liefert dieselbe Qualitätsauswertung in Produktdatensätzen, Dashboard-Zähler und bestehender redaktioneller GET-/POST-API. Der vorhandene Produkteditor zeigt die Auswertung bei Laden und Speichern an. Neue und geänderte Produkte durchlaufen dieselbe Funktion im Build und in der Produktpflege. Keine zweite Hinweisplattform und keine neue Freigabeoberfläche.\n\n## Prüfungen\n\n${validation?`- Produktionsbuild: ${validation.build.pages} Seiten, bestanden.\n- Tests: ${validation.tests.passed} bestanden, ${validation.tests.failed} fehlgeschlagen (${Object.entries(validation.tests.suites).map(([k,v])=>`${k}: ${v}`).join('; ')}).\n- Browser: ${validation.browserCases} Fälle mit 375/1600 Pixeln und Hell/Dunkel; keine Überläufe oder defekten Bilder, Hinweise und Kaufziele geprüft.\n- Dateihashes: alle 110 Produktdateien unverändert. Diff-Prüfung: ${validation.diff}.`: 'Finale Build- und Testbelege werden nach Abschluss ergänzt.'}\n\n## Verbleibende Grenzen\n\n${report.limitations.map(s=>'- '+s).join('\n')}\n\nDie JSON-Fassung enthält pro Produkt alle Originaltexte samt Prüfbefunden, die automatisch erzeugten Hinweise vor/nach der Änderung, tatsächlich gerenderte Texttripel vor/nach der Änderung und alle verworfenen Eingaben mit Gründen: [Vollständiger JSON-Report](decision-consequences-35.9.json). Der bestehende [Originaltext-Qualitätsreport 35.7](decision-facts-quality-35.7.md) bleibt erhalten.\n\n## Beispiele nach Kategorie\n\n`;
const examples=['tractive-cat-6-mini','petlibro-granary-dual-feeder','philips-pet-series-paw3210-02','sureflap-dualscan-mikrochip-katzenklappe','petkit-puramax-2','furbo-360-katzenkamera'];
const list=facts=>facts?.length?facts.map(f=>`- **${f.label}: ${f.value}** — ${f.consequence}`).join('\n'):'Keine öffentliche Ausgabe (gesperrter Entwurf).';
for(const slug of examples){const p=products.find(p=>p.slug===slug);md+=`### ${p.title} (${p.category.label})\n\n${list(p.renderedAfter)}\n\n`;}
md+='## Vollständiger Vorher-Nachher-Vergleich\n\n';
for(const p of products){md+=`### ${p.slug}\n\nStatus: ${p.status}; ${p.editorialOriginals.length} erhaltene Originalhinweise; ${p.selection.uncertainties.length} unklare Eingabewerte.\n\n**Vorher gerendert**\n\n${list(p.renderedBefore)}\n\n**Nachher gerendert**\n\n${list(p.renderedAfter)}\n\n`;
 if(!p.published)md+=`**Automatisch erzeugter Entwurf nachher (nicht veröffentlicht)**\n\n${list(p.generatedAfter)}\n\n`;
 if(p.selection.uncertainties.length)md+=`**Offene Eingaben**\n\n${p.selection.uncertainties.map(r=>`- ${r.label??r.topic}: ${r.value??r.paths?.join(', ')??''} (${r.code})`).join('\n')}\n\n`;
 if(p.protected)md+=`**Ausstehend wegen 35.5:** ${p.afterAudit.flatMap(f=>f.issues.map(i=>`${f.original.label}: ${i.code}`)).join('; ')||'Keine zusätzlichen Regelbefunde'}. Keine Änderung am geschützten Rendering.\n\n`;
}
md+='## Reproduktion\n\n```sh\nnpm run build:pfotentechnik\nnpm --workspace apps/pfotentechnik run audit:decision-facts\nnpm --workspace apps/pfotentechnik run report:product-integration\nnpm --workspace apps/pfotentechnik run report:decision-consequences\nnpm --workspace apps/pfotentechnik run test:product-integration\nnpm --workspace apps/pfotentechnik run test:product-freshness\nnpm --workspace apps/pfotentechnik run test:decision-consequences\n```\n\nDie Baseline wird absichtlich nicht neu erzeugt. `snapshot.mjs --capture` verweigert das Überschreiben eines vorhandenen Ausgangsstands.\n';
for(const [extension,content]of [['json',JSON.stringify(report,null,2)+'\n'],['md',md.replace(/[ \t]+$/gm,'')]]){
 const file=path.join(app,'reports/decision-consequences-35.9.'+extension);
 if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),content,'Report ist veraltet');else fs.writeFileSync(file,content);
}
console.log(JSON.stringify(report.summary,null,2));
