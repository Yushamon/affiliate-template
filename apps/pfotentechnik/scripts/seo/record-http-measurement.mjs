#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { APP_ROOT, REPO_ROOT, SITE } from './release-url-utils.mjs';
import { mergeMetricRows } from '../../src/lib/search/normalizer.mjs';

export function measurementBaseline({ http, source, gsc, cohort, watch, deployedAt = null, now = new Date() }) {
  const verifiedAt = new Date(http.finishedAt);
  const date = deployedAt ? new Date(deployedAt) : null;
  const liveFresh = http.pass && Number.isFinite(+verifiedAt) && +now >= +verifiedAt && +now - +verifiedAt <= 3600000;
  if (date && (!Number.isFinite(+date) || +date > +verifiedAt)) throw new Error('Deployment time must be valid and no later than live verification.');
  const rows = new Map(mergeMetricRows(source.pages, 'page').map(p => [p.page, p]));
  const live = new Map(http.observations.map(p => [new URL(p.url).pathname, p]));
  if (watch.length !== 15 || new Set(watch).size !== 15) throw new Error('Expected the exact fifteen distinct 34.7 observation URLs.');
  const ready = liveFresh && Boolean(date) && watch.every(u => live.get(u)?.pass);
  return { schemaVersion:1, status:ready?'POST_FIX_BASELINE':'PENDING_LIVE_FIX', capturedAt:now.toISOString(), deploymentAt:ready?date.toISOString():null, suppliedDeploymentAt:deployedAt, liveVerifiedAt:http.finishedAt, liveGatePass:http.pass, observationEnd:ready?new Date(+date+14*86400000).toISOString():null, contentFreeze:ready?'14 days after deployment, except verified P0/P1':'Keep existing cohort stable; post-fix clock not started', gsc,
    urls:watch.map(route => {
      const old=cohort.find(p=>p.route===route), row=rows.get(route), result=live.get(route);
      return {url:SITE+route,pageType:old?.pageType??null,cluster:old?.cluster??null,
        exportPeriodMetrics:row??null,currentPosition:null,bestHistoricalWindowPosition:old?.bestObservedWindowAverage??null,
        currentQueryCount:null,historicalDisclosedQueryCount:old?.queryCountDisclosed??null,
        canonical:result?.canonical??null,finalHttpStatus:result?.finalStatus??null,finalUrl:result?.finalUrl??null,httpPass:result?.pass??false,
        lastRelevantContentChange:old?.lastMajorContentChange??null,lastGitChange:old?.lastGitChange??null,
        caveat:'Original CSV page metrics cover the whole export period; date×page and query×page are absent. Historical best/query count remain historical, not current.'};
    }), blockedReasons:ready?[]:[...(!http.pass?['Production HTTP gate has not passed']:[]),...(!liveFresh?['Fresh successful live verification required']:[]),...(!date?['Verified deployment timestamp required; no inferred date']:[])]};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const read = p => JSON.parse(fs.readFileSync(path.join(REPO_ROOT,p),'utf8'));
  const evidence='reports/seo-cockpit/http-integrity-34.8-evidence/';
  const http=JSON.parse(fs.readFileSync(path.join(APP_ROOT,'reports/seo-release/production-http-latest.json'),'utf8'));
  const source=read(evidence+'gsc-original-2026-09-07.json');
  if (createHash('sha256').update(fs.readFileSync(path.join(REPO_ROOT,source.sourceFile))).digest('hex')!==source.sha256) throw new Error('Original GSC export checksum mismatch');
  const result=measurementBaseline({http,source,gsc:read(evidence+'gsc-rebaseline.json'),cohort:read('reports/seo-cockpit/visibility-34.7-evidence/cohort.json'),watch:read('reports/seo-cockpit/visibility-34.7-evidence/monitoring-plan.json').urls,deployedAt:process.argv.find(a=>a.startsWith('--deployed-at='))?.split('=').slice(1).join('=')??null});
  fs.writeFileSync(path.join(REPO_ROOT,evidence,'measurement-baseline.json'),JSON.stringify(result,null,2)+'\n');
  console.log(result.status + ': ' + result.urls.length + ' unchanged observation URLs.');
  process.exitCode=result.status==='POST_FIX_BASELINE'?0:1;
}
