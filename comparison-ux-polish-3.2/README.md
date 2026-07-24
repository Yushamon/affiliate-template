# Comparison UX Polish 3.2

Repositorybasierter Installer für `Yushamon/affiliate-template`.

## Ausführen

```bash
node apply-comparison-ux-polish-3.2.mjs --check
node apply-comparison-ux-polish-3.2.mjs
npm run build:pfotentechnik
```

## Änderungen

- Entscheidungsreise neu geordnet
- ScenarioRecommendations per Slot direkt nach dem Gewinner
- redaktionelle Zusammenfassung vor dem Direktvergleich
- FAQ vor verwandten Inhalten
- mobile Recommendation- und Produktkarten ohne horizontale Scrollbereiche
- viewport-sichere Grids und Inhalte
- Touch Targets mindestens 44 px
- tokenbasierter Dark Mode für Szenario-Karten
- semantische Sections und interne Anker
- Backups unter `.patch-backups/`
- idempotent und mit `--check`

## Einschränkung

Der Installer wurde gegen den am 24.07.2026 gelesenen `main`-Stand erstellt. Er verweigert Änderungen bei einem strukturell unbekannten Stand, statt Dateien blind zu beschädigen.
