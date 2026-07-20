#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil
import sys

REL = Path("apps/pfotentechnik/src/pages/hersteller/[manufacturer].astro")
OLD_MARKER = "/* manufacturer-dark-mode-5.2 */"
NEW_MARKER = "/* manufacturer-dark-mode-5.2.1 */"

NEW_BLOCK = r'''
  /* manufacturer-dark-mode-5.2.1 */
  @media (prefers-color-scheme: dark) {
    .manufacturer-detail {
      --green: var(--pt-theme-accent, #58d391);
      --dark: var(--pt-theme-text, #f7fafc);
      --muted: var(--pt-theme-text-soft, #d7e0eb);
      --border: var(--pt-theme-border, rgba(226, 232, 240, 0.13));
      color: var(--pt-theme-text-soft, #d7e0eb);
    }

    .manufacturer-hero {
      border-color: var(--border);
      background: linear-gradient(145deg, var(--pt-theme-surface, #111d2f), var(--pt-theme-canvas-elevated, #0c1728));
      box-shadow: var(--pt-theme-shadow-sm, 0 14px 38px rgb(0 0 0 / 28%));
    }

    .manufacturer-hero h1,
    .manufacturer-hero .recommendation,
    .manufacturer-section h2,
    .product-card h3,
    .product-card h3 a,
    .alternative-grid h3,
    .series-grid h3,
    .decision-grid h2,
    .strength-grid h3,
    .product-list strong,
    .sources summary {
      color: var(--pt-theme-text, #f7fafc);
    }

    .manufacturer-hero p,
    .rating span,
    .manufacturer-stats span,
    .decision-grid li,
    .strength-grid li,
    .product-card p,
    .product-card li,
    .series-grid p,
    .series-grid li,
    .alternative-grid p,
    .product-list div span,
    .experience > p,
    .experience aside p,
    .sources li {
      color: var(--pt-theme-text-soft, #d7e0eb);
    }

    .manufacturer-stats div,
    .decision-grid article,
    .strength-grid article,
    .product-card,
    .series-grid article,
    .alternative-grid a,
    .product-list > a,
    .sources {
      border-color: var(--pt-theme-border, rgba(226, 232, 240, 0.13));
      background: var(--pt-theme-surface, #111d2f);
      color: var(--pt-theme-text-soft, #d7e0eb);
      box-shadow: var(--pt-theme-shadow-sm, 0 14px 38px rgb(0 0 0 / 28%));
    }

    .decision-grid .attention,
    .strength-grid .weakness {
      border-color: color-mix(in srgb, var(--pt-theme-warning, #f9b75f) 24%, var(--pt-theme-border));
      background: var(--pt-theme-warning-soft, rgba(245, 158, 11, 0.14));
    }

    .experience aside {
      border-left-color: var(--pt-theme-accent, #58d391);
      background: var(--pt-theme-success-soft, rgba(34, 197, 94, 0.14));
      color: var(--pt-theme-text-soft, #d7e0eb);
    }

    .product-card > :global(img),
    .product-list :global(img),
    .alternative-grid :global(img) {
      background: #f5f7f6;
    }

    .website,
    .product-link,
    .product-list b,
    .product-score strong,
    .rating strong,
    .manufacturer-stats strong {
      color: var(--pt-theme-accent, #58d391);
    }

    .manufacturer-detail :global(.faq-item),
    .manufacturer-detail :global(details) {
      border-color: var(--pt-theme-border, rgba(226, 232, 240, 0.13));
      background: var(--pt-theme-surface, #111d2f);
      color: var(--pt-theme-text-soft, #d7e0eb);
    }

    .manufacturer-detail :global(.faq-item summary),
    .manufacturer-detail :global(details summary),
    .manufacturer-detail :global(.faq-question) {
      color: var(--pt-theme-text, #f7fafc);
    }

    .manufacturer-detail :global(.faq-answer),
    .manufacturer-detail :global(details p) {
      color: var(--pt-theme-text-soft, #d7e0eb);
    }
  }
'''

def fail(message):
    print(f"Fehler: {message}", file=sys.stderr)
    raise SystemExit(1)

root = None
cwd = Path.cwd().resolve()
for candidate in [cwd, *cwd.parents]:
    if (candidate / REL).exists():
        root = candidate
        break

if root is None:
    fail("Repository-Root nicht gefunden.")

target = root / REL
source = target.read_text(encoding="utf-8")

if NEW_MARKER in source:
    print("Hotfix 5.2.1 ist bereits angewendet.")
    raise SystemExit(0)

style_end = source.rfind("</style>")
if style_end < 0:
    fail("</style> nicht gefunden.")

if OLD_MARKER in source:
    old_start = source.index(OLD_MARKER)
    source = source[:old_start].rstrip() + "\n"
    style_end = source.rfind("</style>")

backup = root / f".manufacturer-dark-mode-5.2.1-backup-{datetime.now().strftime('%Y-%m-%dT%H-%M-%S')}" / REL
backup.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(target, backup)

updated = source[:style_end].rstrip() + "\n\n" + NEW_BLOCK.strip() + "\n" + source[style_end:]
target.write_text(updated, encoding="utf-8")

print("Manufacturer Dark Mode Hotfix 5.2.1 erfolgreich angewendet.")
print(f"Geändert: {REL}")
print("Danach ausführen:")
print("  npm run build:pfotentechnik")
