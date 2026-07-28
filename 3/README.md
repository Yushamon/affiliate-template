# PfotenTechnik SEO Co-Pilot Work Packages 2.0.0

Dieser Patch baut den bestehenden SEO Co-Piloten zu einem persistenten Workflow mit priorisierten Codex-Arbeitspaketen, technischer Prüfung, Search-Wiedervorlage und Snooze-Status aus.

## Installation

Archiv in einen beliebigen Ordner entpacken. Danach im Repository `Yushamon/affiliate-template` ausführen:

```bash
node <ENTPACKTER_ORDNER>/apply-pfotentechnik-seo-work-packages-2.0.0.mjs
```

Der Installer:

1. erkennt die Repository-Wurzel,
2. prüft alle bestehenden Zieldateien gegen den gelesenen GitHub-Stand,
3. bricht bei Abweichungen vor dem ersten Schreibvorgang ab,
4. legt ein Backup unter `.patch-backups/` an,
5. schreibt die Dateien,
6. führt die geforderten Tests, Audits und den Build aus.

## Optionen

```bash
node apply-pfotentechnik-seo-work-packages-2.0.0.mjs --dry-run
node apply-pfotentechnik-seo-work-packages-2.0.0.mjs --skip-validation
node apply-pfotentechnik-seo-work-packages-2.0.0.mjs --force
node apply-pfotentechnik-seo-work-packages-2.0.0.mjs --rollback .patch-backups/<BACKUP-ORDNER>
```

`--force` überschreibt abweichende Zieldateien und sollte nur nach eigener Prüfung verwendet werden.

## Enthaltene Validierungen

```text
npm --workspace apps/pfotentechnik run test:seo-copilot
npm --workspace apps/pfotentechnik run build:content-graph
npm --workspace apps/pfotentechnik run lint:content
npm --workspace apps/pfotentechnik run audit:repository
npm --workspace apps/pfotentechnik run audit:products:strict
npm --workspace apps/pfotentechnik run seo:release:check:no-build
npm run build:pfotentechnik
```

## GitHub-Hinweis

Der verbundene GitHub-Zugriff konnte das Repository lesen, aber weder einen Branch anlegen noch Dateien schreiben. GitHub antwortete auf beide Schreibversuche mit HTTP 403. Deshalb liegt die vollständige Umsetzung als vorgeprüfter Installer vor und ist nicht als Commit oder Pull Request veröffentlicht.
