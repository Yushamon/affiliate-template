import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import yaml from 'js-yaml';
import { readProductDocument, updateProductEditorial, updateProductOffer, updateProductPrice } from '../../src/lib/price-intelligence/frontmatter-price.mjs';
import { checkProductPrice } from '../../src/lib/price-intelligence/service.mjs';
import { calculateProductScore } from '../../src/domain/productScore.ts';
import { resolveAmazonProductAffiliate } from '../../../../packages/affiliate-core/src/affiliate/amazon.ts';
import { projectConfig } from '../../src/project.config.ts';
import { isPublishedProduct } from '../../src/domain/productPublication.mjs';

const app = fileURLToPath(new URL('../../', import.meta.url));
const dir = path.join(app, 'research/product-integration-35.8');
const manifest = JSON.parse(await fs.readFile(path.join(dir, 'manifest.json'), 'utf8'));
const hash = source => createHash('sha256').update(source).digest('hex');
const apply = process.argv.includes('--apply');
const refresh = process.argv.includes('--refresh');
const fileFor = slug => path.join(app, 'src/content/products', slug + '.md');
const newerPrice = (current, snapshot) => new Date(current?.checkedAt ?? 0).getTime() > new Date(snapshot?.checkedAt ?? 0).getTime();
const mergeEvidence = (current = [], additions = []) => [...new Map([...current, ...additions].map(source => [JSON.stringify([source.url, source.assertion, source.fields]), source])).values()];
const updatedDate = data => String(data.updatedAt instanceof Date ? data.updatedAt.toISOString() : data.updatedAt ?? '').slice(0, 10) > manifest.asOf ? data.updatedAt : manifest.asOf;

const documents = await Promise.all((await fs.readdir(path.join(app, 'src/content/products'))).filter(name => /\.mdx?$/.test(name)).map(name => readProductDocument(path.join(app, 'src/content/products', name))));
const bySlug = new Map(documents.map(doc => [doc.slug, doc]));

for (const data of manifest.candidates) {
  const provenance = JSON.parse(await fs.readFile(path.join(app, 'src/assets/images/products', data.slug, 'media-provenance-35.8.json'), 'utf8'));
  if (provenance.identity !== manifest.mediaRequests.find(item => item.slug === data.slug)?.identity) throw new Error(`${data.slug}: Bildidentität abweichend.`);
  for (const asset of provenance.assets) {
    const bytes = await fs.readFile(path.join(app, 'src/assets/images/products', data.slug, asset.file));
    if (hash(bytes) !== asset.sha256) throw new Error(`${data.slug}: Bilddatei wurde ohne Herkunftsnachweis geändert.`);
  }
  if (!['draft', 'published'].includes(data.publicationStatus)) throw new Error(`${data.slug}: expliziter Veröffentlichungsstatus fehlt.`);
  if (data.publicationStatus === 'draft' && !data.publicationBlockers.length) throw new Error(`${data.slug}: konkreter Blocker fehlt.`);
  if (data.publicationStatus === 'published' && data.publicationBlockers.length) throw new Error(`${data.slug}: offene Veröffentlichungssperre.`);
  const offer = data.offers?.find(offer => offer.price?.currency === 'EUR' && offer.price.current > 0) ?? data;
  if (offer.price?.currency !== 'EUR' || !(offer.price.current > 0)) throw new Error(`${data.slug}: verifiziertes EUR-Angebot fehlt.`);
  if (data.decisionFacts?.length) throw new Error('Die Charge darf keine ungeprüften decisionFacts aktivieren.');
  if (bySlug.has(data.slug)) {
    const existing = bySlug.get(data.slug).data;
    if (existing.mpn !== data.mpn || existing.publicationStatus !== data.publicationStatus) throw new Error(`${data.slug}: bestehende Identität oder Freigabe prüfen, nicht überschreiben.`);
    continue;
  }
  if (documents.some(doc => doc.data.mpn && doc.data.mpn === data.mpn)) throw new Error(`${data.slug}: Modell bereits unter anderer Route vorhanden.`);
  if (apply) {
    const body = `\n## Einordnung\n\n${data.description}\n\n${data.recommendation}\n\n## Geeignet und ungeeignet\n\n${data.decision.bestFor.join('; ')}. ${data.decision.attention.join('. ')}.\n\n## Bewertung und Grenzen\n\n${data.experience.methodology}\n\n## Folgekosten und Betrieb\n\n${data.category.key === 'gps-tracker' ? 'Ein Mobilfunktarif ist für die Fernortung erforderlich. Empfang, Live-Ortung und Energiesparzonen bestimmen die reale Laufzeit. Rückrufsignale müssen mit dem Tier trainiert werden und bieten keine Ausbruchsicherung.' : 'Trockenfutterreste, Auslass und Napf regelmäßig kontrollieren. Bei mehreren Tieren beweist die Ausgabe oder Tiererkennung nicht, dass nur das vorgesehene Tier frisst. Erweiterte Care- und Cloud-Funktionen sind vom Grundgerät zu trennen; regionale Tarife vor Buchung prüfen.'}\n\n## Alternative Modelle\n\n${data.alternatives.map(slug => `- [${slug}](/produkt/${slug}/)`).join('\n')}\n\n## Quellen und Prüfstand\n\n${data.evidenceSources.map(source => `- [${source.source}](${source.url}): ${source.assertion} Abruf: ${String(source.accessedAt).slice(0, 10)}.`).join('\n')}\n`;
    await fs.writeFile(fileFor(data.slug), '---\n' + yaml.dump(data, { noRefs: true, lineWidth: 110, quotingType: '"' }) + '---\n' + body, { flag: 'wx' });
  }
}

