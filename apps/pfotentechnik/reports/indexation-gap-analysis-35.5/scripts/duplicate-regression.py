import json,re,hashlib,collections
from pathlib import Path
P=Path('apps/pfotentechnik/reports/indexation-gap-analysis-35.5');before=json.load(open('/tmp/gap-35-5/rendered-before.json'));after=json.load(open('/tmp/gap-35-5/rendered-after.json'));baseline={r['url']:r for r in before}
def norm(s):return re.sub(r'\s+',' ',s).strip().lower()
def windows(r):
 t=re.findall(r'\w+',norm(r['mainText']));return {tuple(t[i:i+5]) for i in range(len(t)-4)}
exact=collections.defaultdict(list)
for r in after:exact[hashlib.sha256(norm(r['mainText']).encode()).hexdigest()].append(r['url'])
aftersets={r['url']:windows(r) for r in after};beforesets={r['url']:windows(r) for r in before};new=[];checked=0;maxsim=0
for i,a in enumerate(after):
 for b in after[:i]:
  if a['mainText']==baseline[a['url']]['mainText'] and b['mainText']==baseline[b['url']]['mainText']:continue
  checked+=1;x,y=aftersets[a['url']],aftersets[b['url']];v=len(x&y)/len(x|y) if x|y else 0;maxsim=max(maxsim,v)
  bx,by=beforesets[a['url']],beforesets[b['url']];old=len(bx&by)/len(bx|by) if bx|by else 0
  if v>=.8 and old<.8:new.append(dict(left=a['url'],right=b['url'],before=old,after=v))
report=dict(canonicals=259,exactDuplicates=[x for x in exact.values() if len(x)>1],affectedPairsChecked=checked,newHighOverlapPairs=new,maxAffectedFiveGramJaccard=maxsim,passAll=not new and all(len(x)==1 for x in exact.values()),limitation='Exact text and five-gram regression only; no automatic semantic-equivalence or consolidation claim.')
(P/'duplicate-regression.json').write_text(json.dumps(report,indent=2));print(report)
