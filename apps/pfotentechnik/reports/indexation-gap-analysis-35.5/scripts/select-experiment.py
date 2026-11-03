import json,random,math,datetime,hashlib,itertools
from pathlib import Path
P=Path('apps/pfotentechnik/reports/indexation-gap-analysis-35.5');rows=json.loads((P/'feature-matrix.json').read_text());by={r['route']:r for r in rows}
# Eligibility and subject blocks are fixed before drawing treatment assignment.
pool={
'product-dry-smart':{'/produkt/aqara-smart-pet-feeder-c1/':'Smart-Home-/Hub-Abhängigkeit ist genannt, aber eine konkrete Prüfung von lokalen Plänen, App-Statistik und tatsächlicher Portion fehlt.','/produkt/pawsync-smart-pet-feeder/':'Testreferenz und Waage sind genannt; Wiegeprotokoll, Verschieben/Entnahme und fehlende Tierzuordnung sind nicht als gemeinsamer Entscheidungsablauf erklärt.'},
'product-wet-local':{'/produkt/cat-mate-c200/':'Timerungenauigkeit ist genannt; zugängliche Sofortportion, Timerprüfung und Kühlakku-Grenze sind nicht als konkreter Einsatzplan verbunden.','/produkt/cat-mate-c500/':'Beschreibung bevorzugt lokale Nassfutterroutine; die Differenz zwischen fünf Fächern und späteren automatischen Öffnungen und die Kühlreserve bleiben im Urteil unscharf.'},
'product-wet-smart':{'/produkt/catit-pixi-smart-6-meal-feeder/':'Die Kühlakku-/Nassfuttergrenzen sind beschrieben, aber ohne konkreten Wiederanlauf-/Futterfreigabecheck. Der aktuelle externe Artikel behandelt tatsächlich den 6-Meal-Feeder; sein abweichender fountain-URLslug ist kein belegter Quellenfehler.','/produkt/petlibro-polar-wet-food-feeder/':'Aktive Kühlung wird eingeordnet; es fehlt ein konkretes, an der Anleitung ausgerichtetes Vorgehen bei Stromunterbrechung und erneuter Futterfreigabe.'},
'product-fountain-wired':{'/produkt/petkit-eversweet-solo-2-fountain/':'Der Erfahrungseinstieg über leise Brunnen ist austauschbar; abnehmbare Pumpeneinheit, Netzabhängigkeit und Reinigungsgrenzen werden nicht zu Modellentscheidung verbunden.','/produkt/petkit-eversweet-solo-se/':'Die Aussage einfache Technik reduziert Fehlbedienung ist nicht belegt; ein konkreter Verzicht-/Pflegecheck wäre überprüfbarer.'},
'product-fountain-cordless':{'/produkt/oneisall-3-5l-cordless-fountain/':'Der Sensormodus wird allgemein eingeordnet; Sensor-/Intervall-/Dauerbetrieb und passende Nutzung sind nicht modellbezogen erklärt.','/produkt/petlibro-dockstream-cordless/':'Die 30-Tage-Bedingung ist genannt; daraus folgt noch kein konkreter Test-/Lade- und Reservenapfplan.'},
'guide-feeder-mechanics':{'/wie-funktioniert-ein-futterautomat/':'Die technischen Aussagen zu lokaler Uhr, Ausgabe und Backup werden nur mit Ernährungsleitlinien belegt; passende technische Herstellerbeispiele fehlen.','/wie-laut-sind-automatische-futterautomaten/':'Es gibt sinnvolle Geräuschquellen, aber weder ein kontrolliertes Vergleichsprotokoll noch Belege für die pauschale alltagstaugliche PETKIT-Empfehlung.'},
'guide-feeder-choice':{'/welcher-futterautomat-ist-der-richtige/':'Die Entscheidungsmatrix hat keine konkreten externen Quellen zu Mikrochipzugang, Kühlung und Modellgrenzen; Aussage und Beleg sind nicht zugeordnet.','/futterautomat-hund/':'Die Rechenanleitung fordert zehn Ausgaben, zeigt dann fünf ohne Einordnung; der anschließende 240-g-Plan rundet zu 230,4 g pro Tag, ohne die Differenz explizit zu beziffern.'},
'guide-fountain-practical':{'/trinkbrunnen-seniorenkatzen/':'Beweglichkeit und Alternativnapf sind erklärt, aber ein einfacher Auswahl-/Zugangscheck mit Abbruchkriterien fehlt; keine Diagnose aus Alter ableiten.','/katzentrinkbrunnen-dauerbetrieb-urlaub/':'Vier Ausfallarten sind genannt, ein übergabefähiger Strom-/Pumpen-Ausfallcheck für die Betreuung fehlt; Stromkosten bleiben ohne transparentes Beispiel.','/trinkbrunnen-fuer-kitten-sicher/':'Sicherheitslisten und Bauformabschnitt wiederholen sich; ein beobachtbarer Gewöhnungsablauf mit Rückfall auf den Napf fehlt.','/katzentrinkbrunnen-ohne-filter/':'Vor- und Nachteile stehen ohne überprüfbares Modell-/Verbrauchsmaterial-Prüfschema nebeneinander; der Verzicht auf Kartuschen wird nicht sauber von übrigen Verschleißkosten getrennt berechnet.','/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/':'Edelstahl wird pauschal bevorzugt; Nickelallergie und Material-Hygieneaussagen sind nicht konkret belegt. Ein Bauteil-/Pflegevergleich ist belastbarer als das Materialetikett.','/trinkbrunnen-hund/':'Die einzige konkrete Fachquelle ist eine Katzentrink-Anleitung; ein Hundekaufleitfaden braucht passende Belege und eine nachvollziehbare Rechnung zu Filterkosten statt nur des Auftrags, sie zu berechnen.'}
}
def distance(a,b):
 return abs(a['git_age_days']-b['git_age_days'])/10+abs(a['home_click_depth']-b['home_click_depth'])*2+abs(math.log((a['incoming_contextual_sources']+1)/(b['incoming_contextual_sources']+1)))+abs(math.log(a['visible_main_words']/b['visible_main_words']))+abs(a['recurrent_12token_fraction']-b['recurrent_12token_fraction'])
