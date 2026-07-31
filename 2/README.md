# PfotenTechnik Finding AI Null Safety 22.10.3

Behebt den Runtime-Absturz:

```text
Cannot read properties of undefined (reading 'map')
at buildFindingAiActions
```

Ausführen:

```bash
node 3/apply-pfotentechnik-seo-copilot-finding-ai-null-safety-22.10.3.mjs
```

Der Patch behandelt fehlende oder ungültige `aiActionIds` als leere Liste,
filtert ungültige Einträge und lässt die bestehende Registry- und Prompt-Logik
ansonsten unverändert.

Enthalten sind Regressionstests, vorhandene SEO-Copilot-Tests, vollständiger
Build und automatischer Rollback.
