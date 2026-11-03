"""Restore frozen analysis fixtures only; does not checkout files or call any API."""
import gzip,json
from pathlib import Path
root=Path(__file__).resolve().parents[1];target=Path('/tmp/gap-35-5');target.mkdir(exist_ok=True)
for name in ['rendered-before.json','enriched-pages.json','source-data-before.json','git-editorial-history.json']:
 with gzip.open(root/('baseline-'+name+'.gz'),'rb') as f:(target/name).write_bytes(f.read())
with gzip.open(root/'experiment-html-before.json.gz','rt') as f:html=json.load(f)
for url,text in html.items():
 route=url.removeprefix('https://pfotentechnik.de/');file=target/'html-before'/route/'index.html';file.parent.mkdir(parents=True,exist_ok=True);file.write_text(text)
print('Frozen pre-intervention inputs restored; source files, selection lock and GSC observations unchanged.')
