# PfotenTechnik Comparison Editorial Cover 15.2.3

Release-Paket für den redaktionellen Vergleichsseiten-Hero von PfotenTechnik.

## Enthalten

- neuer Editorial-Cover-Hero für alle Vergleichsseiten
- automatische Hero-Auswahl anhand des Vergleichsslugs
- zentraler Fallback, falls noch kein individuelles Hero vorhanden ist
- mobile 2×2-Schnellfilter mit zweizeiligen Feldern
- redaktionelle Top-Empfehlung
- Light- und Dark-Mode-Styling
- Backups, Cleanup und Audits
- Prompt-Vorlagen für mehrere Vergleichskategorien

## Behoben in 15.2.3

- Das globale `comparison:release:check` wird weiterhin ausgeführt, aber korrekt als separates Plattform-Release-Gate behandelt.
- Ein ausstehendes manuelles Visual-QA oder andere globale Closure-Anforderungen markieren den Hero-Installer nicht mehr fälschlich als fehlgeschlagen.
- Alle für den Installer relevanten technischen Prüfungen bleiben hart: Build, Astro-Check, Daten-Tests, Hero-Audit, Comparison-Audit, Design-System-Audits, Visual-QA und Technical-SEO.
- Fehlende slug-spezifische Hero-Bilder bleiben zulässige Hinweise, solange `default-editorial-hero.webp` vorhanden ist.

## Installation

Das ZIP im Root des Repositories entpacken und ausführen:

```bash
node pfotentechnik-comparison-editorial-cover-15.2.3/apply-comparison-editorial-cover-15.2.3.mjs
```

Optional kann der Installer direkt aus dem entpackten Paketordner in den Repository-Root kopiert und dort ausgeführt werden.

## Einzelnes Hero-Bild übernehmen

```bash
node pfotentechnik-comparison-editorial-cover-15.2.3/apply-comparison-editorial-cover-15.2.3.mjs \
  --hero-slug="gps-tracker-hunde" \
  --hero-image="/Pfad/gps-tracker-hunde-editorial-hero.webp"
```

## Mehrere Hero-Bilder übernehmen

```bash
node pfotentechnik-comparison-editorial-cover-15.2.3/apply-comparison-editorial-cover-15.2.3.mjs \
  --hero-dir="/Pfad/zu/hero-bildern"
```

Der Quellordner darf beliebig viele WebP-Dateien enthalten, sofern sie nach diesem Schema benannt sind:

```text
<vergleichsslug>-editorial-hero.webp
```

## Zielordner im Repository

```text
apps/pfotentechnik/src/assets/images/project/pfotentechnik/comparison/
```

Beispiele:

```text
gps-tracker-hunde-editorial-hero.webp
beste-futterautomaten-editorial-hero.webp
beste-trinkbrunnen-editorial-hero.webp
futterautomat-fuer-zwei-katzen-editorial-hero.webp
```

## Fallback-Verhalten

Fehlt ein individuelles Hero, wird automatisch verwendet:

```text
apps/pfotentechnik/src/assets/images/project/pfotentechnik/comparison/default-editorial-hero.webp
```

Ein explizit in den Vergleichsdaten hinterlegtes `heroImage` hat weiterhin Vorrang.

## Audits

Normaler Bericht:

```bash
npm --workspace apps/pfotentechnik run comparison:hero:audit
```

Strikte Prüfung:

```bash
npm --workspace apps/pfotentechnik run comparison:hero:audit:strict
```

Die normale Installation darf mit fehlenden individuellen Hero-Bildern abschließen. Die strikte Prüfung dient dem finalen Release-Gate.

## Bildstandard

Empfohlen:

- WebP
- mindestens 2000 × 1125 px
- 16:9
- Hauptmotiv rechts
- Blickrichtung nach links
- ruhige Negativfläche
- kein Text, Logo oder UI-Overlay
- Motiv muss auch im mobilen Zuschnitt funktionieren

Die Prompt-Dateien im Ordner `prompts/` dienen als Ausgangspunkt.


## Erfolgskriterien

Der Installer gilt als erfolgreich, wenn die technischen Hero- und Repository-Prüfungen bestehen.

Das globale Kommando

```bash
npm --workspace apps/pfotentechnik run comparison:release:check
```

bleibt ein separater Statuscheck. Es umfasst auch projektweite Restarbeiten und manuelle visuelle Freigaben, die nicht automatisch durch diesen Installer abgeschlossen werden können.
