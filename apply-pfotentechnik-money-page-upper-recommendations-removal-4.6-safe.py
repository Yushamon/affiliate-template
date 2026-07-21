#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import subprocess, sys
COMPONENT = Path('apps/pfotentechnik/src/components/AutoContentBlocks.astro')
SLUG = Path('apps/pfotentechnik/src/pages/[slug].astro')
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
for relative in [COMPONENT, SLUG]:
    if not (root / relative).is_file(): stop(f"Datei fehlt: {relative}")
component_original = (root / COMPONENT).read_text(encoding="utf-8")
slug_original = (root / SLUG).read_text(encoding="utf-8")
if "hideRecommendationBlocks" in component_original:
    stop("Patch 4.6 scheint bereits installiert zu sein.")
component = replace_once(component_original, "interface Props {\n  page: AssembledContentPage;\n  products: CollectionEntry<\"products\">[];\n}\n\nconst { page, products } = Astro.props as Props;", "interface Props {\n  page: AssembledContentPage;\n  products: CollectionEntry<\"products\">[];\n  hideRecommendationBlocks?: boolean;\n}\n\nconst {\n  page,\n  products,\n  hideRecommendationBlocks = false\n} = Astro.props as Props;", "AutoContentBlocks Props")
component = replace_once(component, "{hasBlock(\"recommendation\") && selectedProducts.length > 0 && (", "{!hideRecommendationBlocks && hasBlock(\"recommendation\") && selectedProducts.length > 0 && (", "obere Produktkarten ausblenden")
component = replace_once(component, "{hasBlock(\"comparison\") && selectedProducts.length > 1 && (", "{!hideRecommendationBlocks && hasBlock(\"comparison\") && selectedProducts.length > 1 && (", "obere Vergleichstabelle ausblenden")
slug = replace_once(slug_original, "    <AutoContentBlocks\n      page={assembledPage}\n      products={products}\n    />", "    <AutoContentBlocks\n      page={assembledPage}\n      products={products}\n      hideRecommendationBlocks={isRecommendationPage}\n    />", "AutoContentBlocks Ansteuerung")
slug = replace_once(slug, "    {\n      topDecisionRecommendation && topDecisionProduct && (\n        <section\n          class={`decision-top-recommendation decision-top-recommendation-${decisionThemeColor}`}\n        >", "    {\n      !isRecommendationPage &&\n      topDecisionRecommendation &&\n      topDecisionProduct && (\n        <section\n          class={`decision-top-recommendation decision-top-recommendation-${decisionThemeColor}`}\n        >", "Top-Empfehlung oben ausblenden")
slug = replace_once(slug, "      !recommendationJourney && comparisonProducts.length > 1 && (", "      !isRecommendationPage && comparisonProducts.length > 1 && (", "Legacy Vergleichsintro ausblenden")
slug = replace_once(slug, "      !recommendationJourney && comparisonProductEntries.length > 0 && comparisonExperienceConfig && (", "      !isRecommendationPage && comparisonProductEntries.length > 0 && comparisonExperienceConfig && (", "Legacy Vergleichskarten ausblenden")
stamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".money-page-upper-recommendations-removal-4.6-backup-{stamp}"
backup.mkdir(parents=True, exist_ok=False)
for relative, content in [(COMPONENT, component_original), (SLUG, slug_original)]:
    dest = backup / relative
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(content, encoding="utf-8")
try:
    (root / COMPONENT).write_text(component, encoding="utf-8")
    (root / SLUG).write_text(slug, encoding="utf-8")
    run(["npm", "run", "build:pfotentechnik"], root)
    package = (root / "apps/pfotentechnik/package.json").read_text(encoding="utf-8")
    if "\"audit:recommendations\"" in package:
        run(["npm", "--workspace", "apps/pfotentechnik", "run", "audit:recommendations"], root)
except Exception as exc:
    print(f"Validierung fehlgeschlagen: {exc}", file=sys.stderr)
    print("Automatischer Rollback wird ausgeführt.", file=sys.stderr)
    (root / COMPONENT).write_text(component_original, encoding="utf-8")
    (root / SLUG).write_text(slug_original, encoding="utf-8")
    raise SystemExit(1)
print("Money Page Upper Recommendations Removal 4.6 erfolgreich installiert.")
print(f"Backup: {backup}")
