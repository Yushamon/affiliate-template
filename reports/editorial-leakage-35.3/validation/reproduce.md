# Reproduktion

Vom Repository-Root aus ausführen. `before.json` und `before-source.json` sind unveränderliche Aufnahmen vor der Korrektur; Baseline-Commit siehe audit.json. Nicht mit dem aktuellen Build überschreiben.

1. `npm run build --workspace=@affiliate-sites/pfotentechnik`
2. `npm test --workspace=@affiliate-sites/pfotentechnik`
3. `npm run audit:editorial-leakage --workspace=@affiliate-sites/pfotentechnik`
4. `node reports/editorial-leakage-35.3/validation/scan-driver.mjs after`
5. `node apps/pfotentechnik/scripts/seo/audit-google-signal-integrity.mjs --out reports/editorial-leakage-35.3/signals --expect-no-orphans`
6. `node reports/editorial-leakage-35.3/validation/invariants-driver.mjs`
7. `node reports/editorial-leakage-35.3/validation/classify-driver.mjs`
8. `node reports/editorial-leakage-35.3/validation/audit-driver.mjs`
9. `node apps/pfotentechnik/scripts/seo/google-signal-browser-check.mjs --out reports/editorial-leakage-35.3/validation --editorial-geometry`

Tests erst nach abgeschlossenem Build ausführen. Bestehende Audit-Kommandos schreiben ihre üblichen Report-Dateien. Der Browserlauf benötigt lokales HTTP/Chrome; keine Screenshot-Erzeugung. Die große Suchwortliste dient der manuellen Kandidatenprüfung, die kleine dauerhafte QA-Regel liegt separat unter scripts/content-quality. Alle Classification-Entscheidungen gelten für diese dokumentierten Kontexte; die breite Liste ist kein allgemeines automatisches Schreibverbot.
