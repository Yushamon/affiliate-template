import json,csv
from pathlib import Path
P=Path('apps/pfotentechnik/reports/indexation-gap-analysis-35.5');before=json.load(open('/tmp/gap-35-5/rendered-before.json'));after=json.load(open('/tmp/gap-35-5/rendered-after.json'));selection=json.load(open(P/'selection-lock.json'))
def incoming(rows,url):
 route=url.removeprefix('https://pfotentechnik.de');return {r['url'] for r in rows if r['url']!=url and any(l['contextual'] and l['route']==route for l in r['links'])}
rows=[]
for pair in selection['pairs']:
 for group in ['treatment','control']:
  url=pair[group]['canonical'];a=incoming(before,url);b=incoming(after,url);rows.append(dict(pair_id=pair['pair_id'],group=group,url=url,before_contextual_sources=len(a),after_contextual_sources=len(b),added_sources=' | '.join(sorted(b-a)),lost_sources=' | '.join(sorted(a-b)),before_sources=' | '.join(sorted(a)),after_sources=' | '.join(sorted(b))))
h=(P/'experiment-link-exposure.csv').open('w');w=csv.DictWriter(h,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows);h.close();changes=[r for r in rows if r['added_sources'] or r['lost_sources']];(P/'panel-link-validation.json').write_text(json.dumps(dict(urls=len(rows),changedIncomingContextualSourceSets=changes,passAll=not changes),indent=2));print('20 panel link exposures:', 'PASS' if not changes else 'FAIL')
assert not changes,'Do not change panel graph exposure without an explicit recorded protocol amendment'
