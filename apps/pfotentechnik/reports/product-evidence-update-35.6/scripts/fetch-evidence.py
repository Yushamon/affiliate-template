"""Read-only source capture. Raw third-party HTML stays in /tmp; ledger stores hashes.

Run from repository root. Requires network access, no third-party dependencies.
"""
import concurrent.futures
import datetime
import hashlib
import json
import pathlib
import urllib.request
import sys
from zoneinfo import ZoneInfo
from html.parser import HTMLParser

ROOT = pathlib.Path('apps/pfotentechnik/reports/product-evidence-update-35.6')
CACHE = pathlib.Path('/tmp/pfotentechnik-evidence-35.6')
CACHE.mkdir(exist_ok=True)

class Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip = 0
        self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'nav', 'footer'):
            self.skip += 1
    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'nav', 'footer'):
            self.skip = max(0, self.skip - 1)
    def handle_data(self, data):
        if not self.skip and data.strip():
            self.parts.append(data.strip())

def capture(item):
    key, url = item
    result = dict(id=key, requestedUrl=url,
                  checkedOn=datetime.datetime.now(ZoneInfo('Europe/Berlin')).date().isoformat(),
                  fetchedAtUtc=datetime.datetime.now(datetime.timezone.utc).isoformat())
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; EditorialEvidenceReview/35.6)'})
        with urllib.request.urlopen(request, timeout=45) as response:
            body = response.read()
            result.update(httpStatus=response.status, finalUrl=response.url,
                          sha256=hashlib.sha256(body).hexdigest(), bytes=len(body))
        html = body.decode('utf-8', errors='replace')
        parser = Text()
        parser.feed(html)
        text = ' '.join(parser.parts)
        (CACHE / (key + '.html')).write_text(html)
        (CACHE / (key + '.txt')).write_text(text)
        if url.startswith('https://pfotentechnik.de/'):
            import re
            result['canonical'] = re.findall(r'<link\b[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)', html)
            result['forbiddenClaims'] = [p for p in [
                'kein integrierter akku', 'externe notstrom', 'separate batterie- oder notstrom',
                'netzbetrieb erforderlich', 'stromausfall', 'notstromversorgung'
            ] if p in text.lower()]
            result['batteryPresent'] = bool(re.search(r'integrierte[rnms]*.{0,30}(?:akku|wiederaufladbar)|\d+\s*mAh', text, re.I))
    except Exception as error:
        result['error'] = str(error)
    return result

if __name__ == '__main__':
    output = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'source-access.json'
    if output.exists():
        raise SystemExit('Evidence already exists; pass a new output JSON path to preserve the original observation.')
    sources = json.loads((ROOT / 'source-catalog.json').read_text())
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(capture, [(s['id'], s['url']) for s in sources]))
    output.write_text(json.dumps(results, indent=2, ensure_ascii=False) + '\n')
    for r in results:
        print(r['id'], r.get('httpStatus', r.get('error')), r.get('forbiddenClaims', ''))
