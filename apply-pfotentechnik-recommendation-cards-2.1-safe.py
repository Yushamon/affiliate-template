#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import subprocess, sys
DOMAIN = Path('apps/pfotentechnik/src/domain/recommendationLinks.ts')
COMPONENT = Path('apps/pfotentechnik/src/components/DecisionNextSteps.astro')
def stop(message):
    print(f"FEHLER: {message}", file=sys.stderr)
    raise SystemExit(1)
def find_root(start):
    for candidate in (start, *start.parents):
        if (candidate / "apps/pfotentechnik/package.json").is_file(): return candidate
    stop("Repository-Root nicht gefunden.")
def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1: stop(f"{label}: genau 1 Fundstelle erwartet, gefunden: {count}")
    return text.replace(old, new, 1)
def run(command, cwd):
    print("$", " ".join(command))
    if subprocess.run(command, cwd=cwd).returncode != 0:
        raise RuntimeError("Befehl fehlgeschlagen: " + " ".join(command))
root = find_root(Path.cwd().resolve())
for relative in [DOMAIN, COMPONENT]:
    if not (root / relative).is_file(): stop(f"Datei fehlt: {relative}")
domain_original = (root / DOMAIN).read_text(encoding="utf-8")
component_original = (root / COMPONENT).read_text(encoding="utf-8")
if "recommendation-cards-2.1" in component_original: stop("Recommendation Cards 2.1 scheint bereits installiert zu sein.")
domain = replace_once(domain_original, "const comparisonLink = (entry: RecommendationEntry): RecommendationLink => ({\n  kind: \"comparison\",\n  eyebrow: \"Vergleich\",\n  title: entry.data.title,\n  text: entry.data.description ?? \"Vergleiche passende Modelle direkt miteinander.\",\n  href: `/vergleiche/${entry.data.slug}/`,\n  label: \"Zum Vergleich\",\n  stat: {\n    value: String(asArray(entry.data.items).length || \"Alle\"),\n    label: asArray(entry.data.items).length === 1 ? \"Modell\" : \"Modelle\"\n  },\n  highlights: [\n    \"Pfotentechnik-Score\",\n    \"Modelle direkt filtern\",\n    \"Stärken und Grenzen vergleichen\"\n  ]\n});", "const comparisonLink = (\n  entry: RecommendationEntry,\n  products: RecommendationEntry[] = []\n): RecommendationLink => {\n  const explicitSlugs = asArray(entry.data.items)\n    .map((item) =>\n      typeof item === \"string\"\n        ? item\n        : typeof item === \"object\" && item\n          ? String((item as Record<string, any>).slug ?? \"\")\n          : \"\"\n    )\n    .filter(Boolean);\n\n  const automaticSlugs = products\n    .filter((product) =>\n      asArray(product.data.comparisons).includes(entry.data.slug)\n    )\n    .map((product) => String(product.data.slug))\n    .filter(Boolean);\n\n  const modelCount = new Set([\n    ...explicitSlugs,\n    ...automaticSlugs\n  ]).size;\n\n  return {\n    kind: \"comparison\",\n    eyebrow: \"Vergleich\",\n    title: entry.data.title,\n    text:\n      entry.data.description ??\n      \"Vergleiche passende Modelle direkt miteinander.\",\n    href: `/vergleiche/${entry.data.slug}/`,\n    label: \"Zum Vergleich\",\n    stat: {\n      value: modelCount > 0 ? String(modelCount) : \"Alle\",\n      label: modelCount === 1 ? \"Modell\" : \"Modelle\"\n    },\n    highlights: [\n      \"Pfotentechnik-Score\",\n      \"Modelle direkt filtern\",\n      \"Stärken und Grenzen vergleichen\"\n    ]\n  };\n};", "Vergleichszählung")
domain = replace_once(domain, "  const product = getBestProduct(page, products);\n  const comparison = getBestComparison(page, comparisons);\n  return [...(product ? [productLink(product)] : []), ...(comparison ? [comparisonLink(comparison)] : [])].slice(0, 2);", "  const product = getBestProduct(page, products);\n  const comparison = getBestComparison(page, comparisons);\n  return [\n    ...(product ? [productLink(product)] : []),\n    ...(comparison ? [comparisonLink(comparison, products)] : [])\n  ].slice(0, 2);", "Money-Page Vergleichsaufruf")
component = component_original.rstrip() + "\n\n<style is:global>\n  /* recommendation-cards-2.1 */\n  .pt-next-steps[data-feature=\"recommendation-cards-2.0\"] {\n    --next-bg:\n      radial-gradient(circle at top right, rgba(99, 230, 163, 0.11), transparent 36%),\n      linear-gradient(145deg, #102239 0%, #0d1d31 100%);\n    --next-card: linear-gradient(145deg, rgba(22, 43, 66, 0.98), rgba(18, 36, 57, 0.98));\n    --next-border: rgba(148, 180, 202, 0.22);\n    --next-text: #f8fafc;\n    --next-muted: #c8d3de;\n    --next-accent: #63e6a3;\n\n    border-color: rgba(148, 180, 202, 0.2);\n    background: var(--next-bg);\n    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);\n  }\n\n  .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n    .pt-next-steps__card {\n    border-color: var(--next-border);\n    background: var(--next-card);\n  }\n\n  .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n    .pt-next-steps__card--product {\n    border-color: rgba(99, 230, 163, 0.44);\n    background:\n      linear-gradient(145deg, rgba(31, 75, 73, 0.72), rgba(20, 42, 61, 0.96));\n  }\n\n  .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n    .pt-next-steps__highlights,\n  .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n    .pt-next-steps__highlights li {\n    background: transparent !important;\n    box-shadow: none !important;\n  }\n\n  .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n    .pt-next-steps__highlights li {\n    padding: 0 0 0 1.25rem !important;\n    border: 0 !important;\n    color: var(--next-muted) !important;\n    font-weight: 650;\n  }\n\n  .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n    .pt-next-steps__highlights li::before {\n    content: \"✓\" !important;\n    color: var(--next-accent) !important;\n  }\n\n  .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n    .pt-next-steps__media {\n    background: #f5f7f8;\n  }\n\n  @media (max-width: 520px) {\n    .pt-next-steps[data-feature=\"recommendation-cards-2.0\"] {\n      padding: 1rem;\n    }\n\n    .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n      .pt-next-steps__card--product {\n      grid-template-columns: 96px minmax(0, 1fr);\n    }\n\n    .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n      .pt-next-steps__highlights li {\n      font-size: 0.84rem;\n    }\n  }\n</style>\n" + "\n"
stamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".recommendation-cards-2.1-backup-{stamp}"
backup.mkdir(parents=True, exist_ok=False)
for relative, content in [(DOMAIN, domain_original), (COMPONENT, component_original)]:
    dest = backup / relative
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(content, encoding="utf-8")
try:
    (root / DOMAIN).write_text(domain, encoding="utf-8")
    (root / COMPONENT).write_text(component, encoding="utf-8")
    run(["npm", "run", "build:pfotentechnik"], root)
    package = (root / "apps/pfotentechnik/package.json").read_text(encoding="utf-8")
    if "\"audit:recommendations\"" in package:
        run(["npm", "--workspace", "apps/pfotentechnik", "run", "audit:recommendations"], root)
except Exception as exc:
    print(f"Validierung fehlgeschlagen: {exc}", file=sys.stderr)
    print("Automatischer Rollback wird ausgeführt.", file=sys.stderr)
    (root / DOMAIN).write_text(domain_original, encoding="utf-8")
    (root / COMPONENT).write_text(component_original, encoding="utf-8")
    raise SystemExit(1)
print("Recommendation Cards 2.1 erfolgreich installiert.")
print(f"Backup: {backup}")