def match(paths):
 if not paths:return 0,[]
 a=paths[0];options=[]
 for j in range(1,len(paths)):
  b=paths[j];x,y=by[a],by[b]
  if x['page_type']!=y['page_type'] or x['cluster']!=y['cluster'] or abs(x['git_age_days']-y['git_age_days'])>14 or abs(x['home_click_depth']-y['home_click_depth'])>1 or max(x['visible_main_words'],y['visible_main_words'])/min(x['visible_main_words'],y['visible_main_words'])>2.5:continue
  score,pairs=match(paths[1:j]+paths[j+1:]);options.append((score+distance(x,y),[(a,b)]+pairs))
 if not options:return float('inf'),[]
 return min(options,key=lambda z:(z[0],z[1]))
seed=35520261102;rng=random.Random(seed);pairs=[]
for block,paths in sorted(pool.items()):
 for path in paths:
  r=by[path];assert r['gsc_status']=='crawled-not-indexed' and not r['historical_migration'] and not r['prior_35_4_change'] and r['git_age_days']>=90 and r['http_status']==200 and r['indexable'] and r['in_sitemap']
 score,paired=match(sorted(paths));assert len(paired)*2==len(paths)
 for a,b in paired:
  treatment,control=(a,b) if rng.getrandbits(1) else (b,a);pairs.append(dict(pair_id='P'+str(len(pairs)+1).zfill(2),block=block,distance=distance(by[a],by[b]),treatment=by[treatment],control=by[control],treatment_gap=paths[treatment],control_gap=paths[control]))
assert len(pairs)==10
selection=dict(preparedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),seed=seed,assignment='random.Random(35520261102).getrandbits(1) per sorted block and minimum-distance pair; one treatment and one control per pair; no redraw',matching='Within manually pre-screened topic/technology blocks; exhaustive minimum total distance pairing, fixed eligibility; age <=14 days, depth <=1, visible-word ratio <=2.5. Cost = age difference/10 + 2*depth difference + absolute log(incoming contextual sources+1 ratio) + absolute log(visible-word ratio) + recurrent-span fraction difference. Source quality eligibility is a text-evidenced gap, not a numerical quality score.',candidates=pool,pairs=pairs,matrixSha256=hashlib.sha256((P/'indexation-feature-matrix.csv').read_bytes()).hexdigest(),baselineHead=json.loads((P/'worktree-baseline.json').read_text())['head'],registration='Prepared locally before any treatment content edit. Historical GSC only; not a current pre-release indexation baseline. Do not redraw or change controls after outcome observation.')
if (P/'selection-lock.json').exists():
 locked=json.loads((P/'selection-lock.json').read_text())
 actual=[(p['pair_id'],p['treatment']['canonical'],p['control']['canonical']) for p in pairs]
 expected=[(p['pair_id'],p['treatment']['canonical'],p['control']['canonical']) for p in locked['pairs']]
 assert actual==expected,'Allocation drift: existing lock must not be overwritten'
 (P/'selection-reproduction-check.json').write_text(json.dumps(dict(passAll=True,seed=seed,pairs=actual),indent=2))
else:
 (P/'selection-lock.json').write_text(json.dumps(selection,ensure_ascii=False,indent=2))
print('SEED',seed)
for p in pairs:print(p['pair_id'], 'TEST',p['treatment']['route'],'CONTROL',p['control']['route'],'d',round(p['distance'],2))
