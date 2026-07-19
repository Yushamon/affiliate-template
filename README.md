# PfotenTechnik Conversion Framework 1.0

Dieses Paket enthält vier aufeinander aufbauende Git-Patches.

## Reihenfolge

```bash
git apply --check conversion-framework-1-foundation.patch
git apply conversion-framework-1-foundation.patch
npm run build:pfotentechnik

git apply --check conversion-framework-2-recommendations.patch
git apply conversion-framework-2-recommendations.patch
npm run build:pfotentechnik

git apply --check conversion-framework-3-trust.patch
git apply conversion-framework-3-trust.patch
npm run build:pfotentechnik

git apply --check conversion-framework-4-journey.patch
git apply conversion-framework-4-journey.patch
npm run build:pfotentechnik
```

Danach:

```bash
git diff --check
git status
```

## Patch 1 – Foundation

- entfernt pauschale „Top-Empfehlung“-Badges
- führt optionale Conversion-Metadaten ein
- erlaubt produktspezifische CTA-Beschriftungen
- entfernt den ungenutzten `relatedContent`-Prop

Beispiel:

```yaml
conversion:
  badge: preis-leistungs-tipp
  primaryCtaLabel: Aktuellen Preis prüfen
  secondaryCtaLabel: Preis und Verfügbarkeit prüfen
  showSecondaryCta: true
```

Ohne `conversion` bleibt die Produktdatei gültig und es wird kein Badge angezeigt.

## Patch 2 – Recommendation Engine 2.0

- priorisiert redaktionell hinterlegte `alternatives`
- berücksichtigt Futterart, Use Case, Zielgruppe und Preisstufe
- bevorzugt sinnvolle Funktionsunterschiede
- liefert robuste Fallback-Alternativen

## Patch 3 – Trust Framework

- ersetzt den statischen Methodikblock
- macht Bewertungsstatus, Datenbasis und Aktualität sichtbar
- trennt Praxistest und redaktionelle Einordnung sauber

Beispiel:

```yaml
editorial:
  assessmentType: editorial-review
  evidence:
    - manufacturer-documentation
    - technical-specifications
    - comparative-analysis
  testedHandsOn: false
  lastVerifiedAt: 2026-07-18
```

## Patch 4 – Conversion Journey

- ergänzt eine zentrale nächste-Schritte-Komponente
- integriert sie auf Ratgeber-, Vergleichs- und Produktseiten
- verwendet bestehende Related-Content-Daten
- erzeugt keine zusätzlichen Affiliate-Buttons

## Rollback

In umgekehrter Reihenfolge:

```bash
git apply -R conversion-framework-4-journey.patch
git apply -R conversion-framework-3-trust.patch
git apply -R conversion-framework-2-recommendations.patch
git apply -R conversion-framework-1-foundation.patch
```

## Hinweis zum Repository-Stand

Die Patches wurden gegen den am 18. Juli 2026 gelesenen Stand von
`Yushamon/affiliate-template` erstellt. Bereits installierte lokale Patches können
Kontextzeilen verschieben. In diesem Fall zuerst `git apply --check` verwenden.
