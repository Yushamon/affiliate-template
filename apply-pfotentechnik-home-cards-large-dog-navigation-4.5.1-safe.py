#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import subprocess, sys
DOMAIN = Path('apps/pfotentechnik/src/domain/recommendationLinks.ts')
SLUG = Path('apps/pfotentechnik/src/pages/[slug].astro')
HOME_CSS = Path('packages/affiliate-core/src/components/home/home.css')
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
for relative in [DOMAIN, SLUG, HOME_CSS, REGISTRY, PROJECT_CONFIG, HEADER_CSS]:
    if not (root / relative).is_file(): stop(f"Datei fehlt: {relative}")
originals = {relative: (root / relative).read_text(encoding="utf-8") for relative in [DOMAIN, SLUG, HOME_CSS, REGISTRY, PROJECT_CONFIG, HEADER_CSS]}
if "pfotentechnik-home-cards-and-large-dog-safety-4.5.1" in originals[HOME_CSS]:
    stop("Patch 4.5.1 scheint bereits installiert zu sein.")
domain = replace_once(originals[DOMAIN], "export const getBestProduct = (\n  source: Record<string, any>, products: RecommendationEntry[]\n) => rank(\n  source,\n  products.filter((entry) => ![\"discontinued\", \"legacy\"].includes(entry.data.productStatus)),\n  (entry) => Math.min(Number(entry.data.score ?? 0) / 15, 7) + Math.min(Number(entry.data.rating ?? 0), 5)\n)[0]?.entry;", "const isExplicitlySuitableForSource = (\n  source: Record<string, any>,\n  candidate: RecommendationEntry\n) => {\n  const sourceContext = buildContext(source);\n  const candidateContext = buildContext(candidate.data);\n\n  if (sourceContext.animal && candidateContext.animal) {\n    if (sourceContext.animal !== candidateContext.animal) return false;\n  }\n\n  if (sourceContext.petSize === \"large\") {\n    const explicitSizes = asArray(candidate.data.comparisonFilters?.petSize)\n      .map((value) => String(value));\n\n    if (!explicitSizes.includes(\"large\")) return false;\n  }\n\n  return true;\n};\n\nexport const getBestProduct = (\n  source: Record<string, any>, products: RecommendationEntry[]\n) => rank(\n  source,\n  products.filter(\n    (entry) =>\n      ![\"discontinued\", \"legacy\"].includes(entry.data.productStatus) &&\n      isExplicitlySuitableForSource(source, entry)\n  ),\n  (entry) => Math.min(Number(entry.data.score ?? 0) / 15, 7) + Math.min(Number(entry.data.rating ?? 0), 5)\n)[0]?.entry;", "strikte Produkteignung")
slug = replace_once(originals[SLUG], "const journeyTopProduct = journeyProducts[0];\nconst journeyFallbackProduct = comparisonProductEntries\n  .slice()\n  .sort((a, b) =>\n    (b.data.score ?? toEditorialScore(b.data.rating, 5)) -\n    (a.data.score ?? toEditorialScore(a.data.rating, 5))\n  )[0];\nconst journeyRecommendedProduct =\n  journeyTopProduct ?? journeyFallbackProduct;\nconst journeyHasExactMatch = Boolean(journeyTopProduct);", "const journeyTopProduct = journeyProducts[0];\nconst journeyMayUseFallback =\n  !recommendationJourney?.petSize ||\n  recommendationJourney.petSize !== \"large\";\nconst journeyFallbackProduct = journeyMayUseFallback\n  ? comparisonProductEntries\n      .slice()\n      .sort((a, b) =>\n        (b.data.score ?? toEditorialScore(b.data.rating, 5)) -\n        (a.data.score ?? toEditorialScore(a.data.rating, 5))\n      )[0]\n  : undefined;\nconst journeyRecommendedProduct =\n  journeyTopProduct ?? journeyFallbackProduct;\nconst journeyHasExactMatch = Boolean(journeyTopProduct);", "Fallback für große Hunde deaktivieren")
home_css = originals[HOME_CSS].rstrip() + "\n\n/* pfotentechnik-home-cards-and-large-dog-safety-4.5.1 */\n.home41-decision__grid {\n  gap: clamp(1rem, 2vw, 1.4rem);\n}\n\n.home41-decision__card {\n  overflow: hidden;\n  border: 1px solid rgba(148, 180, 202, 0.22);\n  border-radius: 1.5rem;\n  background: #102239;\n  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.18);\n}\n\n.home41-decision__media {\n  position: relative;\n  aspect-ratio: 16 / 10;\n  overflow: hidden;\n  background: #0f1f33;\n}\n\n.home41-decision__media picture,\n.home41-decision__media img {\n  width: 100%;\n  height: 100%;\n}\n\n.home41-decision__media img {\n  object-fit: cover;\n  object-position: center;\n}\n\n.home41-decision__media::after {\n  position: absolute;\n  inset: 0;\n  background:\n    linear-gradient(180deg, transparent 48%, rgba(8, 22, 35, 0.5) 100%);\n  content: \"\";\n  pointer-events: none;\n}\n\n.home41-decision__media > span {\n  display: none;\n}\n\n.home41-decision__content {\n  padding: 1.35rem 1.4rem 1.5rem;\n  color: #f8fafc;\n  background: #102239;\n}\n\n.home41-decision__animal {\n  color: #63e6a3;\n  font-size: 0.74rem;\n  font-weight: 850;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n}\n\n.home41-decision__content h3 {\n  max-width: 18ch;\n  margin: 0.45rem 0 0;\n  color: #f8fafc;\n  font-size: clamp(1.45rem, 3vw, 2rem);\n  line-height: 1.08;\n  text-wrap: balance;\n}\n\n.home41-decision__content > p {\n  display: -webkit-box;\n  margin: 0.75rem 0 0;\n  overflow: hidden;\n  color: #c7d3df;\n  line-height: 1.55;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 2;\n}\n\n.home41-decision__meta {\n  display: flex;\n  margin-top: 1rem;\n  align-items: center;\n  justify-content: space-between;\n  gap: 0.75rem;\n}\n\n.home41-decision__meta strong {\n  display: inline-flex;\n  min-height: 34px;\n  align-items: center;\n  padding: 0.42rem 0.72rem;\n  border: 1px solid rgba(99, 230, 163, 0.22);\n  border-radius: 999px;\n  color: #e8fff1;\n  background: rgba(99, 230, 163, 0.12);\n  font-size: 0.82rem;\n}\n\n.home41-decision__meta small {\n  color: #9fb0c1;\n}\n\n.home41-decision__highlights {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.45rem;\n  margin: 0.9rem 0 0;\n  padding: 0;\n  list-style: none;\n}\n\n.home41-decision__highlights li {\n  padding: 0.34rem 0.58rem;\n  border: 1px solid rgba(148, 180, 202, 0.16);\n  border-radius: 999px;\n  color: #c7d3df;\n  background: rgba(255, 255, 255, 0.04);\n  font-size: 0.72rem;\n}\n\n.home41-decision__content > b {\n  display: inline-flex;\n  margin-top: 1.05rem;\n  color: #63e6a3;\n  font-size: 0.92rem;\n}\n\n.home41-decision__quick-icon {\n  top: auto;\n  right: auto;\n  bottom: calc(48% - 1.35rem);\n  left: 1.25rem;\n  z-index: 2;\n}\n\n.home41-decision__arrow {\n  right: 1.2rem;\n  bottom: calc(48% - 1.05rem);\n  z-index: 2;\n}\n\n@media (max-width: 720px) {\n  .home41-decision__grid {\n    grid-template-columns: 1fr;\n  }\n\n  .home41-decision__card {\n    border-radius: 1.35rem;\n  }\n\n  .home41-decision__media {\n    aspect-ratio: 4 / 3;\n  }\n\n  .home41-decision__content {\n    padding: 1.15rem 1.2rem 1.3rem;\n  }\n\n  .home41-decision__content > p {\n    -webkit-line-clamp: 2;\n  }\n\n  .home41-decision__quick-icon {\n    bottom: calc(52% - 1.3rem);\n  }\n\n  .home41-decision__arrow {\n    bottom: calc(52% - 1rem);\n  }\n}\n" + "\n"

