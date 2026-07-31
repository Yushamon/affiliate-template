# PfotenTechnik SEO-Copilot Prompt Engine 2.0.3

Korrektur des AI-Action-Mappings.

## Ursache

Die zentrale Registry unterscheidet zwischen:

- AI-Action-ID: `codex-send`
- Prompt-Template-ID: `codex-remediation`

Der Test der Version 2.0.2 verwendete die Template-ID als Action-ID. Die Registry
verwarf sie deshalb und `buildFindingAiActions()` lieferte keine Action.

## Korrektur

- Der Haupttest verwendet die kanonische Action-ID `codex-send`.
- Bereits gespeicherte Template-IDs werden als kompatible Aliasse aufgelöst.
- Fehlen `aiActionIds`, nutzt die Engine `resolveFindingAiActionIds()`.
- Die zentrale AI-Action-Registry bleibt die einzige Quelle.
- Der Windows-Runner über `cmd.exe /d /s /c` bleibt erhalten.

## Ausführen

```powershell
node ./2/apply-pfotentechnik-seo-copilot-prompt-engine-2.0.3.mjs
```
