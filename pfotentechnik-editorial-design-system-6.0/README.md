# PfotenTechnik Editorial Design System 6.0

## Änderungen

### Keine Schachtel in Schachtel

Der zusätzliche Hintergrund, Rahmen und Radius der äußeren `.article`-Box werden ausschließlich auf Seiten mit dem PfotenTechnik Editorial Renderer entfernt.

Das Inhaltsverzeichnis bleibt als eigenständige Komponente sichtbar.

### Entscheidungslisten repariert

Listeninhalte werden im Renderer in ein echtes `<span>` eingeschlossen.

Dadurch besteht jede Zeile aus exakt:

```text
Nummer | vollständiger Text
```

Automatisch eingefügte interne Links wie `Katze` erzeugen keine separaten Grid-Spalten mehr.

### Produktkarten neu aufgebaut

Die Produktkarten enthalten jetzt:

- echtes Produktbild
- Herstellerlabel
- Produktname
- kurze redaktionelle Einordnung
- drei Highlights
- klaren CTA
- kompakte Score-Kachel

### Bewertungsskala

Bewertungen werden ausschließlich als Punkte von 100 angezeigt:

```text
82
/100
```

Falls bestehende Produktdaten noch auf einer 5er-Skala gespeichert sind, rechnet der Renderer sie automatisch um:

```text
4.1 → 82/100
4.6 → 92/100
```

Bereits auf 100 gespeicherte Werte bleiben unverändert.

Es werden keine Sterne ausgegeben.

## Geänderte Dateien

```text
packages/affiliate-core/src/renderer/PremiumRenderer.astro
apps/pfotentechnik/src/pages/[slug].astro
apps/pfotentechnik/src/styles/pfotentechnik-design-system.css
```

## Installation

```bash
node pfotentechnik-editorial-design-system-6.0/install-editorial-design-system-6.0.mjs
npm run build:pfotentechnik
```

Danach den Dev-Server vollständig neu starten.

## Prüfen

```text
/trinkbrunnen/
/futterautomat-katze/
/smarte-futterautomaten/
```

Zuerst bei 360, 390 und 430 px testen.

## Rollback

```bash
node pfotentechnik-editorial-design-system-6.0/rollback-editorial-design-system-6.0.mjs
```
