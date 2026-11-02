import subprocess,re,json,gzip,os
from pathlib import Path
os.chdir(Path(__file__).resolve().parents[4])
G=lambda *a:subprocess.check_output(['git',*a]).decode()
base='apps/pfotentechnik/src/content/'
log=G('log','--all','--reverse','--topo-order','--raw','--no-abbrev','--no-renames','--format=COMMIT %H %aI %cI','--',base+'pages',base+'comparisons',base+'products',base+'manufacturers')
rows=[];blobs={};commit=None
for l in log.splitlines():
 if l.startswith('COMMIT '):
  _,commit,ad,cd=l.split();continue
 if l.startswith(':') and l.endswith('.md'):
  raw,path=l.split('\t');parts=raw.split();old,new,op=parts[2:];rows.append(dict(commit=commit,authorDate=ad,committerDate=cd,path=path,old=old,new=new,op=op))
  for b in [old,new]:
   if b!='0'*40:blobs[b]=None
p=subprocess.Popen(['git','cat-file','--batch'],stdin=subprocess.PIPE,stdout=subprocess.PIPE)
for b in blobs:
 p.stdin.write((b+'\n').encode());p.stdin.flush();h=p.stdout.readline().decode().split();n=int(h[2]);text=p.stdout.read(n).decode(errors='replace');p.stdout.read(1)
 front=text.split('---',2)[1] if text.startswith('---') else text[:2000]
 def field(k):
  m=re.search(r'^'+k+r':\s*[\"\x27]?([^\n\"\x27]+)',front,re.M);return m.group(1).strip() if m else None
 can=re.search(r'''canonical:\s*["']?([^"'\s,}]+)''',front)
 blobs[b]=dict(slug=field('slug'),title=field('title'),publishedAt=field('publishedAt'),canonical=can.group(1) if can else None,noindex=bool(re.search(r'noindex:\s*true',front)),sitemapFalse=bool(re.search(r'sitemap:\s*false',front)))
p.stdin.close();p.wait()
output=Path(__file__).with_name('git-content-history.json.gz')
with gzip.open(output,'wt',encoding='utf8') as f:json.dump(dict(rows=rows,blobs=blobs),f,ensure_ascii=False)
print('Rows',len(rows),'blobs',len(blobs))
for r in rows:
 o=blobs.get(r['old'],{});n=blobs.get(r['new'],{})
 if o.get('slug') and n.get('slug') and o['slug']!=n['slug']:print('SLUGCHANGE',r['commit'][:8],r['authorDate'],r['path'].split('/')[-1],o['slug'],'=>',n['slug'])
