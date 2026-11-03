import json,csv,re,math,collections,statistics,datetime,hashlib,subprocess,gzip,random
from pathlib import Path
P=Path('apps/pfotentechnik/reports/indexation-gap-analysis-35.5');T=Path('/tmp/gap-35-5');rows=json.loads((T/'rendered-before.json').read_text());hist=json.loads((T/'git-editorial-history.json').read_text());migration={r['url']:r for r in csv.DictReader(Path('apps/pfotentechnik/reports/index-migration-forensics-35.3b/index-status-comparison.csv').open())};changed=set(re.findall(r'^### (https://\S+)',Path('apps/pfotentechnik/reports/editorial-quality-recovery-35.4/changes.md').read_text(),re.M));now=datetime.date(2026,11,2)
http=json.loads(Path('apps/pfotentechnik/reports/google-index-recovery-35.3/production-http.json').read_text());live={r['url']:r for r in http['sitemap']['urls']}
norm=lambda s:re.sub(r'\s+',' ',s.lower()).strip()
blockdocs=collections.defaultdict(set)
for i,r in enumerate(rows):
 for b in r['blocks']:blockdocs[norm(b['text'])].add(i)
boiler={s for s,v in blockdocs.items() if len(v)>=8};stops=set('aber als also am an auch auf aus bei bis das dass dem den der des die dies diese dieser dieses doch du durch ein eine einem einen einer eines er es etwas für hat haben hier ich im in ist ja kann kein keine mit nach nicht noch nun nur oder ohne sehr sich sie sind so sowie um und uns unter vom von vor war was welche welcher wenn wer wie wird wir wo zu zum zur über einem ihren ihrer dein deine dem dann damit mehr weniger laut bereits etwa etwa diese diesem diesem nach oben unten'.split())
def tokens(text):return [t for t in re.findall(r'[a-zäöüß0-9]+',text.lower()) if len(t)>2 and t not in stops]
clean=[];vectors=[];df=collections.Counter()
for r in rows:
 unique=list(dict.fromkeys(b['text'] for b in r['blocks'] if norm(b['text']) not in boiler));r['analysisBlocks']=unique;r['analysisText']='\n'.join(unique);t=tokens(r['analysisText']);clean.append(t);v=collections.Counter(['w:'+x for x in t]+['b:'+a+' '+b for a,b in zip(t,t[1:])]);vectors.append(v);df.update(v.keys())
N=len(rows);unit=[]
for v in vectors:
 vec={k:(1+math.log(x))*math.log(1+N/(1+df[k])) for k,x in v.items()};length=math.sqrt(sum(x*x for x in vec.values())) or 1;unit.append({k:v/length for k,v in vec.items()})
pairs=[];nearest=[(0,None) for r in rows];same=[(0,None) for r in rows]
for i in range(N):
 for j in range(i):
  a,b=unit[i],unit[j];small,large=(a,b) if len(a)<len(b) else (b,a);sim=sum(x*large.get(k,0) for k,x in small.items());pairs.append((sim,j,i))
  for x,y in [(i,j),(j,i)]:
   if sim>nearest[x][0]:nearest[x]=(sim,y)
   if rows[x]['pageType']==rows[y]['pageType'] and rows[x]['cluster']==rows[y]['cluster'] and sim>same[x][0]:same[x]=(sim,y)
# Repeated 12-token spans are an additional boilerplate measure, not a quality score.
shingle_docs=collections.defaultdict(set)
for i,r in enumerate(rows):
 t=tokens('\n'.join(b['text'] for b in r['blocks']));r['_fulltokens']=t
 for j in range(max(0,len(t)-11)):shingle_docs[tuple(t[j:j+12])].add(i)
repeated={s for s,v in shingle_docs.items() if len(v)>=8}
# Build graph partitions from rendered link ancestry, not just the source Content Graph.
byroute={r['route']:i for i,r in enumerate(rows)};alladj={};ctxadj={};autoAdj={};incoming=collections.defaultdict(set);ctxin=collections.defaultdict(set);autoin=collections.defaultdict(set)
for r in rows:
 targets={l['route'] for l in r['links'] if l['route'] in byroute and l['route']!=r['route']};ct={l['route'] for l in r['links'] if l['contextual'] and l['route'] in byroute and l['route']!=r['route']};au={l['route'] for l in r['links'] if l['automatedOrNavigation'] and l['route'] in byroute and l['route']!=r['route']};alladj[r['route']]=targets;ctxadj[r['route']]=ct;autoAdj[r['route']]=au
 for t in targets:incoming[t].add(r['route'])
 for t in ct:ctxin[t].add(r['route'])
 for t in au:autoin[t].add(r['route'])
def bfs(start,adj):
 d={start:0};q=[start]
 for x in q:
  for y in sorted(adj.get(x,[])):
   if y not in d:d[y]=d[x]+1;q.append(y)
 return d
