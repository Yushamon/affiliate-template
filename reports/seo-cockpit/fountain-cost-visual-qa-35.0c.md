# Fountain Cost Visual QA 35.0C

Status: **AUTOMATED CONTRACT PASS / BROWSER EVIDENCE BLOCKED**

Repräsentative FULL-Seite: `/produkt/cat-mate-335-pet-fountain/`.

## Finale Screenshot-Matrix

| Viewport | Theme | Ergebnis |
| --- | --- | --- |
| 375 px | Light | BLOCKED — kein Browser-Backend verfügbar |
| 375 px | Dark | BLOCKED — kein Browser-Backend verfügbar |
| 1600 px | Light | BLOCKED — kein Browser-Backend verfügbar |
| 1600 px | Dark | BLOCKED — kein Browser-Backend verfügbar |

Die Browser-Steuerung wurde gemäß dem verfügbaren Browser-Workflow initialisiert. Die Browserliste war leer; deshalb wurden keine Ersatzscreenshots mit einem anderen Tool erzeugt und keine visuelle Freigabe behauptet.

## Automatisierte Prüfung

- Dev-SSR für FULL, COST_ONLY, OFFER_ONLY und INFO_ONLY: jeweils HTTP 200 und erwarteter `data-fountain-cost-state`.
- CTA: nur FULL vorhanden.
- Semantik: `section`, zugeordnetes `h2`, verständlicher Linktext und zugängliches Kostenbereich-Label.
- Mobile Contract: einspaltige Grid-Struktur, `min-width:0`, `overflow-wrap:anywhere`, keine Tabelle und keine feste Mindestbreite.
- Desktop Contract: nur Verdichtung ab 720 px, keine zweite Informationsarchitektur.
- Dark Mode: ausschließlich bestehende semantische ProductExperience2-Tokens, keine hardcodierte helle Oberfläche.
- Layout Shift: keine clientseitig nachgeladenen Preise; Daten und Styles werden serverseitig in einem Renderpass ausgegeben.
- Production OFF: weder Block noch Inline-Styles werden gerendert; kein Leerraum.

## Nicht ersetzbare Browserchecks

Echte Pixelprüfung für Overflow, Clipping, Fokusdarstellung und die vier Ziel-Viewport/Theme-Kombinationen bleibt offen. Die statischen Verträge und SSR-Prüfungen sind bestanden, ersetzen aber keine Browser-Geometriemessung.
