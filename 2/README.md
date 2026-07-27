# PfotenTechnik CTA System 4.2.0

Projektweiter CTA-Polish für `apps/pfotentechnik`.

## Audit-Ergebnis

Im aktuellen Projekt existieren mehrere unabhängig entstandene CTA-Systeme:

- Homepage-Buttons mit vollständiger Pillenform
- Advisor-CTA mit eigener Pillenform
- Health-CTA mit eigener Farbe und Größe
- gelber Primärbutton im Abschluss-CTA
- eigener Ratgeber-Direkteinstieg
- Produktpreis-CTA und Vergleichslink
- Core-UI-Callouts
- Vergleichskarten, Winner, Verdict und Sticky Bar
- leichte Textaktionen innerhalb vollständig klickbarer Karten

Der Patch zwingt nicht jede Navigation in denselben großen Button. Stattdessen
unterscheidet er drei Ebenen:

1. **Primäraktion:** gefülltes einheitliches Grün
2. **Sekundäraktion:** neutrale Oberfläche mit grünem Akzent
3. **Inline-Aktion:** Text und Pfeil bei vollständig klickbaren Karten

## Modernisierte Bereiche

- Navigation und Kaufberater
- Homepage-Hero
- UI-Callouts und IntentCTA
- AdvisorCta
- HealthBridge
- Ratgeber-Direkteinstieg „Schon kaufbereit?“
- Ratgeber-Abschluss-CTA
- ConversionJourney
- RelatedArticles/Card-Aktionen
- Produkt-Preisbox
- Produkt-Vergleichslink
- Vergleichs-Empfehlungskarten
- mobile Vergleichskarten
- Winner- und Verdict-Aktionen
- Vergleichs-Sticky-Bar
- kompakte Vergleichspreise

## Designregeln

- 52 px reguläre CTA-Höhe
- 50 px auf Mobile
- 14–15 px Radius statt Vollpille
- gleiche Typografie und Fokusdarstellung
- kein zweiter grüner Button neben der Primäraktion
- keine unnötige Schattenwirkung bei Sekundäraktionen
- klare Press-, Hover- und Fokuszustände
- Dark Mode über vorhandene Theme-Tokens
- einspaltiger Fallback auf sehr schmalen Geräten

## Geänderte Dateien

```text
apps/pfotentechnik/src/layouts/ProjectLayout.astro
packages/affiliate-core/src/components/comparison/ComparisonShell.astro
apps/pfotentechnik/src/styles/pfotentechnik-cta-system.css
packages/affiliate-core/src/components/comparison/comparison-cta-system.css
```

Die beiden Astro-Dateien erhalten ausschließlich jeweils einen CSS-Import.

## Installation

```powershell
node .\pfotentechnik-cta-system-4.2.0\install.mjs --repo C:\hp\Projekt\affiliate-template
```

Der Installer führt einen Baseline-Build, 16 CTA-Audits und einen vollständigen
Abschluss-Build aus.

## Optional ohne erneuten Baseline-Build

Nur verwenden, wenn der unveränderte Stand direkt zuvor erfolgreich gebaut
wurde:

```powershell
node .\pfotentechnik-cta-system-4.2.0\install.mjs --repo C:\hp\Projekt\affiliate-template --skip-baseline
```

Der Abschluss-Build wird weiterhin ausgeführt.

## Rollback

```powershell
node .\pfotentechnik-cta-system-4.2.0\rollback.mjs --repo C:\hp\Projekt\affiliate-template
```