home=bfs('/',alladj);homecontext=bfs('/',ctxadj)
hubs={c:next((r['route'] for r in rows if r['pageType']=='category' and r['cluster']==c),None) for c in {r['cluster'] for r in rows}};hubs.update({'futterautomaten':'/smarte-futterautomaten/','trinkbrunnen':'/trinkbrunnen/','gps-tracker':'/gps-tracker/','katzenklappen':'/katzenklappen/','haustierkameras':'/haustierkameras/','automatische-katzentoiletten':'/automatische-katzentoiletten/','hersteller':'/hersteller/'})
# Descriptive PageRank on contextual graph, explicitly not Google's PageRank.
pr={r['route']:1/N for r in rows}
for _ in range(60):
 dangling=sum(pr[x] for x in pr if not ctxadj[x]);nxt={x:(.15+.85*dangling)/N for x in pr}
 for x in pr:
  if ctxadj[x]:
   for y in ctxadj[x]:nxt[y]+=.85*pr[x]/len(ctxadj[x])
 pr=nxt
independent=re.compile(r'(catvets|icatcare|wsava|fda\.gov|cdc\.gov|merckvetmanual|msdvetmanual|vcahospitals|tierschutzbund|tieranwalt|aaha\.org|bva\.co|avma\.org|ncbi\.nlm|pubmed|veterinary|fediaf|europa\.eu|verbraucherzentrale|reviewed\.com|connect\.de|faz\.net|nytimes\.com|heise\.de|tomsguide\.com|pcmag\.com|cats\.com|techradar\.com|bfr\.bund|bfdi\.bund)',re.I)
features=[]
for i,r in enumerate(rows):
 source=r['source'];events=hist['histories'].get(source,[])
 if not events and source:
  raw=subprocess.check_output(['git','log','--all','--reverse','--format=%H %aI','--',source]).decode().splitlines();events=[dict(commit=l.split()[0],authorDate=l.split()[1],editorialChange=True) for l in raw]
 meaningful=[e for e in events if e['editorialChange'] and not e.get('operation')=='D'];first=next((e['authorDate'] for e in events),'');oldfirst=migration.get(r['url'],{}).get('first_content_git','');first=min(filter(None,[first,oldfirst]),default='');last=meaningful[-1]['authorDate'] if meaningful else ''
 refs=list({l['url'] for l in r['externalReferences']});ind=[u for u in refs if independent.search(u)];text=r['analysisText'];sent=re.split(r'(?<=[.!?])\s+|\n',text)
 concrete=[s for s in sent if re.search(r'\b\d+(?:[,.]\d+)?\s*(?:mm|cm|kg|ml|liter|l\b|g\b|stunden|tage|mah[lz]|ghz|°c|eur|€|wh|watt|volt)',s,re.I)]
 limits=[s for s in sent if re.search(r'\b(nicht|kein|keine|nur|ausgeschlossen|ungeeignet|grenze|einschränkung|statt)\b',s,re.I) and len(s.split())>=7];criteria=[s for s in sent if re.search(r'\b(wenn|wer|entscheid|auswähl|auswahl|prüfe|prüfen|achten|voraussetz)\b',s,re.I) and len(s.split())>=7]
 comparisons=[s for s in sent if re.search(r'\b(gegenüber|anders als|im unterschied|im vergleich|statt|während|vergleich)\b',s,re.I) and len(s.split())>=8]
 calculations=[s for s in sent if re.search(r'\d\s*[×*÷=]\s*\d|\d\s*[×*÷].*\d|berechn|rechenbeispiel|rechnung|gesamtkosten|hochrechn',s,re.I)]
 t=r['_fulltokens'];covered=set()
 for j in range(max(0,len(t)-11)):
  if tuple(t[j:j+12]) in repeated:covered.update(range(j,j+12))
 crawl=r['googleObservations'][0].get('lastCrawledRaw','');crawl='' if crawl=='1970-01-01' else crawl
 obs=live.get(r['url'],{});hub=hubs.get(r['cluster']);hd=bfs(hub,alladj).get(r['route']) if hub else None
 data=r['data']; own=bool(data.get('testStatus') in ['hands-on','tested'] and data.get('testProtocol'))
 f=dict(canonical=r['url'],route=r['route'],page_type=r['pageType'],detailed_type=r['detailedPageType'],cluster=r['cluster'],gsc_status=r['googleStatus'],gsc_export_date='2026-11-02',historical_migration=migration.get(r['url'],{}).get('group')=='migrated',first_git_existence=first,git_age_days=(now-datetime.date.fromisoformat(first[:10])).days if first else None,last_editorial_git_change=last,relevant_git_changes=len(meaningful),prior_35_4_change=r['url'] in changed,source=source,source_sha256=r['sourceSha256'],visible_main_words=r['mainWordCount'],content_sections=sum(h['level']=='h2' for h in r['headings']),analysis_words=len(text.split()),recurrent_block_words=sum(len(b['text'].split()) for b in r['blocks'] if norm(b['text']) in boiler),recurrent_12token_fraction=round(len(covered)/len(t),4) if t else 0,max_related_tfidf_cosine=round(same[i][0],4),most_similar_related_url=rows[same[i][1]]['url'] if same[i][1] is not None else '',max_any_tfidf_cosine=round(nearest[i][0],4),most_similar_any_url=rows[nearest[i][1]]['url'] if nearest[i][1] is not None else '',concrete_statement_candidates=len(concrete),limitation_statement_candidates=len(limits),decision_statement_candidates=len(criteria),has_named_alternatives=bool(data.get('alternatives') or re.search(r'Alternative[n]?\b',text)),calculation_candidates=len(calculations),comparison_statement_candidates=len(comparisons),documented_source_links=len(refs),independent_primary_source_candidates=len(ind),documented_own_practice=own,source_evidence_mode=data.get('testStatus','not-stated'),incoming_all_sources=len(incoming[r['route']]),incoming_contextual_sources=len(ctxin[r['route']]),incoming_navigation_or_auto_sources=len(autoin[r['route']]),outgoing_contextual_targets=len(ctxadj[r['route']]),home_click_depth=home.get(r['route']),home_contextual_only_depth=homecontext.get(r['route']),relevant_hub=hub,hub_click_depth=hd,incoming_contextual_indexed=sum(rows[byroute[x]]['googleStatus']=='indexed' for x in ctxin[r['route']]),incoming_contextual_crawled=sum(rows[byroute[x]]['googleStatus']=='crawled-not-indexed' for x in ctxin[r['route']]),incoming_contextual_discovered=sum(rows[byroute[x]]['googleStatus']=='discovered-not-indexed' for x in ctxin[r['route']]),contextual_graph_pagerank=round(pr[r['route']],8),linked_from_home=r['route'] in alladj.get('/',set()),linked_directly_from_hub=bool(hub and r['route'] in alladj.get(hub,set())),linked_from_comparison=any(rows[byroute[x]]['pageType']=='comparison' for x in incoming[r['route']]),http_status=obs.get('finalStatus'),http_checked_at=http['finishedAt'],http_evidence='35.3 reused live GET; no new full crawl',rendered_canonical=' | '.join(r['canonicalSignals']),indexable=not bool(re.search(r'noindex|none',r['robotsSignals'],re.I)),in_sitemap=r['inSitemap'],schema_types=' | '.join(r['schemaTypes']),main_renderable=bool(text),redirects=obs.get('redirects'),last_known_googlebot_crawl=crawl,google_selected_canonical='unknown',historical_3m_impressions=(r.get('gsc3m') or {}).get('impressions'),historical_28d_impressions=(r.get('gsc28d') or {}).get('impressions'))
 features.append(f);r['evidenceCandidates']=dict(concrete=concrete,limits=limits,criteria=criteria,comparisons=comparisons,calculations=calculations,independentLinks=ind,sourceLinks=refs)
