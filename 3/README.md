# PfotenTechnik SEO Research Engine 1.0.2

Schlanke Erweiterung des bestehenden Topical-Authority-Bereichs.

- eine Datei: `apps/pfotentechnik/research/research.json`
- Git ist die Historie
- keine Datei pro Produkt
- Research für Themen, Produkte, Hersteller und Content-Refresh

Ausführen:

```powershell
node ./2/apply-pfotentechnik-seo-research-engine-1.0.2.mjs
```

Danach in `/admin/seo/topical-authority/` den Research-Auftrag kopieren. ChatGPT-Antwort als `research-import.json` speichern und importieren:

```powershell
npm --workspace apps/pfotentechnik run research:import -- ./research-import.json
```


## Korrektur in 1.0.2

Der plattformabhängige Command-Wrapper wurde vollständig neu geschrieben.

- kein komprimierter Einzeiler
- kein ungültiges Quote-Escaping
- `spawnSync()` bleibt bei `shell: false`
- stabile Argumentübergabe unter macOS, Linux und Windows


## Korrektur in 1.0.2

Alle verbliebenen Aufrufe des alten `invoke`-Helpers wurden auf `commandForPlatform` migriert. Der Installer wird vor Auslieferung mit `node --check` geprüft.