if (apply) {
  for (const update of manifest.relatedUpdates) {
    const before = await readProductDocument(fileFor(update.slug));
    const prior = before.data.offers?.find(offer => offer.id === update.offer.id);
    if (prior?.mappingStatus === 'verified' && prior.expectedSku !== update.offer.expectedSku) throw new Error('Neuere Modellzuordnung nicht überschreiben.');
    await updateProductOffer(fileFor(update.slug), update.offer.id, () => newerPrice(prior?.price, update.offer.price) ? prior : update.offer);
    if (!newerPrice(before.data.price, update.offer.price)) await updateProductPrice(fileFor(update.slug), update.offer.price, { affiliateUrl: update.offer.officialProductUrl, syncAffiliateUrl: true, now: update.offer.price.checkedAt });
    const doc = await readProductDocument(fileFor(update.slug));
    const evidenceSources = mergeEvidence(doc.data.evidenceSources, [update.evidence]);
    await updateProductEditorial(doc.file, { evidenceSources, updatedAt: updatedDate(doc.data) }, hash(doc.source));
  }
  for (const update of manifest.existingUpdates ?? []) {
    const file = fileFor(update.slug);
    const original = await readProductDocument(file);
    const destination = update.asin ? resolveAmazonProductAffiliate(`https://www.amazon.de/dp/${update.asin}`, projectConfig.affiliate.amazon.trackingId).url : original.data.affiliate?.url;
    if (!newerPrice(original.data.price, update.price)) await updateProductPrice(file, update.price, { affiliateUrl: destination, syncAffiliateUrl: Boolean(destination), now: update.price.checkedAt });
    const doc = await readProductDocument(file);
    await updateProductEditorial(file, { ...(update.asin ? { asin: update.asin } : {}),
      priceAutomation: 'automatic', updatedAt: updatedDate(doc.data), evidenceSources: mergeEvidence(doc.data.evidenceSources, update.evidenceSources) }, hash(doc.source));
  }
}

if (refresh) {
  for (const slug of [...manifest.candidateSlugs, ...manifest.relatedUpdates.map(update => update.slug), ...(manifest.existingUpdates ?? []).map(update => update.slug)]) {
    const result = await checkProductPrice(slug);
    console.log(JSON.stringify({ slug, ok: result.ok, error: result.error }));
  }
}

const results = [];
for (const candidate of manifest.candidates) {
  const document = await readProductDocument(fileFor(candidate.slug));
  if (isPublishedProduct(document.data) !== isPublishedProduct(candidate)) throw new Error(`${candidate.slug}: Freigabe weicht vom geprüften Manifest ab.`);
  results.push({ slug: candidate.slug, publicationStatus: document.data.publicationStatus, score: calculateProductScore(document.data), blockers: document.data.publicationBlockers });
}
console.log(JSON.stringify({ version: manifest.version, draftProducts: results, researchOnly: manifest.researchOnly.map(item => item.model) }, null, 2));
