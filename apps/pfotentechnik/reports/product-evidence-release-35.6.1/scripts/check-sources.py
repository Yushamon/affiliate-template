"""Read-only verification; source bodies stay in the task's temporary directory."""
import concurrent.futures, datetime, hashlib, json, pathlib, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
CACHE=pathlib.Path('/tmp/pfotentechnik-release-35.6.1-sources');CACHE.mkdir(exist_ok=True)
SOURCES={
 'faz':'https://www.faz.net/kaufkompass/test/der-beste-futterautomat/',
 'one':'https://de.petlibro.com/products/one-rfid-pet-feeder?variant=53222683672942',
 'one-outlet':'https://de.petlibro.com/pages/what-should-i-do-if-the-one-rfid-feeder-food-outlet-is-blocked-or-if-there-are-foreign-objects-in-the-food-outlet-plaf301-af301',
 'granary-outlet':'https://petlibro.com/pages/what-should-i-do-if-the-granary-smart-feeder-food-outlet-is-blocked-or-if-there-are-foreign-objects-in-the-food-outlet-af103-plaf103',
 'tractive-psz':'https://tractive.com/en/fp/battery',
 'tractive-level':'https://help.tractive.com/hc/en-us/articles/360001743159-How-to-check-your-tracker-s-battery-level',
 'petkit-solo':'https://www.petkit.com/products/fresh-element-solo',
 'petkit-manuals':'https://www.petkit-eu.com/en-de/pages/user-manual',
 'solo-manual':'https://cdn.shopify.com/s/files/1/0739/0334/1803/files/D4_V1.2_20220729_manual.pdf?v=1768547185',
 'yumshare-manual':'https://cdn.shopify.com/s/files/1/0739/0334/1803/files/D4H_User_Manual_V1.1_20231122_EN.pdf?v=1768547053',
}
def get(item):
 key,url=item;r=dict(id=key,url=url,checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (EditorialEvidenceReview/35.6.1)'})
  with urllib.request.urlopen(req,timeout=45) as res:
   body=res.read();r.update(status=res.status,finalUrl=res.url,sha256=hashlib.sha256(body).hexdigest(),bytes=len(body));(CACHE/(key+('.pdf' if 'manual.pdf' in url.lower() or '_en.pdf' in url.lower() else '.html'))).write_bytes(body)
 except Exception as e:r['error']=str(e)
 return r
if __name__=='__main__':
 output=ROOT/'source-checks.json'
 if output.exists():raise SystemExit('Original source observation already exists; preserve it.')
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:rows=list(executor.map(get,SOURCES.items()))
 output.write_text(json.dumps(rows,indent=2)+'\n')
 for row in rows:print(row['id'],row.get('status',row.get('error')))
