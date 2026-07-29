# PfotenTechnik Performance-Abschluss

Vergleich der vollständigen Astro-Produktions-Builds vor und nach der Bereinigung. Die Messung bewertet die ausgelieferten Artefakte, nicht theoretische Source-Größen. Ein Browser-Labwert wird nicht behauptet: Der lokale Electron-/Chromium-Prozess wird in dieser Ausführungsumgebung vor dem Start blockiert. Der separate Browser-Smoke-Test bleibt für eine normale lokale CI-Umgebung erhalten.

## Ergebnis

| Kennzahl | Vorher | Nachher | Veränderung |
| --- | ---: | ---: | ---: |
| Build-Dauer | 5:57 min | 1:21 min | −77,3 % |
| Routengenerierung | 4:40 min | 1:13 min | −73,9 % |
| Bildtransformationen | 3.704 | 3.453 | −251 / −6,8 % |
| CSS-Quelldateien | 31 | 23 | −8 / −25,8 % |
| CSS-Source | 634.491 B | 494.185 B | −22,1 % |
| `!important` in CSS-Source | 1.542 | 1.264 | −18,0 % |
| Hydration-Direktiven | 0 | 0 | unverändert |
| Globale DOM-Korrektur | vorhanden | entfernt | vollständig entfernt |

Die absolute Build-Dauer profitiert auch vom warmen Bildcache; die separat beobachtete Routengenerierung zeigt den belastbareren Architekturgewinn. Besonders deutlich ist die vermiedene Doppelarbeit im SEO-Admin: `/admin/seo/prompts/` sank von 10,85 s auf 57 ms und `/admin/seo/tasks/` von 22,22 s auf 59 ms. Produktseiten liegen im verifizierten Lauf nach dem Build-Cache-Fix meist bei 0,14 bis 0,20 s statt zuvor ungefähr 0,7 bis 0,9 s in derselben Umgebung.

## Repräsentative Routen

| Route | HTML vorher → nachher | CSS vorher → nachher | Bilder vorher → nachher |
| --- | ---: | ---: | ---: |
| `/` | 60.469 → 54.207 B | 316.259 → 303.014 B | 2.646.890 → 809.298 B |
| `/vergleiche/` | 40.617 → 36.046 B | 297.100 → 283.855 B | 0 → 0 B |
| `/vergleiche/beste-futterautomaten-fuer-katzen/` | 124.980 → 120.976 B | 423.889 → 410.644 B | 530.110 → 287.840 B |
| `/vergleiche/gps-tracker-ohne-abo/` | 64.039 → 59.886 B | 423.889 → 410.644 B | 457.340 → 273.604 B |
| `/produkt/petlibro-granary-2-vision/` | 76.602 → 72.025 B | 340.439 → 340.439 B | 469.704 → 469.704 B |
| `/hersteller/petlibro/` | 76.979 → 72.240 B | 322.197 → 308.952 B | 1.856.764 → 1.020.102 B |
| `/wissen/` | 59.516 → 54.945 B | 292.660 → 279.415 B | 0 → 0 B |
| `/smarte-futterautomaten/` | 126.976 → 122.407 B | 354.923 → 341.678 B | 5.387.506 → 5.295.142 B |
| `/hund-trinkt-ploetzlich-viel/` | 39.872 → 35.218 B | 354.923 → 341.678 B | 398.366 → 297.458 B |
| `/kontakt/` | 9.887 → 9.887 B | 99.636 → 99.636 B | 0 → 0 B |

## Architekturentscheidungen

- Produkt-Mobile-CSS wird nur noch von Produktseiten importiert. Alle anderen ProjectLayout-Routen sparen 13.245 B ausgeliefertes CSS.
- Die Überschriften-/Karten-Suche in `SiteRuntimeFixes.astro`, inklusive `getComputedStyle`, entfällt. Komponenten rendern die benötigten Datenattribute und Score-Winkel direkt.
- Das konsolidierte Comparison-Stylesheet bleibt die einzige Laufzeitquelle; acht obsolete, parallele CSS-Dateien wurden gelöscht.
- Responsive Bildbreiten sind nun kontextbezogen begrenzt. Der Vergleichssieger konkurriert nicht mehr eager mit dem Hero; Galerie-Thumbnails laden lazy.
- SEO-Advisor-Content, Product Intelligence und Work Packages werden in einem Build nur einmal berechnet.
- Content Collections, der zusammengeführte Content-Graph, Related-Content-Tokens, interne Linkdefinitionen und der Produkt-Preisindex werden im Produktions-Build wiederverwendet.
- Dynamische Routen erhalten ihren Content-Eintrag direkt aus `getStaticPaths`; der zusätzliche Einzelabruf pro Seite entfällt.
- Es gibt weiterhin keine Framework-Hydration und keine ausgelieferten Webfonts. Funktionales JavaScript für Vergleichsexplorer, Produktberater, Galerie, Sticky-Bar und Lightbox bleibt bewusst erhalten.

## Release-Gate

`audit:performance:strict` läuft genau einmal als Phase des bestehenden SEO-Release-Preflights. Es prüft:

- HTML-, CSS-, JS-, DOM- und Bildbudgets pro Seitentyp,
- LCP-Bild-Delivery, Bildmaße und render-blockierende Stylesheets,
- obsolete CSS, globale DOM-Korrekturen und Hydration,
- 30 statische Viewport-Verträge für 10 Routen bei 390, 768 und 1366 Pixeln.

Der letzte strikte Artefakt-Audit ist ohne harte Fehler durchgelaufen. Warnungen bleiben für den großen Cornerstone-DOM/Bildumfang und die weiterhin hohe CSS-Spezifität sichtbar; sie werden nicht als bereits gelöst dargestellt.
