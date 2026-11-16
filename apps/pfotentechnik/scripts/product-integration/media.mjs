import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { fetchPublicResource } from '../../src/lib/admin/public-fetch.mjs';

const app = fileURLToPath(new URL('../../', import.meta.url));
const manifest = JSON.parse(await fs.readFile(app + '/research/product-integration-35.8/manifest.json', 'utf8'));
if (!manifest.mediaPolicy.authorizationBasis) throw new Error('Dokumentierte Betreiberfreigabe fehlt.');
const sha = buffer => createHash('sha256').update(buffer).digest('hex');
for (const request of manifest.mediaRequests) {
  const only = process.argv.find(arg => arg.startsWith('--slug='))?.slice(7);
  if (only && request.slug !== only) continue;
  const dir = `${app}/src/assets/images/products/${request.slug}`;
  await fs.mkdir(dir, { recursive: true });
  const originals = [];
  for (const url of request.urls) {
    const response = await fetchPublicResource(url, { label: 'Freigegebenes Produktbild', accept: 'image/*', maxBytes: 12_000_000, timeoutMs: 20000, maxRedirects: 2 });
    if (!/^image\//.test(response.contentType)) throw new Error('Bildquelle liefert kein Bild.');
    originals.push({ sourceUrl: url, buffer: response.buffer, originalSha256: sha(response.buffer), accessedAt: new Date().toISOString() });
  }
  if (originals.length < 3) throw new Error('Mindestens drei eindeutig zugeordnete Bildquellen erforderlich.');
  const roles = [['hero', 0, 1200], ['thumbnail', 0, 480], ['comparison', 0, 720],
    ['gallery-1', originals.length > 3 ? 1 : 0, 1200], ['gallery-2', originals.length > 3 ? 2 : 1, 1200], ['gallery-3', originals.length > 3 ? 3 : 2, 1200]];
  const assets = [];
  for (const [role, index, width] of roles) {
    const original = originals[index];
    let buffer;
    for (const quality of [80, 70, 60, 50]) {
      buffer = await sharp(original.buffer).resize({ width, height: 1280, fit: 'inside', withoutEnlargement: true }).webp({ quality }).toBuffer();
      if (buffer.length < 150_000) break;
    }
    await fs.writeFile(`${dir}/${role}.webp`, buffer);
    const metadata = await sharp(buffer).metadata();
    assets.push({ file: `${role}.webp`, sourceUrl: original.sourceUrl, accessedAt: original.accessedAt,
      sourceKind: request.sourceKind, identity: request.identity, originalSha256: original.originalSha256,
      sha256: sha(buffer), bytes: buffer.length, width: metadata.width, height: metadata.height });
  }
  await fs.writeFile(`${dir}/media-provenance-35.8.json`, JSON.stringify({ pageUrl: request.pageUrl, asin: request.asin,
    identity: request.identity, authorization: manifest.mediaPolicy, assets }, null, 2) + '\n');
  console.log(JSON.stringify({ slug: request.slug, imported: assets.length, distinctSources: originals.length }));
}
