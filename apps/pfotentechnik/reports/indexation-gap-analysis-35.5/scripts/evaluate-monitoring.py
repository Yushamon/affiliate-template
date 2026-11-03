"""Read manually archived GSC observations. No API calls or indexing requests."""
import argparse,csv,json,math,random,datetime
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('observations',type=Path);p.add_argument('--output',type=Path);a=p.parse_args();root=Path(__file__).resolve().parents[1];selection=json.loads((root/'selection-lock.json').read_text());expected={(pair[group]['canonical'],group):pair['pair_id'] for pair in selection['pairs'] for group in ['treatment','control']};data=list(csv.DictReader(a.observations.open()));seen=set();allowed={'indexed','crawled-not-indexed','discovered-not-indexed','not-indexed','unknown','error',''}
for r in data:
 key=(r['url'],r['group']);assert key in expected and expected[key]==r['pair_id'],'Unexpected URL/group/pair'
 assert int(r['day']) in [0,7,14,28,56];assert (key,r['day']) not in seen,'Duplicate observation';seen.add((key,r['day']));assert r['index_status'] in allowed,'Use an explicitly observed GSC status, not HTTP inference'
 if r['index_status'] not in ['', 'unknown','error']:
  assert r['observed_at'] and r['release_at'] and r['source_file'],'Outcome needs timestamp, release anchor and archived source'
  datetime.datetime.fromisoformat(r['observed_at'].replace('Z','+00:00'));datetime.datetime.fromisoformat(r['release_at'].replace('Z','+00:00'))
last={r['url']:r for r in data if int(r['day'])==56};known=lambda r:r and r['index_status'] not in ['', 'unknown','error'];groupstats={}
for group in ['treatment','control']:
 urls=[u for u,g in expected if g==group];obs=[last.get(u) for u in urls];k=[r for r in obs if known(r)];groupstats[group]={'assigned':10,'known':len(k),'unknown':10-len(k),'observedIndexed':sum(r['index_status']=='indexed' for r in k),'fractionAmongObserved':sum(r['index_status']=='indexed' for r in k)/len(k) if k else None}
complete=all(groupstats[g]['known']==10 for g in groupstats);result={'primaryEndpointDay':56,'ready':complete,'groups':groupstats,'primaryRiskDifference':None,'pairedExactP':None,'note':'Historical export is not a current baseline. Missing observations stay unknown. No release/indexation success is inferred.'}
if complete:
 pairs=[(int(last[x['treatment']['canonical']]['index_status']=='indexed'),int(last[x['control']['canonical']]['index_status']=='indexed')) for x in selection['pairs']];discord=sum(x!=y for x,y in pairs);wins=sum(x>y for x,y in pairs);losses=sum(x<y for x,y in pairs);tail=sum(math.comb(discord,i) for i in range(min(wins,losses)+1))/2**discord if discord else .5;result.update(primaryRiskDifference=sum(x-y for x,y in pairs)/10,pairedExactP=min(1,2*tail),discordantPairs=discord,treatmentOnlyIndexed=wins,controlOnlyIndexed=losses)
 rng=random.Random(355);boot=sorted(sum(x-y for x,y in rng.choices(pairs,k=10))/10 for _ in range(10000));result['pairedBootstrap95']=[boot[249],boot[9749]];result['uncertainty']='Ten pairs; interval and exact sign test are exploratory. Shared site/network and co-interventions constrain causal interpretation.'
result['firstObservedIndexationDay']={u:min([int(r['day']) for r in data if r['url']==u and r['index_status']=='indexed'],default=None) for u,g in expected}
# Missing outcomes: all four extreme assumptions, explicitly sensitivity analyses.
result['missingOutcomeRiskDifferenceBounds']=[(groupstats['treatment']['observedIndexed']-(groupstats['control']['observedIndexed']+groupstats['control']['unknown']))/10,((groupstats['treatment']['observedIndexed']+groupstats['treatment']['unknown'])-groupstats['control']['observedIndexed'])/10]
if a.output:a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps(result,ensure_ascii=False,indent=2))