registry = originals[REGISTRY]
if 'import { projectConfig } from "../../project.config";' not in registry:
    registry = registry.replace(
        'import type { ImageMetadata } from "astro";',
        'import type { ImageMetadata } from "astro";\nimport { projectConfig } from "../../project.config";',
        1
    )

old_nav_return = """    return items.filter(
      (item, index) =>
        items.findIndex(
          (candidate) =>
            candidate.href === item.href
        ) === index
    );
  };"""

new_nav_return = """    const baseItems = (projectConfig.headerLinks ?? []).map(
      (item, index) => ({
        label: item.label,
        href: normalizePath(item.href),
        order: index
      })
    );

    const dynamicItems = items.map((item, index) => ({
      ...item,
      order: baseItems.length + index
    }));

    return [...baseItems, ...dynamicItems].filter(
      (item, index, allItems) =>
        allItems.findIndex(
          (candidate) =>
            candidate.href === item.href
        ) === index
    );
  };"""

registry = replace_once(
    registry,
    old_nav_return,
    new_nav_return,
    "stabile Basisnavigation"
)

project_config = replace_once(
    originals[PROJECT_CONFIG],
    '{ label: "Wissen", href: "/wissen/" },',
    '{ label: "Wissen & Ratgeber", href: "/wissen/" },',
    "Wissenslabel"
)