keys=list(features[0]);f=(P/'indexation-feature-matrix.csv').open('w');w=csv.DictWriter(f,fieldnames=keys);w.writeheader();w.writerows(features);f.close();(P/'feature-matrix.json').write_text(json.dumps(features,ensure_ascii=False,indent=2))
(T/'enriched-pages.json').write_text(json.dumps(rows,ensure_ascii=False));
# Highest pairs, plus all within type+cluster pairs, are reproducible lexical candidates for manual intent review.
pairrows=[dict(left=rows[a]['url'],right=rows[b]['url'],cosine=round(s,5),same_type=rows[a]['pageType']==rows[b]['pageType'],same_cluster=rows[a]['cluster']==rows[b]['cluster'],left_status=rows[a]['googleStatus'],right_status=rows[b]['googleStatus']) for s,a,b in sorted(pairs,reverse=True)]
f=(P/'content-similarity-pairs.csv').open('w');w=csv.DictWriter(f,fieldnames=list(pairrows[0]));w.writeheader();w.writerows(pairrows);f.close()
(P/'feature-methods.json').write_text(json.dumps(dict(snapshot='before35.5',boilerplateDocumentThreshold=8,repeatedShingleTokens=12,semanticMethod='TF-IDF word unigrams/bigrams; German stopwords; exact shared blocks >=8 pages removed; no embeddings, lexical similarity is not semantic equivalence',commonBlockCount=len(boiler),commonBlocks=sorted(boiler),gitEditorialDefinition=hist['definition'],limitations=['Lexical concrete/limitation/decision/calculation/comparison counts are candidates, not validated facts or quality scores.','Independent-source domain candidates need human checking; merchants are excluded, nonlisted independent sources may be missed.','No hands-on evidence inferred from experience fields.','Current HTML includes previous35.4 changes, GSC observations precede those edits.','Graph scores are computed on this rendered snapshot, not Google PageRank.']),ensure_ascii=False,indent=2))
print('features',len(features),'prior35.4',len(changed),'status',collections.Counter(f['gsc_status'] for f in features));print('top pairs',pairrows[:5]);print('type cluster')
for typ in ['product','guide','comparison','manufacturer']:
 for c in sorted({f['cluster'] for f in features if f['page_type']==typ}):print(typ,c,collections.Counter(f['gsc_status'] for f in features if f['page_type']==typ and f['cluster']==c))
