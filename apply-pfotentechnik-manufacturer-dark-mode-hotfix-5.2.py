#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil, sys

REL = Path("apps/pfotentechnik/src/pages/hersteller/[manufacturer].astro")
MARKER = "/* manufacturer-dark-mode-5.2 */"

CSS = r'''
  /* manufacturer-dark-mode-5.2 */
  :global(html[data-theme="dark"]) .manufacturer-detail {
    --green: #4ade80;
    --dark: #f4f7f6;
    --muted: #b8c4c8;
    --border: #314654;
    color: #e8efed;
  }

  :global(html[data-theme="dark"]) .manufacturer-hero {
    border-color: var(--border);
    background: linear-gradient(145deg, #132432, #0d1d29);
    box-shadow: 0 18px 48px rgb(0 0 0 / 22%);
  }

  :global(html[data-theme="dark"]) .manufacturer-hero h1,
  :global(html[data-theme="dark"]) .manufacturer-hero .recommendation,
  :global(html[data-theme="dark"]) .manufacturer-section h2,
  :global(html[data-theme="dark"]) .product-card h3,
  :global(html[data-theme="dark"]) .product-card h3 a,
  :global(html[data-theme="dark"]) .alternative-grid h3,
  :global(html[data-theme="dark"]) .series-grid h3,
  :global(html[data-theme="dark"]) .decision-grid h2,
  :global(html[data-theme="dark"]) .strength-grid h3,
  :global(html[data-theme="dark"]) .product-list strong,
  :global(html[data-theme="dark"]) .sources summary {
    color: #f4f7f6;
  }

  :global(html[data-theme="dark"]) .manufacturer-hero p,
  :global(html[data-theme="dark"]) .rating span,
  :global(html[data-theme="dark"]) .manufacturer-stats span,
  :global(html[data-theme="dark"]) .decision-grid li,
  :global(html[data-theme="dark"]) .strength-grid li,
  :global(html[data-theme="dark"]) .product-card p,
  :global(html[data-theme="dark"]) .product-card li,
  :global(html[data-theme="dark"]) .series-grid p,
  :global(html[data-theme="dark"]) .series-grid li,
  :global(html[data-theme="dark"]) .alternative-grid p,
  :global(html[data-theme="dark"]) .product-list div span,
  :global(html[data-theme="dark"]) .experience > p,
  :global(html[data-theme="dark"]) .experience aside p,
  :global(html[data-theme="dark"]) .sources li {
    color: #b8c4c8;
  }

  :global(html[data-theme="dark"]) .manufacturer-stats div,
  :global(html[data-theme="dark"]) .decision-grid article,
  :global(html[data-theme="dark"]) .strength-grid article,
  :global(html[data-theme="dark"]) .product-card,
  :global(html[data-theme="dark"]) .series-grid article,
  :global(html[data-theme="dark"]) .alternative-grid a,
  :global(html[data-theme="dark"]) .product-list > a,
  :global(html[data-theme="dark"]) .sources {
    border-color: var(--border);
    background: #132432;
    color: #e8efed;
    box-shadow: 0 14px 34px rgb(0 0 0 / 16%);
  }

  :global(html[data-theme="dark"]) .decision-grid .attention,
  :global(html[data-theme="dark"]) .strength-grid .weakness {
    background: #241f1b;
    border-color: #554536;
  }

  :global(html[data-theme="dark"]) .experience aside {
    border-left-color: #4ade80;
    background: #132a25;
    color: #e8efed;
  }

  :global(html[data-theme="dark"]) .product-card > :global(img),
  :global(html[data-theme="dark"]) .product-list :global(img),
  :global(html[data-theme="dark"]) .alternative-grid :global(img) {
    background: #f5f7f6;
  }

  :global(html[data-theme="dark"]) .website,
  :global(html[data-theme="dark"]) .product-link,
  :global(html[data-theme="dark"]) .product-list b,
  :global(html[data-theme="dark"]) .product-score strong,
  :global(html[data-theme="dark"]) .rating strong,
  :global(html[data-theme="dark"]) .manufacturer-stats strong {
    color: #4ade80;
  }

  :global(html[data-theme="dark"]) .manufacturer-detail :global(.faq-item),
  :global(html[data-theme="dark"]) .manufacturer-detail :global(details) {
    border-color: var(--border);
    background: #132432;
    color: #e8efed;
  }

  :global(html[data-theme="dark"]) .manufacturer-detail :global(.faq-item summary),
  :global(html[data-theme="dark"]) .manufacturer-detail :global(details summary),
  :global(html[data-theme="dark"]) .manufacturer-detail :global(.faq-question) {
    color: #f4f7f6;
  }

  :global(html[data-theme="dark"]) .manufacturer-detail :global(.faq-answer),
  :global(html[data-theme="dark"]) .manufacturer-detail :global(details p) {
    color: #b8c4c8;
  }
'''

def fail(msg):
    print("Fehler:", msg, file=sys.stderr)
    raise SystemExit(1)

root = None
start = Path.cwd().resolve()
for candidate in [start, *start.parents]:
    if (candidate / REL).exists():
        root = candidate
        break
if root is None:
    fail("Repository-Root nicht gefunden.")

target = root / REL
source = target.read_text(encoding="utf-8")
if MARKER in source:
    print("Hotfix bereits angewendet.")
    raise SystemExit(0)

for fragment in [".manufacturer-hero {", ".decision-grid article, .strength-grid article", ".experience aside"]:
    if fragment not in source:
        fail(f"Erwarteter Dateistand fehlt: {fragment}")

pos = source.rfind("</style>")
if pos < 0:
    fail("</style> nicht gefunden.")

backup = root / f".manufacturer-dark-mode-5.2-backup-{datetime.now().strftime('%Y-%m-%dT%H-%M-%S')}" / REL
backup.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(target, backup)

target.write_text(source[:pos].rstrip() + "\n\n" + CSS.strip() + "\n" + source[pos:], encoding="utf-8")
print("Manufacturer Dark Mode Hotfix 5.2 angewendet.")
print("Geändert:", REL)
print("Backup:", backup.parents[len(REL.parts)-1])
print("Danach: npm run build:pfotentechnik")
