PfotenTechnik Comparison Desktop Polish Recovery 32.4.1

Warum diese Version:
Der Installer 32.4.0 hat die eigentlichen Source-Änderungen bereits vor der
Validierung geschrieben. Anschließend scheiterte er ausschließlich daran,
dass `node --check` auf .astro-Dateien angewendet wurde. Node kann das
Astro-Dateiformat nicht direkt syntaktisch prüfen.

32.4.1 ist deshalb idempotent:
- erkennt bereits angewendete 32.4.0-Änderungen
- fügt CSS und Markup nicht doppelt ein
- behält die Comparison Experience 32.4.0 als Source-Stand bei
- erzeugt einen eigenen Regressionstest
- führt nur `node --test` auf der .mjs-Testdatei aus
- kein `node --check` mehr auf .astro

Ausführen ab Repository-Root:

macOS / Linux:
node 3/apply-pfotentechnik-comparison-desktop-polish-recovery-32.4.1.mjs

Windows PowerShell:
node .\3\apply-pfotentechnik-comparison-desktop-polish-recovery-32.4.1.mjs

Danach:
npm --workspace apps/pfotentechnik run build

Wenn der Build sauber ist:
npm run seo:release:check
