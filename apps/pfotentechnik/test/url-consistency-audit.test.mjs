import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

test('URL audit recognizes noindex in both attribute orders and still rejects missing public canonicals', () => {
  const app = fs.mkdtempSync(path.join(os.tmpdir(), 'pfotentechnik-url-audit-'));
  try {
    fs.mkdirSync(path.join(app, 'scripts/seo'), {recursive: true});
    fs.copyFileSync(new URL('../scripts/seo/audit-url-consistency.mjs', import.meta.url), path.join(app, 'scripts/seo/audit-url-consistency.mjs'));
    const fixtures = {
      'preview': '<meta name="robots" content="noindex,follow">',
      'reverse': "<meta content='follow noindex' name='robots'>",
      'mixed-case': '<META NAME="ROBOTS" CONTENT="NOINDEX">',
      'public': '<meta name="robots" content="index,follow">',
      'not-a-directive': '<meta name="robots" content="not-noindex">',
      'canonical': '<link rel="canonical" href="https://pfotentechnik.de/canonical/">'
    };
    for (const [route, html] of Object.entries(fixtures)) {
      fs.mkdirSync(path.join(app, 'dist', route), {recursive: true});
      fs.writeFileSync(path.join(app, 'dist', route, 'index.html'), html);
    }
    const result = spawnSync(process.execPath, [path.join(app, 'scripts/seo/audit-url-consistency.mjs'), '--strict'], {encoding: 'utf8'});
    assert.equal(result.status, 1, result.stderr);
    const report = JSON.parse(fs.readFileSync(path.join(app, 'reports/url-consistency/url-consistency-audit.json'), 'utf8'));
    assert.equal(report.summary.nonIndexableHtml, 3);
    assert.equal(report.summary.indexableHtml, 3);
    assert.deepEqual(report.findings.map(row => [row.code, row.value]).sort(), [
      ['CANONICAL_MISSING', '/not-a-directive/'],
      ['CANONICAL_MISSING', '/public/']
    ]);
  } finally {
    fs.rmSync(app, {recursive: true, force: true});
  }
});
