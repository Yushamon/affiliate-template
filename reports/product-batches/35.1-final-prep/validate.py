"""Run existing audits and retain their results without replacing baseline reports."""
from pathlib import Path
import json
import subprocess
import re
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
        print(name, result.returncode, flush=True)
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
        'noMissingProductLinks': not any('/neakasa-riko/' in href or '/neakasa-m9/' in href for href in document.links),
        'hubIntegration': f'/{slug}/' in (dist / 'smarte-haustiertechnik/index.html').read_text(encoding='utf-8'),
        'knowledgeIntegration': f'/{slug}/' in (dist / 'wissen/index.html').read_text(encoding='utf-8'),
        'noDraftMarkers': 'DRAFT_ONLY' not in html and '[interner Link nach Go-Live]' not in html,
        'noMissingMediaReferences': 'images/products/neakasa-riko/' not in html and 'images/products/neakasa-m9/' not in html,
    }
    results['guide-output'] = checks
    print('guide-output', checks, flush=True)
finally:
    for name, content in before.items():
        if (root / name).read_bytes() != content:
            (root / name).write_bytes(content)
    (Path(__file__).parent / 'validation.json').write_text(json.dumps(results, indent=2) + '\n', encoding='utf-8')

if any(result.get('exitCode', 0) for result in results.values()) or not all(results.get('guide-output', {}).values()):
    raise SystemExit(1)
