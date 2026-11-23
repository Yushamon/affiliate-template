import fs from 'node:fs';
import {pathToFileURL} from 'node:url';

export const findingStatuses = Object.freeze([
  'Neu', 'Bestätigt', 'Zur Korrektur vorgesehen', 'Korrigiert, aber unveröffentlicht',
  'Live verifiziert', 'Verworfen',
]);

// A ledger check validates evidence records; it never changes a finding's status.
export function validateFindings(ledger) {
  const errors = [], ids = new Set();
  const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (ledger?.schemaVersion !== 1 || !Array.isArray(ledger?.findings)) return ['Invalid ledger envelope'];
  for (const f of ledger.findings) {
    const add = message => errors.push(`${f.id ?? '(missing id)'}: ${message}`);
    if (!/^PTE-\d{4}$/.test(f.id) || ids.has(f.id)) add('Missing, invalid or duplicate ID');
    ids.add(f.id);
    for (const key of ['title', 'productOrManufacturer', 'claim', 'existingWebsiteClaim', 'proposedChange', 'implementedChange', 'kind']) {
      if (typeof f[key] !== 'string' || !f[key].trim()) add(`Missing ${key}`);
    }
    if (!findingStatuses.includes(f.status)) add('Invalid status');
    if (!['P0', 'P1', 'P2'].includes(f.priority)) add('Invalid priority');
    if (!date(f.lastVerified) || !date(f.firstRecorded)) add('Invalid verification/recording date');
    if (f.firstKnown !== null && !date(f.firstKnown)) add('firstKnown must be a date or explicitly unknown (null)');
    if (f.firstRecorded > f.lastVerified || f.firstKnown !== null && f.firstKnown > f.lastVerified) add('Verification predates the known/recorded finding');
    if (!Array.isArray(f.canonicals) || !f.canonicals.length || f.canonicals.some(u => !/^https:\/\/pfotentechnik\.de\/(?:[^?#]*\/)?$/.test(u))) add('Invalid canonicals');
    if (!Array.isArray(f.sources) || !f.sources.length || f.sources.some(s => !s.url?.startsWith('https://') || !s.type || !s.evidence || !date(s.checkedOn))) add('Missing source evidence');
    if (!Array.isArray(f.openQuestions)) add('Missing open questions');
    if (!Object.hasOwn(f, 'gitCommit') || f.gitCommit !== null && !/^[a-f0-9]{40}$/.test(f.gitCommit)) add('Invalid commit');
    const last = f.history?.at(-1);
    if (!last || last.status !== f.status || !date(last.date) || !last.evidence) add('Status requires a matching evidenced history entry');
    for (const [i, entry] of (f.history ?? []).entries()) {
      if (!date(entry.date) || !findingStatuses.includes(entry.status) || !entry.evidence || entry.date > f.lastVerified || i > 0 && entry.date < f.history[i - 1].date) add('Invalid or unordered status history');
    }
    if (f.status === 'Live verifiziert') {
      if (!date(f.liveVerifiedOn) || !f.canonicals.every(url => f.liveEvidence?.some(e => e.url === url && e.httpStatus === 200 && e.checkedOn === f.liveVerifiedOn && /^[a-f0-9]{64}$/.test(e.sha256) && e.observation))) add('Live status requires a dated HTTP 200 body observation for every canonical');
      if (!f.canonicals.every(url => f.sources?.some(s => s.type === 'live-output' && s.url === url && s.checkedOn === f.liveVerifiedOn))) add('Live status requires an actual live-output source, not a build or test');
    } else if (f.liveVerifiedOn !== null) add('Unverified status must not claim live verification');
    if (f.status === 'Korrigiert, aber unveröffentlicht' && !f.changedFiles?.length) add('Local correction requires changed files');
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = new URL('../../research/editorial-findings.json', import.meta.url);
  const ledger = JSON.parse(fs.readFileSync(file, 'utf8'));
  const errors = validateFindings(ledger);
  console.log(JSON.stringify({findings: ledger.findings.length, errors}, null, 2));
  process.exitCode = errors.length ? 1 : 0;
}
