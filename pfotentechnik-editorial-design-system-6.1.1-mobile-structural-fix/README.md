# PfotenTechnik Editorial Design System 6.1.1

Gemeinsamer Mobile-Structural-Fix für alle aktuellen Findings.

## Behoben

- zusammenbrechende Listen und buchstabenweise Umbrüche
- defekte Produktkarten-Highlights
- abgeschnittene Produktkarten und Bilder
- zu schmale Produktkarten
- zu große mobile Kurzantwort-Überschriften
- zu breite permanente Icon-Spalten
- zusammenhängende Mega-Hintergrundflächen
- falsche grüne Haken bei Fehlerlisten
- zu hohe Checklisten-Zeilen
- zu schwache Kartennummern
- überlagernde Share-/Screenshot-/Floating-Widgets
- Tabellen-Feinschliff

## Installation

```bash
node pfotentechnik-editorial-design-system-6.1.1-mobile-structural-fix/install-editorial-design-system-6.1.1.mjs
npm run build:pfotentechnik
```

Danach den Dev-Server vollständig neu starten.

## Prüfen

```text
/wie-funktioniert-ein-futterautomat/
/futterautomat-fuer-hunde/
/warum-brauchen-gps-tracker-ein-abo/
```

Breiten:

```text
360 px
390 px
430 px
768 px
```

## Rollback

```bash
node pfotentechnik-editorial-design-system-6.1.1-mobile-structural-fix/rollback-editorial-design-system-6.1.1.mjs
```
