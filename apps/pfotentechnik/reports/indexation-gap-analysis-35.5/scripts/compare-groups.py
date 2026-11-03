import json,csv,statistics,collections,math,random
from pathlib import Path
P=Path('apps/pfotentechnik/reports/indexation-gap-analysis-35.5');rows=json.loads((P/'feature-matrix.json').read_text());groups=['indexed','crawled-not-indexed','discovered-not-indexed'];metrics=['git_age_days','visible_main_words','analysis_words','recurrent_12token_fraction','max_related_tfidf_cosine','documented_source_links','independent_primary_source_candidates','concrete_statement_candidates','limitation_statement_candidates','decision_statement_candidates','calculation_candidates','comparison_statement_candidates','incoming_contextual_sources','incoming_contextual_indexed','home_click_depth','hub_click_depth','relevant_git_changes']
def med(v):return statistics.median(v) if v else None
def delta(a,b):return sum((x>y)-(x<y) for x in a for y in b)/(len(a)*len(b)) if a and b else None
def quant(v,p):
 s=sorted(v);return s[round((len(s)-1)*p)] if s else None
def summarize(d):
 out={}
 for g in groups:
  v=[r for r in d if r['gsc_status']==g];o={'n':len(v),'metrics':{}}
  for m in metrics:
   vals=[r[m] for r in v if r[m] is not None];o['metrics'][m]={'n':len(vals),'median':med(vals),'q25':quant(vals,.25),'q75':quant(vals,.75)}
  out[g]=o
 return out
strata={'all':rows}
for t in sorted({r['page_type'] for r in rows}):strata['type:'+t]=[r for r in rows if r['page_type']==t]
for t,c in sorted({(r['page_type'],r['cluster']) for r in rows}):
 d=[r for r in rows if r['page_type']==t and r['cluster']==c]
 if len(d)>=8:strata['type-cluster:'+t+':'+c]=d
strata['early-paths-through-2026-07-27']=[r for r in rows if r['first_git_existence'][:10]<='2026-07-27'];strata['excluding-prior35.4']=[r for r in rows if not r['prior_35_4_change']]
summary={s:summarize(d) for s,d in strata.items()};effects=[];rng=random.Random(355)
for s,d in strata.items():
 for g in groups[1:]:
  a=[r for r in d if r['gsc_status']=='indexed'];b=[r for r in d if r['gsc_status']==g]
  if min(len(a),len(b))<3:continue
  for m in metrics:
   av=[r[m] for r in a if r[m] is not None];bv=[r[m] for r in b if r[m] is not None]
   if min(len(av),len(bv))<3:continue
   boots=[]
   for _ in range(400):boots.append(med(rng.choices(bv,k=len(bv)))-med(rng.choices(av,k=len(av))))
   effects.append(dict(stratum=s,comparison=g+' minus indexed',feature=m,n_indexed=len(av),n_negative=len(bv),median_indexed=med(av),median_negative=med(bv),median_difference=med(bv)-med(av),median_ratio=med(bv)/med(av) if med(av) else None,cliffs_delta_negative_vs_indexed=delta(bv,av),median_difference_bootstrap95_low=quant(boots,.025),median_difference_bootstrap95_high=quant(boots,.975),small_groups=min(len(av),len(bv))<10,exploratory=True))
(P/'group-statistics.json').write_text(json.dumps(summary,indent=2));f=(P/'exploratory-effect-sizes.csv').open('w');w=csv.DictWriter(f,fieldnames=list(effects[0]));w.writeheader();w.writerows(effects);f.close()
for s in ['all','type:product','type:guide','type:comparison','type-cluster:product:futterautomaten','type-cluster:product:trinkbrunnen','type-cluster:guide:futterautomaten','type-cluster:guide:trinkbrunnen']:
 print('\n'+s)
 for g in groups:
  v=summary[s][g];print(g,v['n'],{m:v['metrics'][m]['median'] for m in ['git_age_days','visible_main_words','recurrent_12token_fraction','documented_source_links','independent_primary_source_candidates','incoming_contextual_sources','incoming_contextual_indexed','max_related_tfidf_cosine']})
