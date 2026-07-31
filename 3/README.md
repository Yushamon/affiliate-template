# PfotenTechnik CSS Consolidation Audit 1.0.0

Der Installer verändert keine produktiven CSS-Dateien. Er erstellt eine belastbare
Quellanalyse für den nächsten CSS-Cleanup:

- Bytes und Regeln pro CSS-/Astro-Datei
- `!important` pro Datei
- mehrfach definierte Selektoren
- identische Deklarationsblöcke
- Ranking der sinnvollsten Cleanup-Ziele

Ausführen im Repository-Root:

```bash
node 3/apply-pfotentechnik-css-consolidation-audit-1.0.0.mjs
```

Reports:

```text
apps/pfotentechnik/reports/design-system/css-consolidation-audit-latest.md
apps/pfotentechnik/reports/design-system/css-consolidation-audit-latest.json
```

Danach werden bestehender Komponenten- und Performance-Audit ausgeführt.
