#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import subprocess
import sys

APP = Path("apps/pfotentechnik")
TARGET = APP / "src/pages/[slug].astro"

def stop(msg):
    print(f"FEHLER: {msg}", file=sys.stderr)
    raise SystemExit(1)

def repo_root(start):
    for p in (start, *start.parents):
        if (p / APP / "package.json").is_file():
            return p
    stop("Repository-Root nicht gefunden.")

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        stop(f"{label}: genau 1 Fundstelle erwartet, gefunden: {count}")
    return text.replace(old, new, 1)

def run(cmd, cwd):
    print("$", " ".join(cmd))
    if subprocess.run(cmd, cwd=cwd).returncode != 0:
        raise RuntimeError("Befehl fehlgeschlagen: " + " ".join(cmd))

root = repo_root(Path.cwd().resolve())
target = root / TARGET
if not target.is_file():
    stop(f"Datei fehlt: {TARGET}")

original = target.read_text(encoding="utf-8")
if "const isMoneyPage =" in original:
    stop("Money Pages Framework scheint bereits installiert zu sein.")

updated = original

updated = replace_once(
    updated,
    "const recommendationJourney = page.data.recommendationJourney;",
    '''const recommendationJourney = page.data.recommendationJourney;
const isMoneyPage =
  recommendationJourney?.mode === "filtered" ||
  page.data.contentPlatform?.intent === "buying-guide" ||
  page.data.contentPlatform?.intent === "comparison-support";''',
    "Money-Page-Erkennung"
)

journey_start_marker = '''    {
      recommendationJourney && (
        <section class="recommendation-journey-state">'''

journey_end_marker = '''    {
      topDecisionRecommendation && topDecisionProduct && ('''

start = updated.find(journey_start_marker)
if start == -1:
    stop("Start des Recommendation-Journey-Blocks nicht gefunden.")

end = updated.find(journey_end_marker, start)
if end == -1:
    stop("Ende des Recommendation-Journey-Blocks nicht gefunden.")

journey_block = updated[start:end]

if not journey_block.rstrip().endswith("}"):
    stop("Recommendation-Journey-Block ist strukturell unvollständig.")

updated = updated[:start] + updated[end:]

content_anchor = '''    <AutoLinkContent
      definitions={internalLinkDefinitions}
      sourcePath={`/${page.data.slug}/`}
      sourceGroup="knowledge"
      sourceContexts={sourceContexts}
      maxLinksPerPage={7}
    >
      <Content />
    </AutoLinkContent>
'''

updated = replace_once(
    updated,
    content_anchor,
    content_anchor + "\n" + journey_block.rstrip() + "\n",
    "Journey nach Hauptinhalt verschieben"
)

updated = replace_once(
    updated,
    "assembledPage.closingCta && closingProduct && (",
    "!isMoneyPage && assembledPage.closingCta && closingProduct && (",
    "Affiliate-Abschlussbox deaktivieren"
)

generic = '''<ConversionJourney
    title="Was jetzt sinnvoll ist"
    intro="Vertiefe das Thema oder gehe gezielt zur passenden Produkt- und Vergleichsebene weiter."
    items={[
      {
        eyebrow: "Orientierung",
        title: "Passende Kaufberatung öffnen",
        text: "Nutze die zentrale Übersicht, um Anforderungen und Gerätetypen strukturiert einzuordnen.",
        href: "/smarte-futterautomaten/",
        label: "Zur Kaufberatung"
      },
      {
        eyebrow: "Vergleich",
        title: "Geeignete Modelle gegenüberstellen",
        text: "Vergleiche Funktionen und Einsatzbereiche, statt nur einzelne Produktversprechen zu betrachten.",
        href: "/vergleiche/",
        label: "Zu den Vergleichen"
      },
      {
        eyebrow: "Praxis",
        title: "Technik sicher im Alltag nutzen",
        text: "Prüfe Reinigung, Kontrollroutinen und Grenzen automatisierter Fütterung.",
        href: "/futterautomat-richtig-reinigen/",
        label: "Praxiswissen lesen"
      }
    ]}
  />'''

wrapped = '''{!isMoneyPage && (
  <ConversionJourney
    title="Was jetzt sinnvoll ist"
    intro="Vertiefe das Thema oder gehe gezielt zur passenden Produkt- und Vergleichsebene weiter."
    items={[
      {
        eyebrow: "Orientierung",
        title: "Passende Kaufberatung öffnen",
        text: "Nutze die zentrale Übersicht, um Anforderungen und Gerätetypen strukturiert einzuordnen.",
        href: "/smarte-futterautomaten/",
        label: "Zur Kaufberatung"
      },
      {
        eyebrow: "Vergleich",
        title: "Geeignete Modelle gegenüberstellen",
        text: "Vergleiche Funktionen und Einsatzbereiche, statt nur einzelne Produktversprechen zu betrachten.",
        href: "/vergleiche/",
        label: "Zu den Vergleichen"
      },
      {
        eyebrow: "Praxis",
        title: "Technik sicher im Alltag nutzen",
        text: "Prüfe Reinigung, Kontrollroutinen und Grenzen automatisierter Fütterung.",
        href: "/futterautomat-richtig-reinigen/",
        label: "Praxiswissen lesen"
      }
    ]}
  />
)}'''

updated = replace_once(
    updated,
    generic,
    wrapped,
    "generische ConversionJourney deaktivieren"
)

old_mobile = '''  @media (max-width: 640px) {
    .recommendation-journey-comparison {
      align-items: flex-start;'''

new_mobile = '''  @media (max-width: 640px) {
    .recommendation-journey-state {
      margin-block: 2rem;
      padding: 1.25rem;
    }
    .recommendation-journey-comparison {
      flex-direction: column;
      align-items: flex-start;'''

updated = replace_once(
    updated,
    old_mobile,
    new_mobile,
    "Mobile Layout"
)

if updated.count("const isMoneyPage =") != 1:
    stop("Money-Page-Erkennung wurde nicht eindeutig eingesetzt.")
if updated.count('<section class="recommendation-journey-state">') != 1:
    stop("Recommendation-Journey ist nicht genau einmal vorhanden.")
if updated.count("{!isMoneyPage && (") != 1:
    stop("Generische Journey wurde nicht korrekt gekapselt.")

stamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".money-pages-framework-2.1-backup-{stamp}"
backup_file = backup / TARGET
backup_file.parent.mkdir(parents=True, exist_ok=False)
backup_file.write_text(original, encoding="utf-8")

try:
    target.write_text(updated, encoding="utf-8")
    run(["npm", "run", "build:pfotentechnik"], root)

    package = (root / APP / "package.json").read_text(encoding="utf-8")
    if '"audit:repository"' in package:
        run(
            ["npm", "--workspace", "apps/pfotentechnik", "run", "audit:repository"],
            root
        )
except Exception as exc:
    print(f"Validierung fehlgeschlagen: {exc}", file=sys.stderr)
    print("Automatischer Rollback wird ausgeführt.", file=sys.stderr)
    target.write_text(original, encoding="utf-8")
    raise SystemExit(1)

print("Money Pages Framework 2.1 erfolgreich installiert.")
print(f"Backup: {backup}")
