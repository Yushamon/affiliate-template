# Pfotentechnik Repository Audit 5.0

Dieses Paket ergänzt das Repository um eine prüfbare Audit-Schicht und korrigiert konkrete SEO-Probleme im gemeinsamen Layout.

## Enthaltene Änderungen

- absolute Publisher- und Autoren-URLs in strukturierten Daten
- `WebSite`-Schema nur auf der Startseite
- `max-image-preview:large`, Open-Graph-Locale, Theme-Color und Color-Scheme
- Audit für doppelte Routen, fehlende Metadaten, interne Links und verwaiste Inhalte
- Hinweise auf ungenutzte Komponenten, CSS-Dopplungen und übergroße Dateien
- Markdown- und JSON-Report unter `apps/pfotentechnik/reports/`

## Ausführung

```bash
python3 apply-pfotentechnik-repository-audit-5.0.py
npm --workspace apps/pfotentechnik run audit:repository
npm run build:pfotentechnik
```

Strikter Modus:

```bash
npm --workspace apps/pfotentechnik run audit:repository:strict
```