header_css_append = """
/* pfotentechnik-stable-navigation-4.5.1 */
@media (max-width: 760px) {
  .main-nav-v2 {
    max-height: min(68vh, 520px);
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    -webkit-overflow-scrolling: touch;
  }

  .main-nav-v2[data-open] {
    gap: 6px;
    padding: 12px;
  }

  .main-nav-v2 a {
    display: flex;
    min-height: 44px;
    align-items: center;
    padding: 10px 12px;
    border-radius: 12px;
  }

  .main-nav-v2 a:hover,
  .main-nav-v2 a:focus-visible {
    background: rgba(99, 230, 163, 0.08);
  }
}
"""

header_css = originals[HEADER_CSS].rstrip() + header_css_append + "\n"

stamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".home-cards-and-large-dog-safety-4.5.1-backup-{stamp}"
backup.mkdir(parents=True, exist_ok=False)
for relative, content in originals.items():
    dest = backup / relative
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(content, encoding="utf-8")
try:
    (root / DOMAIN).write_text(domain, encoding="utf-8")
    (root / SLUG).write_text(slug, encoding="utf-8")
    (root / HOME_CSS).write_text(home_css, encoding="utf-8")
    (root / REGISTRY).write_text(registry, encoding="utf-8")
    (root / PROJECT_CONFIG).write_text(project_config, encoding="utf-8")
    (root / HEADER_CSS).write_text(header_css, encoding="utf-8")
    run(["npm", "run", "build:pfotentechnik"], root)
    package = (root / "apps/pfotentechnik/package.json").read_text(encoding="utf-8")
    if "\"audit:recommendations\"" in package:
        run(["npm", "--workspace", "apps/pfotentechnik", "run", "audit:recommendations"], root)
except Exception as exc:
    print(f"Validierung fehlgeschlagen: {exc}", file=sys.stderr)
    print("Automatischer Rollback wird ausgeführt.", file=sys.stderr)
    for relative, content in originals.items():
        (root / relative).write_text(content, encoding="utf-8")
    raise SystemExit(1)
print("Home Cards & Large Dog Safety 4.5.1 erfolgreich installiert.")
print(f"Backup: {backup}")
