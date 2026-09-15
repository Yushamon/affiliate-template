"""Run existing audits and retain their results without replacing baseline reports."""
from pathlib import Path
import json
import subprocess
import re
import sys
from html.parser import HTMLParser

root = Path(__file__).resolve().parents[3]
logs = root / '.patch-backups/35.1-final-prep'
tracked = subprocess.check_output(['git', 'ls-files', 'apps/pfotentechnik/reports', 'reports'], cwd=root, text=True).splitlines()
before = {name: (root / name).read_bytes() for name in tracked if (root / name).is_file()}
commands = {
    'products': ['node', 'apps/pfotentechnik/scripts/audit-product-data.mjs', '--strict'],
    'internal-links': ['node', 'scripts/audit-internal-links.mjs', '--strict'],
    'link-targets': ['node', 'apps/pfotentechnik/scripts/audit-internal-link-targets.mjs', '--strict'],
    'seo-build-output': ['node', 'apps/pfotentechnik/scripts/seo/audit-release-build-output.mjs', '--strict'],
}
if '--source-only' in sys.argv:
    commands = {name: command for name, command in commands.items() if name in ['products', 'internal-links']}
results = {}

class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.h1 = 0
        self.canonicals = []
        self.robots = []
        self.links = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'h1': self.h1 += 1
        if tag == 'link' and attrs.get('rel') == 'canonical': self.canonicals.append(attrs.get('href'))
        if tag == 'meta' and attrs.get('name') == 'robots': self.robots.append(attrs.get('content'))
        if tag == 'a': self.links.append(attrs.get('href', ''))

try:
    for name, command in commands.items():
        with (logs / f'{name}.log').open('w', encoding='utf-8') as output:
            result = subprocess.run(command, cwd=root, stdout=output, stderr=subprocess.STDOUT)
        results[name] = {'command': command, 'exitCode': result.returncode}
        if name == 'products':
            audit = json.loads((root / 'apps/pfotentechnik/reports/product-data-audit.json').read_text(encoding='utf-8'))
            results[name]['summary'] = audit['summary']
            results[name]['riko'] = next((p for p in audit['products'] if p.get('slug') == 'neakasa-riko'), None)
        print(name, result.returncode, flush=True)
    if '--source-only' in sys.argv:
        raise SystemExit(1 if any(result['exitCode'] for result in results.values()) else 0)
    dist = root / 'apps/pfotentechnik/dist'
    slug = 'ifa-2026-haustiertechnik'
    html = (dist / slug / 'index.html').read_text(encoding='utf-8')
    document = Document()
    document.feed(html)
    schemas = [json.loads(s) for s in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S)]
    sitemap = '\n'.join(p.read_text(encoding='utf-8') for p in dist.glob('sitemap*.xml'))
    checks = {
        'singleH1': document.h1 == 1,
        'canonical': document.canonicals == [f'https://pfotentechnik.de/{slug}/'],
        'indexable': not any('noindex' in value for value in document.robots),
        'inSitemap': f'https://pfotentechnik.de/{slug}/' in sitemap,
        'articleSchema': any('Article' in json.dumps(schema) for schema in schemas),
        'rikoLinked': '/produkt/neakasa-riko/' in document.links,
        'noMissingProductLinks': not any('/neakasa-m9/' in href for href in document.links),
        'hubIntegration': f'/{slug}/' in (dist / 'smarte-haustiertechnik/index.html').read_text(encoding='utf-8'),
        'knowledgeIntegration': f'/{slug}/' in (dist / 'wissen/index.html').read_text(encoding='utf-8'),
        'noDraftMarkers': 'DRAFT_ONLY' not in html and '[interner Link nach Go-Live]' not in html,
        'noMissingMediaReferences': 'images/products/neakasa-riko/' not in html and 'images/products/neakasa-m9/' not in html,
    }
    results['guide-output'] = checks
    print('guide-output', checks, flush=True)
    riko_html = (dist / 'produkt/neakasa-riko/index.html').read_text(encoding='utf-8')
    riko_document = Document()
    riko_document.feed(riko_html)
    riko_schemas = [json.loads(s) for s in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', riko_html, re.S)]
    product_schema = next((schema for schema in riko_schemas if schema.get('@type') == 'Product'), {})
    riko_checks = {
        'singleH1': riko_document.h1 == 1,
        'canonical': riko_document.canonicals == ['https://pfotentechnik.de/produkt/neakasa-riko/'],
        'indexable': not any('noindex' in value for value in riko_document.robots),
        'inSitemap': 'https://pfotentechnik.de/produkt/neakasa-riko/' in sitemap,
        'productSchema': bool(product_schema),
        'noInStockOffer': 'offers' not in product_schema,
        'preorderDisclosed': 'Vorbestellung' in riko_html and '21. September' in riko_html,
        'manufacturerLinked': '/hersteller/neakasa/' in riko_document.links,
        'categoryLinked': '/smarte-futterautomaten/' in riko_document.links,
        'manufacturerIntegration': '/produkt/neakasa-riko/' in (dist / 'hersteller/neakasa/index.html').read_text(encoding='utf-8'),
        'categoryIntegration': '/produkt/neakasa-riko/' in (dist / 'smarte-futterautomaten/index.html').read_text(encoding='utf-8'),
    }
    results['riko-output'] = riko_checks
    print('riko-output', riko_checks, flush=True)
finally:
    for name, content in before.items():
        if (root / name).read_bytes() != content:
            (root / name).write_bytes(content)
    filename = 'validation-source.json' if '--source-only' in sys.argv else 'validation.json'
    (Path(__file__).parent / filename).write_text(json.dumps(results, indent=2) + '\n', encoding='utf-8')

if any(result.get('exitCode', 0) for result in results.values()) or not all(results.get('guide-output', {}).values()) or not all(results.get('riko-output', {}).values()):
    raise SystemExit(1)
