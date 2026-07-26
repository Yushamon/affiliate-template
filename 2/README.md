# PfotenTechnik Product Experience Hotfix 2.0.2

Dieser Folgepatch setzt Product Experience Hotfix 2.0.1 voraus.

## Änderungen

- Das sichtbare Breadcrumb wird auf Produktseiten entfernt.
- Die vollständige Breadcrumb-Hierarchie bleibt als `BreadcrumbList`-JSON-LD im Layout erhalten.
- Vorteile, Nachteile, Eignungspunkte und Einschränkungen werden zentral normalisiert und dedupliziert.
- Führende Haken, Kreuze und Aufzählungszeichen aus Markdown-Daten werden entfernt, bevor die UI eigene Symbole ausgibt.
- Vorteile erhalten einen grünen Haken.
- Nachteile und „Nicht kaufen, wenn …“ erhalten ein rotes Kreuz.
- Die Detailansicht zeigt maximal acht eindeutige Vorteile beziehungsweise Nachteile.
- Primäre CTAs verwenden projektweit dasselbe semantische Grün.
- Sekundäre CTAs werden neutral mit derselben grünen Akzentfarbe für Rahmen und Text dargestellt, statt eine weitere grüne Fläche einzuführen.

## Installation unter Windows

```powershell
node .\pfotentechnik-product-experience-hotfix-2.0.2\install.mjs --repo C:\hp\Projekt\affiliate-template
```

Der Installer führt anschließend aus:

```text
node --experimental-strip-types --test test/product-experience-2-content-hotfix.test.mjs
npm run audit:products
npm run build
```

Schlägt ein Schritt fehl, werden alle Änderungen automatisch zurückgerollt.

## Manueller Rollback

```powershell
node .\pfotentechnik-product-experience-hotfix-2.0.2\rollback.mjs --repo C:\hp\Projekt\affiliate-template
```
