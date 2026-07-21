# PfotenTechnik IndexNow Hotfix 1.1

Behebt die unklare Meldung zur nicht übereinstimmenden Key-Datei.

## Installation

```bash
python3 apply-pfotentechnik-indexnow-hotfix-1.1-safe.py
```

## Danach

```bash
npm run indexnow:status
```

Erst wenn `Inhalt: korrekt` erscheint:

```bash
npm run indexnow:pfotentechnik:all
```

Der Hotfix liest den Key aus der vorhandenen Datei in `apps/pfotentechnik/public/`, toleriert BOM und Whitespace und zeigt HTTP-Status, Content-Type und den ausgelieferten Remote-Inhalt an. Build, Dry Run, Backup und Rollback sind enthalten.
