import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {approvedEvidenceChanges, readBeforeEvidence, validateEvidenceRevision} from '../scripts/product-evidence/approved-changes.mjs';
import {applyDecisions} from '../scripts/product-freshness/apply.mjs';
import {validateFindings} from '../scripts/product-evidence/check-findings.mjs';
import {createStyleScopeProof} from '../scripts/product-evidence/style-scope-proof.mjs';

const app = new URL('../', import.meta.url);
const originals = JSON.parse(gunzipSync(fs.readFileSync(new URL('research/product-evidence-35.6/originals.json.gz', app))));
const hash = value => createHash('sha256').update(value).digest('hex');

test('35.6.1: only five exact evidenced revisions bridge historical snapshots', () => {
  const records = approvedEvidenceChanges();
  assert.equal(records.size, 5);
  for (const [file, record] of records) {
    assert.equal(hash(readBeforeEvidence(new URL(file, app))), record.beforeSha256);
    assert.equal(hash(fs.readFileSync(new URL(file, app))), record.afterSha256);
  }
});
test('35.6.1: an additional unreviewed byte still fails the historical guard', () => {
  const record = [...approvedEvidenceChanges().values()][0];
  const current = fs.readFileSync(new URL(record.file, app), 'utf8');
  assert.throws(() => validateEvidenceRevision(record, current + '\n', originals[record.file]), /unreviewed revision/);
});
test('35.6.1: an updated hash cannot authorize a score change', () => {
  const record = structuredClone([...approvedEvidenceChanges().values()][0]);
  const current = fs.readFileSync(new URL(record.file, app), 'utf8').replace(/^score: \d+/m, 'score: 1');
  record.afterSha256 = hash(current);
  assert.throws(() => validateEvidenceRevision(record, current, originals[record.file]), /protected score/);
  record.allowedFields.push('score');
  assert.throws(() => validateEvidenceRevision(record, current, originals[record.file]), /Protected or unsupported field/);
});
test('35.6.1: no exact revision exception is possible for an experiment page', () => {
  const file = 'src/content/products/cat-mate-c500.md';
  const current = fs.readFileSync(new URL(file, app), 'utf8');
  const record = {file, beforeSha256: hash(current), afterSha256: hash(current), allowedFields: [], bodyChanged: false};
  assert.throws(() => validateEvidenceRevision(record, current, current), /35.5 cannot/);
});
test('35.6.1: historical apply refuses to overwrite newer evidence before any write', async () => {
  const directory = new URL('src/content/products/', app);
  const snapshot = () => Object.fromEntries(fs.readdirSync(directory).filter(f => f.endsWith('.md')).map(f => [f, hash(fs.readFileSync(new URL(f, directory)))]));
  const before = snapshot();
  await assert.rejects(applyDecisions(true), /spätere Evidenzänderung/);
  assert.deepEqual(snapshot(), before);
});
test('35.6.1: local build evidence cannot stand in for a live source', () => {
  const ledger = JSON.parse(fs.readFileSync(new URL('research/editorial-findings.json', app)));
  const finding = ledger.findings.find(f => f.status === 'Live verifiziert');
  finding.sources = finding.sources.map(s => ({...s, type: 'local-build'}));
  assert.ok(validateFindings(ledger).some(e => e.includes('actual live-output source')));
});
test('35.6.1: verification and history dates must remain chronologically plausible', () => {
  const ledger = JSON.parse(fs.readFileSync(new URL('research/editorial-findings.json', app)));
  ledger.findings[0].lastVerified = '2026-01-01';
  assert.ok(validateFindings(ledger).some(e => e.includes('Verification predates')));
});
test('35.6.1: relocated style identities require identical source and CSS semantics', () => {
  const source = 'unchanged score component', oldCss = '.pt-score[data-astro-cid-old]{color:red}', newCss = oldCss.replaceAll('-old', '-new');
  const reference = {sourceSha256: hash(source), stylesheets: [{url: '/_astro/old.css', content: oldCss, sha256: hash(oldCss)}]};
  const html = (name, css) => `<link href="/_astro/${name}.css"><style>${css}</style><b data-astro-cid-${name}>87</b>`;
  const proof = createStyleScopeProof({reference, source, readCss: () => newCss});
  const original = proof.normalize(html('old', oldCss), {historical: true});
  assert.equal(proof.normalize(html('new', newCss)), original);
  const changed = createStyleScopeProof({reference, source, readCss: () => newCss.replace('red', 'blue')});
  assert.notEqual(changed.normalize(html('new', newCss.replace('red', 'blue'))), original);
  assert.throws(() => createStyleScopeProof({reference, source: source + ' modified', readCss: () => newCss}), /source changed/);
});
