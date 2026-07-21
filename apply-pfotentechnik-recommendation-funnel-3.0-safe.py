#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from datetime import datetime
import subprocess
import sys

APP = Path("apps/pfotentechnik")
SLUG_PAGE = APP / "src/pages/[slug].astro"
COMPARISON_PAGE = APP / "src/pages/vergleiche/[comparison].astro"
PRODUCT_PAGE = APP / "src/pages/produkt/[product].astro"
HELPER = APP / "src/domain/recommendationLinks.ts"
COMPONENT = APP / "src/components/DecisionNextSteps.astro"
PACKAGE_DIR = Path(__file__).resolve().parent


def die(message: str) -> None:
    print(f"FEHLER: {message}", file=sys.stderr)
    raise SystemExit(1)


def find_root(start: Path) -> Path:
    for root in (start, *start.parents):
        if (root / APP / "package.json").is_file():
            return root
    die("Repository-Root nicht gefunden.")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        die(f"{label}: erwartete genau 1 Fundstelle, gefunden: {count}")
    return text.replace(old, new, 1)


def run(command: list[str], cwd: Path) -> None:
    print("$", " ".join(command))
    result = subprocess.run(command, cwd=cwd)
    if result.returncode != 0:
        raise RuntimeError("Befehl fehlgeschlagen: " + " ".join(command))


root = find_root(Path.cwd().resolve())
required = [SLUG_PAGE, COMPARISON_PAGE, PRODUCT_PAGE]
for relative in required:
    if not (root / relative).is_file():
        die(f"Datei fehlt: {relative}")

if (root / HELPER).exists() or (root / COMPONENT).exists():
    die("Recommendation Funnel 3.0 scheint bereits installiert zu sein.")

helper_source = PACKAGE_DIR / "reference/recommendationLinks.ts"
component_source = PACKAGE_DIR / "reference/DecisionNextSteps.astro"
if not helper_source.is_file() or not component_source.is_file():
    die("Referenzdateien fehlen im Patch-Paket.")

originals = {relative: (root / relative).read_bytes() for relative in required}

slug = originals[SLUG_PAGE].decode("utf-8")
slug = replace_once(slug, "<strong>Produktdetails lesen</strong>", "<strong>Produkt ansehen</strong>", "Money-Page Produkt-CTA")
slug = replace_once(slug, "<strong>Mit vorausgewählten Filtern öffnen →</strong>", "<strong>Zum Vergleich</strong>", "Money-Page Vergleichs-CTA")
slug = replace_once(slug, "<strong>Produkttest lesen</strong>", "<strong>Produkt ansehen</strong>", "Decision-CTA")

comparison = originals[COMPARISON_PAGE].decode("utf-8")
comparison = replace_once(
    comparison,
    'import ConversionJourney from "../../components/ConversionJourney.astro";',
    'import DecisionNextSteps from "../../components/DecisionNextSteps.astro";',
    "Vergleich Import",
)
comparison = replace_once(
    comparison,
    'import {\n  getInternalLinkDefinitions,\n  getSourceContexts\n} from "../../domain/content/internalLinks";',
    'import {\n  getInternalLinkDefinitions,\n  getSourceContexts\n} from "../../domain/content/internalLinks";\nimport { buildComparisonNextSteps } from "../../domain/recommendationLinks";',
    "Vergleich Helper-Import",
)
comparison = replace_once(
    comparison,
    '''const relatedItems = relatedEntries.map((related) => ({
  href: related.href,
  label:
    related.type === "product"
      ? "Produkt"
      : related.type === "manufacturer"
        ? "Hersteller"
        : related.type === "comparison"
          ? "Vergleich"
          : "Ratgeber",
  title: related.hubTitle,
  text: related.hubDescription
}));''',
    '''const relatedItems = relatedEntries.map((related) => ({
  href: related.href,
  label:
    related.type === "product"
      ? "Produkt"
      : related.type === "manufacturer"
        ? "Hersteller"
        : related.type === "comparison"
          ? "Vergleich"
          : "Ratgeber",
  title: related.hubTitle,
  text: related.hubDescription
}));

const comparisonNextSteps = buildComparisonNextSteps({
  comparison,
  pages,
  products
});''',
    "Vergleich Daten",
)
comparison = replace_once(
    comparison,
    '''    <ConversionJourney
      title="Von der Vorauswahl zur passenden Entscheidung"
      intro="Nutze den Vergleich als Ausgangspunkt und vertiefe anschließend das Modell oder die Kriterien, die für deinen Alltag entscheidend sind."
      items={[
        {
          eyebrow: "Produkte",
          title: "Favoriten im Detail prüfen",
          text: "Öffne die Produkttests der Modelle, die bei deinen wichtigsten Kriterien vorne liegen.",
          href: "#vergleich",
          label: "Modelle vergleichen"
        },
        {
          eyebrow: "Kaufberatung",
          title: "Anforderungen genauer einordnen",
          text: "Prüfe Futterart, Tierzahl, Portionsgröße, App, Stromversorgung und Reinigungsaufwand.",
          href: "/smarte-futterautomaten/",
          label: "Kaufberatung lesen"
        },
        {
          eyebrow: "Praxis",
          title: "Betrieb und Reinigung vorbereiten",
          text: "Plane Einrichtung, Testportionen und regelmäßige Pflege schon vor dem Kauf.",
          href: "/futterautomat-richtig-reinigen/",
          label: "Praxisratgeber öffnen"
        }
      ]}
    />''',
    '''    <DecisionNextSteps
      title="Vom Vergleich zur Entscheidung"
      intro="Vertiefe die passende Kaufberatung oder öffne die stärkste passende Produktempfehlung."
      items={comparisonNextSteps}
    />''',
    "Vergleich Journey",
)

