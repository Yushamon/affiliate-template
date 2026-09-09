import pathlib,json,hashlib,re,difflib
r=pathlib.Path.cwd();e=r/'reports/seo-cockpit/fountain-cost-35.0b.1-evidence';a=pathlib.Path('/tmp/pf350b1-before-dist');b=r/'apps/pfotentechnik/dist'
pattern=r'data-astro-cid-[a-z0-9]+';mapping={};reverse={};unequal=[]
# Moving an Astro build root changes generated scope identifiers. Infer only a
# globally bijective identifier rename from corresponding public HTML positions.
# All CSS text and HTML still must match after applying exactly that rename.
for p in sorted(b.rglob('*.html')):
 rel=str(p.relative_to(b));old=a/rel
 if rel.startswith('admin/') or not old.exists():continue
 x=re.findall(pattern,old.read_text());y=re.findall(pattern,p.read_text())
 if len(x)!=len(y):unequal.append(rel);continue
 for v,w in zip(x,y):
  if v in mapping:assert mapping[v]==w,(rel,v,w,mapping[v])
  if w in reverse:assert reverse[w]==v,(rel,w,v,reverse[w])
  mapping[v]=w;reverse[w]=v
hashes={};replaced={}
def scope(text,root):return re.sub(pattern,lambda m:reverse.get(m.group(),m.group()),text) if root==b else text
def norm(text,root):
 def sub(m):
  url=m.group();p=root/url.lstrip('/')
  if not p.is_file():return url
  key=str(p)
  if key not in hashes:
   raw=p.read_bytes();data=scope(raw.decode(),root).encode() if p.suffix in ['.css','.js'] else raw
   hashes[key]=hashlib.sha256(data).hexdigest()
  replaced[str(root)+url]=hashes[key]
  return '/_astro/sha256-'+hashes[key]
 return re.sub(r'/_astro/[A-Za-z0-9_.~-]+',sub,scope(text,root))
rows=[];diff=[]
for p in sorted(b.rglob('*.html')):
 rel=str(p.relative_to(b));old=a/rel
 if not old.exists():rows.append({'file':rel,'new':True});continue
 x=old.read_text();y=p.read_text();nx=norm(x,a);ny=norm(y,b);same=nx==ny
 rows.append({'file':rel,'byteIdentical':x==y,'assetContentNormalizedIdentical':same})
 if not same:diff.extend([rel]+[l[:1600] for l in list(difflib.unified_diff(nx.replace('><','>\n<').splitlines(),ny.replace('><','>\n<').splitlines(),n=0))[:30]])
(e/'html-differences.txt').write_text('\n'.join(diff));(e/'html-comparison.json').write_text(json.dumps({'method':'Asset URL aliases use referenced file content SHA-256. Isolated build scope identifiers undergo a globally bijective rename in both HTML attributes and CSS/JS before hashing. No markup, CSS declarations, text, timestamps, metadata, links or schema ignored. Binary assets hash original bytes.','scopeRename':mapping,'publicPagesWithUnequalScopeTokenCounts':unequal,'pages':rows,'changedAfterAssetContentNormalization':[x['file'] for x in rows if not x.get('assetContentNormalizedIdentical')],'assetContentHashes':replaced},indent=2)+'\n');print('remaining',[x['file'] for x in rows if not x.get('assetContentNormalizedIdentical')])
