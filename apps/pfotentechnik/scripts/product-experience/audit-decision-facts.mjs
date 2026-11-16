import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { parse } from 'devalue';
import yaml from 'js-yaml';
import { decisionFactApprovals, decisionFactFingerprint } from '../../src/domain/productExperience/decisionFactReview.mjs';
import { qualityCheckNames, reviewProductDecisionFacts } from './decision-fact-quality.mjs';

const app = fileURLToPath(new URL('../../', import.meta.url));
const sourceOnly = process.argv.includes('--source-only');
const check = process.argv.includes('--check');
const output = path.join(app, 'reports/decision-facts-quality-35.7');
const hash = source => createHash('sha256').update(source).digest('hex');
const directory = path.join(app, 'src/content/products');
const products = fs.readdirSync(directory).filter(name => /\.mdx?$/.test(name)).sort().map(name => {
  const source = fs.readFileSync(path.join(directory, name), 'utf8');
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`Frontmatter fehlt: ${name}`);
  return { file: `src/content/products/${name}`, sourceHash: hash(source), data: yaml.load(match[1], { schema: yaml.JSON_SCHEMA }) };
}).filter(product => Array.isArray(product.data.decisionFacts) && product.data.decisionFacts.length);

let store;
// astro.config.mjs sets cacheDir to .astro-cache; .astro holds a separate dev store.
if (!sourceOnly) store = parse(fs.readFileSync(path.join(app, '.astro-cache/data-store.json'), 'utf8')).get('products');
const records = products.map(product => ({
  slug: product.data.slug,
  file: product.file,
  sourceHash: product.sourceHash,
  storage: sourceOnly ? 'not-checked' : isDeepStrictEqual(store?.get(product.data.slug)?.data?.decisionFacts, product.data.decisionFacts) ? 'preserved-exactly' : 'missing-or-different',
  facts: reviewProductDecisionFacts(product.data, { approvals: decisionFactApprovals })
}));
const facts = records.flatMap(product => product.facts);
const validKeys = new Set(facts.map(fact => `${fact.slug}:${fact.fingerprint}`));
const orphanedApprovals = decisionFactApprovals.filter(approval => !validKeys.has(`${approval.slug}:${approval.fingerprint}`));
const summary = {
  products: records.length,
  facts: facts.length,
  retainedProducts: records.filter(product => product.storage === 'preserved-exactly').length,
  flaggedFacts: facts.filter(fact => fact.issues.length).length,
  factsWithoutRuleFindings: facts.filter(fact => !fact.issues.length).length,
  approvedFacts: facts.filter(fact => fact.editorialReview === 'approved-exact-text').length,
  unreviewedFacts: facts.filter(fact => fact.editorialReview === 'unreviewed').length,
  orphanedApprovals: orphanedApprovals.length,
  byCheck: Object.fromEntries(qualityCheckNames.map(check => [check, facts.filter(fact => fact.issues.some(issue => issue.check === check)).length])),
  byIssueCode: Object.fromEntries([...new Set(facts.flatMap(fact => fact.issues.map(issue => issue.code)))].sort().map(code => [code, facts.filter(fact => fact.issues.some(issue => issue.code === code)).length]))
};
const report = {
  version: '35.7',
  method: 'Deterministic rules; existing product frontmatter only. No external technical facts. Machine findings never grant publication approval.',
  reproduction: 'npm --workspace apps/pfotentechnik run build && npm --workspace apps/pfotentechnik run audit:decision-facts && npm --workspace apps/pfotentechnik run audit:decision-facts:check',
  approvalsHash: hash(JSON.stringify(decisionFactApprovals)),
  contentStore: '.astro-cache/data-store.json',
  summary,
  orphanedApprovals,
  products: records
};
const encode = value => JSON.stringify(value); // Keep original strings, newlines and Markdown characters unambiguous.
let markdown = `# Redaktionelle Entscheidungshinweise 35.7\n\nDie Schema-Übernahme und die Veröffentlichung sind getrennt. Die Freigabeliste enthält ${summary.approvedFacts} passende Freigaben; ${summary.unreviewedFacts} Hinweise bleiben ungeprüft und gesperrt. Eine regelbasierte Vorprüfung ist keine redaktionelle Freigabe.\n\n## Umfang und Ergebnis\n\n- Produktdateien mit Hinweisen: ${summary.products}\n- Hinweise insgesamt: ${summary.facts}\n- Produkte mit exakt erhaltenen Daten im gebauten Content-Speicher: ${summary.retainedProducts}\n- Hinweise mit Prüfbefund: ${summary.flaggedFacts}\n- Hinweise ohne regelbasierten Befund: ${summary.factsWithoutRuleFindings}\n- Verwaiste Freigaben: ${summary.orphanedApprovals}\n\n`;
for (const [name, count] of Object.entries(summary.byCheck)) markdown += `- ${name}: ${count} Hinweise mit Befund\n`;
markdown += '\nMehrere Prüfungen können denselben Hinweis markieren; die Kategorien sind nicht zu summieren.\n\n';
for (const [code, count] of Object.entries(summary.byIssueCode)) markdown += `- ${code}: ${count} Hinweise\n`;
markdown += `\n## Verfahren und Grenzen\n\nGeprüft wird der Produktionsspeicher .astro-cache/data-store.json gemäß astro.config.mjs. Der separate Entwicklungsdatenspeicher unter .astro ist dafür nicht maßgeblich. Die Schema-Revision in src/content.config.ts sorgt dafür, dass Astro alte, bereits geparste Produkte beim normalen Build neu einliest.\n\nDer Report prüft leere/unvollständige Felder, normalisierte identische Konsequenzen innerhalb eines Produkts, Vorhandenseins- und Mengenabweichungen sowie abweichende Originalwerte zu gleich benannten technischen Merkmalen, positive Funktionsbehauptungen bei unbekannten Angaben und pauschale Vorlagentexte ohne konkrete Einordnung. Themenfremde Hinweise (z. B. Futterportionen bei Wasser) werden zusätzlich markiert.\n\nEin abweichender Wortlaut oder Zahlenwert ist ein Prüfauftrag, kein automatisch bewiesener Sachfehler. Nicht vergleichbare Angaben sind ausdrücklich nicht verifizierbar. Die Regeln verstehen nicht jede freie Formulierung und prüfen nicht sämtliche Aussagen des Fließtexts. Fehlende Befunde bedeuten daher weder sachliche Bestätigung noch Freigabe. Als Evidenz dienen ausschließlich vorhandene specs und passende boolesche comparisonFilters; weitere bestehende Felder und Fließtext können in der anschließenden redaktionellen Prüfung berücksichtigt werden.\n\nOriginaltexte stehen unten als JSON-Strings, damit Zeilenumbrüche und Sonderzeichen unverändert rekonstruierbar bleiben. Fingerabdrücke binden eine spätere Freigabe an das genaue Tripel aus Label, Wert und Konsequenz sowie an den Produkt-Slug. Die Produktdateien werden durch diesen Report nicht umgeschrieben. Bei Teilfreigaben erhalten freigegebene Hinweise Vorrang; übrige Plätze werden mit der automatischen Ableitung aus 35.6 gefüllt.\n\nReproduktion nach dem Build: npm --workspace apps/pfotentechnik run audit:decision-facts. Gegenprüfung ohne Neuschreiben: npm --workspace apps/pfotentechnik run audit:decision-facts:check. --source-only überspringt die Prüfung des gebauten Speichers ausdrücklich. Die Ausgabe enthält keine flüchtigen Zeitstempel.\n\n## Vollständige Einzelbefunde\n\n`;
for (const product of records) {
  markdown += `### ${product.slug}\n\nDatei: ${product.file}\n\nSHA-256: ${product.sourceHash}\n\nContent-Speicher: ${product.storage}\n\n`;
  for (const fact of product.facts) {
    markdown += `#### Hinweis ${fact.position}\n\n- Fingerabdruck: ${fact.fingerprint}\n- Redaktionelle Prüfung: ${fact.editorialReview}\n- Veröffentlichung: ${fact.publication}\n- Automatisches Ergebnis: ${fact.automatedResult}\n- Original Label: ${encode(fact.original.label)}\n- Original Wert: ${encode(fact.original.value)}\n- Original Konsequenz: ${encode(fact.original.consequence)}\n\n`;
    for (const [name, result] of Object.entries(fact.checks)) markdown += `- Prüfung ${name}: ${result.result}\n`;
    markdown += '\n';
    if (!fact.issues.length) markdown += 'Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.\n\n';
    for (const issue of fact.issues) {
      markdown += `- ${issue.code}: ${issue.problem}\n`;
      for (const evidence of issue.evidence) markdown += `  - Vorhandene Evidenz ${evidence.path}: ${encode(evidence.value)}\n`;
    }
    if (fact.issues.length) markdown += '\n';
    if (fact.technicalEvidence.length) markdown += `Technische Vergleichsdaten: ${encode(fact.technicalEvidence)}\n\n`;
  }
}
for (const [extension, content] of [['json', JSON.stringify(report, null, 2) + '\n'], ['md', markdown]]) {
  const file = `${output}.${extension}`;
  if (check) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) throw new Error(`Report nicht reproduzierbar oder veraltet: ${file}`);
  } else fs.writeFileSync(file, content);
}
console.log(JSON.stringify(summary));
if (records.some(product => product.storage === 'missing-or-different') || orphanedApprovals.length) process.exitCode = 1;
