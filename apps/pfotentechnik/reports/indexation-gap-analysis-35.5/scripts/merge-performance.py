import json,csv,subprocess,hashlib,zipfile,io
from pathlib import Path
P=Path('apps/pfotentechnik/reports/indexation-gap-analysis-35.5');f=json.loads((P/'feature-matrix.json').read_text());byurl={r['canonical']:r for r in f};byroute={r['route']:r for r in f};sources=json.loads(Path('apps/pfotentechnik/reports/index-migration-forensics-35.3b/historical-gsc-sources.json').read_text());out=[];used=[]
def add(row,source,sha,window,start,end,keys=None):
 raw=row.get('page','') if keys is None else row[keys[0]];r=byurl.get(raw) if raw.startswith('http') else byroute.get(raw)
 if not r:return
 out.append(dict(canonical=r['canonical'],reported_url=raw,identity='exact canonical URL' if raw.startswith('http') else 'path only; host unknown',source=source,sha256=sha,window=window,start=start,end=end,impressions=row.get('impressions') if keys is None else row[keys[1]],clicks=row.get('clicks') if keys is None else row[keys[2]],position=row.get('position') if keys is None else row[keys[3]],index_status='unknown; performance observation is not coverage'))
for s in sources:
 if not s['use'].startswith('verified'):continue
 ref=s['commit'];file=s['file'];data=Path(file).read_bytes() if ref=='BACKUP_ORIGINAL_20260727' else subprocess.check_output(['git','show',ref+':'+file]);assert hashlib.sha256(data).hexdigest()==s['sha256'];used.append(s)
 for key,w in json.loads(data).get('ranges',{}).items():
  for row in w.get('pages',[]):add(row,ref+':'+file,s['sha256'],key,w.get('startDate'),w.get('endDate'))
for file in ['reports/seo-cockpit/http-integrity-34.8-evidence/pfotentechnik.de-Performance-on-Search-2026-09-07.zip','reports/seo-imports/2026-09-21/pfotentechnik.de-Performance-on-Search-2026-09-21.zip']:
 p=Path(file);sha=hashlib.sha256(p.read_bytes()).hexdigest();z=zipfile.ZipFile(p);used.append(dict(file=file,sha256=sha,use='original ZIP aggregate; see filters'))
 for row in csv.DictReader(io.StringIO(z.read('Seiten.csv').decode('utf-8-sig'))):add(row,file,sha,'original aggregate; see Filter.csv','','',keys=['Die häufigsten Seiten','Impressionen','Klicks','Position'])
h=(P/'historical-performance-observations.csv').open('w');w=csv.DictWriter(h,fieldnames=list(out[0]));w.writeheader();w.writerows(out);h.close()
for r in f:
 obs=[x for x in out if x['canonical']==r['canonical']];r['historical_performance_exact_observations']=sum(o['identity']=='exact canonical URL' for o in obs);r['historical_performance_path_only_observations']=sum(o['identity'].startswith('path only') for o in obs);r['earliest_performance_window_start']=min([o['start'] for o in obs if o['start']],default='');r['latest_performance_window_end']=max([o['end'] for o in obs if o['end']],default='');r['performance_evidence_note']='Overlapping archived windows, never summed; exact URL and path-only observations kept separate. No indexation inference.'
(P/'feature-matrix.json').write_text(json.dumps(f,ensure_ascii=False,indent=2));h=(P/'indexation-feature-matrix.csv').open('w');w=csv.DictWriter(h,fieldnames=list(f[0]));w.writeheader();w.writerows(f);h.close();(P/'performance-source-manifest.json').write_text(json.dumps(used,ensure_ascii=False,indent=2));print('Performance observations',len(out),'verified sources',len(used),'canonicals observed',len({o['canonical'] for o in out}))
