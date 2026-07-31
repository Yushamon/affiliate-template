# SEO Copilot Null Safety + Architecture Test 22.10.7

## Behoben

1. `buildFindingAiActions()` behandelt fehlende oder ungültige
   `aiActionIds` als leere Liste.
2. Der alte SEO-Copilot-Architekturtest erwartet Card-, Table- und
   Finding-Regeln nicht mehr direkt im reinen CSS-Entrypoint.
3. Stattdessen werden die tatsächlichen Layer geprüft:
   - `seo-admin-panels.css`
   - `seo-admin-content.css`
   - `seo-admin-operations.css`

## Unverändert

Registry, Prompt-Logik, Priorisierung und Finding-Datenmodell bleiben
unangetastet.