product = originals[PRODUCT_PAGE].decode("utf-8")
product = replace_once(
    product,
    'import ConversionJourney from "../../components/ConversionJourney.astro";',
    'import DecisionNextSteps from "../../components/DecisionNextSteps.astro";',
    "Produkt Import",
)
product = replace_once(
    product,
    'import {\n  getInternalLinkDefinitions,\n  getSourceContexts\n} from "../../domain/content/internalLinks";',
    'import {\n  getInternalLinkDefinitions,\n  getSourceContexts\n} from "../../domain/content/internalLinks";\nimport { buildProductNextSteps } from "../../domain/recommendationLinks";',
    "Produkt Helper-Import",
)
product = replace_once(
    product,
    '''const relatedItems = relatedEntries.map((entry) => ({
  href: entry.href,
  label: entry.type === "product"
    ? "Produkt"
    : entry.type === "manufacturer"
      ? "Hersteller"
      : entry.type === "comparison"
        ? "Vergleich"
        : "Ratgeber",
  title: entry.hubTitle,
  text: entry.hubDescription
}));''',
    '''const relatedItems = relatedEntries.map((entry) => ({
  href: entry.href,
  label: entry.type === "product"
    ? "Produkt"
    : entry.type === "manufacturer"
      ? "Hersteller"
      : entry.type === "comparison"
        ? "Vergleich"
        : "Ratgeber",
  title: entry.hubTitle,
  text: entry.hubDescription
}));

const productNextSteps = buildProductNextSteps({
  product: contentProduct,
  pages,
  comparisons
});''',
    "Produkt Daten",
)
product = replace_once(
    product,
    '''    <ConversionJourney
      title="So geht es nach dem Produkttest weiter"
      intro="Vergleiche das Modell mit passenden Alternativen oder vertiefe die wichtigsten Kaufkriterien."
      items={[
        {
          eyebrow: "Vergleichen",
          title: "Passende Modelle direkt gegenüberstellen",
          text: "Prüfe Unterschiede bei Funktionen, Einsatzbereich und Bewertung in der passenden Vergleichsübersicht.",
          href: categoryHref,
          label: "Zum Vergleich"
        },
        {
          eyebrow: "Alternativen",
          title: "Andere Lösungen für deinen Anwendungsfall",
          text: "Sieh dir Modelle an, die bei Preis, Ausstattung oder Futterart einen anderen Schwerpunkt setzen.",
          href: "#alternativen",
          label: "Alternativen ansehen"
        },
        {
          eyebrow: "Grundlagen",
          title: "Kaufkriterien noch einmal prüfen",
          text: "Vertiefe Portionierung, Reinigung, Stromausfall und Alltagssicherheit vor der endgültigen Entscheidung.",
          href: "/smarte-futterautomaten/",
          label: "Ratgeber lesen"
        }
      ]}
    />''',
    '''    <DecisionNextSteps
      title="Passend weiterentscheiden"
      intro="Öffne den passenden Vergleich oder die Kaufberatung für diesen Anwendungsfall."
      items={productNextSteps}
    />''',
    "Produkt Journey",
)

prepared = {
    SLUG_PAGE: slug.encode("utf-8"),
    COMPARISON_PAGE: comparison.encode("utf-8"),
    PRODUCT_PAGE: product.encode("utf-8"),
    HELPER: helper_source.read_bytes(),
    COMPONENT: component_source.read_bytes(),
}

stamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".recommendation-funnel-3.0-backup-{stamp}"
backup.mkdir(parents=True, exist_ok=False)
for relative, data in originals.items():
    destination = backup / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(data)

try:
    for relative, data in prepared.items():
        destination = root / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(data)

    run(["npm", "run", "build:pfotentechnik"], root)
    run(["npm", "--workspace", "apps/pfotentechnik", "run", "audit:repository"], root)
except Exception as exc:
    print(f"\nValidierung fehlgeschlagen: {exc}", file=sys.stderr)
    print("Automatischer Rollback wird ausgeführt.", file=sys.stderr)
    for relative, data in originals.items():
        (root / relative).write_bytes(data)
    for relative in (HELPER, COMPONENT):
        path = root / relative
        if path.exists():
            path.unlink()
    raise SystemExit(1)

print("\nRecommendation Funnel 3.0 erfolgreich installiert.")
print("Build und Repository-Audit waren erfolgreich.")
print(f"Backup: {backup}")
