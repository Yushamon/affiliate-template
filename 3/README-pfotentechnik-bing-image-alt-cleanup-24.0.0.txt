PfotenTechnik Bing Image Alt Cleanup 24.0.0
============================================

Ausgangslage
------------
Der Bing-Export meldet 101 Seiten-Fundstellen für fehlende Alt-Texte.
Nach Bereinigung der Query-Varianten sind es 91 eindeutige Routen:
- 66 Produktseiten
- 24 eindeutige Vergleichsseiten, teils mehrfach mit Filter-Query
- die Startseite

Die Ursache liegt in gemeinsam genutzten Komponenten mit leeren Alt-Texten.
Der Patch ändert keine Bilder und kein CSS.

Installation
------------
1. ZIP im Root des Repositories Yushamon/affiliate-template entpacken.
2. Installer ausführen:

   node apply-pfotentechnik-bing-image-alt-cleanup-24.0.0.mjs

   Liegt die Datei im Ordner 3/:

   node 3/apply-pfotentechnik-bing-image-alt-cleanup-24.0.0.mjs

3. Build und gerenderten Audit ausführen:

   npm --workspace apps/pfotentechnik run build
   npm --workspace apps/pfotentechnik run audit:image-alt:strict

Prüfmodus
---------

   node apply-pfotentechnik-bing-image-alt-cleanup-24.0.0.mjs --check

Der Installer
-------------
- ergänzt kontextbezogene Alt-Texte in sechs gemeinsamen Komponenten
- verhindert leere Lightbox-Fallbacks
- installiert einen Source- und Dist-Audit
- installiert Regressionstests
- legt Backups unter .patch-backups/ an
- erzeugt einen Report unter apps/pfotentechnik/reports/seo/

Neue Befehle
------------

   npm --workspace apps/pfotentechnik run audit:image-alt
   npm --workspace apps/pfotentechnik run audit:image-alt:strict
   npm --workspace apps/pfotentechnik run test:image-alt
