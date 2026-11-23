import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import yaml from 'js-yaml';

const app = fileURLToPath(new URL('../../', import.meta.url));
const root = path.join(app, 'research/product-evidence-35.6');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'changes.json')));
const originals = JSON.parse(gunzipSync(fs.readFileSync(path.join(root, 'originals.json.gz'))));
const protectedRoutes = new Set(JSON.parse(fs.readFileSync(path.join(app, 'research/product-integration-35.8/baseline.json'))).routes);
const hash = source => createHash('sha256').update(source).digest('hex');
const data = source => yaml.load(source.match(/^---\s*\n([\s\S]*?)\n---/)[1], {schema: yaml.JSON_SCHEMA});
const body = source => source.replace(/^---\s*\n[\s\S]*?\n---/, '');
const relative = file => path.relative(app, file instanceof URL ? fileURLToPath(file) : path.resolve(String(file))).split(path.sep).join('/');

// Historical snapshot boundaries stay immutable. Only these five exact, separately
// evidenced revisions may be projected back when checking a pre-35.6 contract.
// Current content, rendering and protected fields are checked independently.
export function validateEvidenceRevision(record, current, original) {
  assert.match(record.file, /^src\/content\/(products|pages)\/[a-z0-9-]+\.md$/);
  assert.equal(hash(original), record.beforeSha256, record.file + ': original snapshot');
  assert.equal(hash(current), record.afterSha256, record.file + ': unreviewed revision');
  const before = data(original), after = data(current);
  const route = after.productUrl ?? `/${after.slug}/`;
  assert.ok(!protectedRoutes.has(route), '35.5 cannot receive an editorial exception: ' + route);
  const permitted = new Set(['externalEvidence', 'experience', 'evidenceSources', 'faq', 'review', 'strengths']);
  for (const key of record.allowedFields) assert.ok(permitted.has(key), 'Protected or unsupported field: ' + key);
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (!record.allowedFields.includes(key)) assert.deepEqual(after[key], before[key], `${record.file}: protected ${key}`);
  }
  if (!record.bodyChanged) assert.equal(body(current), body(original), record.file + ': body changed');
  return before;
}

export function approvedEvidenceChanges() {
  return new Map(manifest.records.map(record => {
    validateEvidenceRevision(record, fs.readFileSync(path.join(app, record.file), 'utf8'), originals[record.file]);
    return [record.file, record];
  }));
}

export function readBeforeEvidence(file, encoding) {
  const source = fs.readFileSync(file);
  const record = manifest.records.find(r => r.file === relative(file));
  if (!record) return encoding ? source.toString(encoding) : source;
  validateEvidenceRevision(record, source.toString('utf8'), originals[record.file]);
  return encoding ? originals[record.file] : Buffer.from(originals[record.file]);
}

export function dataBeforeEvidence(file, current) {
  const record = manifest.records.find(r => r.file === relative(file));
  if (!record) return current;
  const before = validateEvidenceRevision(record, fs.readFileSync(file, 'utf8'), originals[record.file]);
  const projected = {...current};
  for (const key of record.allowedFields) {
    if (Object.hasOwn(before, key)) projected[key] = before[key];
    else delete projected[key];
  }
  return projected;
}
