PfotenTechnik Research Briefing Engine 2.1.1

Hotfix für 2.1.0.

Ursache:
Der erste Installer erwartete eine exakt formatierte, einzeilige
ResearchActionBundle-Definition. Dein aktueller Git-Stand enthält dieselbe
Architektur, aber mit abweichender Formatierung. Deshalb brach die sichere
Vorprüfung bei „Schema-Interface“ ab.

2.1.1:
- erkennt minifizierte und mehrzeilige TypeScript-Formatierung
- arbeitet marker- und regexbasiert statt mit exakten Vollzeilen
- führt alle Änderungen erst nach vollständiger Vorprüfung aus
- bleibt idempotent
- integriert das Umsetzungsbriefing, den Entwickler-Prompt und den Kopierbutton
- legt Backups unter .patch-backups an

Anwendung:

node ./2/apply-pfotentechnik-research-briefing-engine-2.1.1.mjs --check

Danach:

node ./2/apply-pfotentechnik-research-briefing-engine-2.1.1.mjs

Anschließend:

npm --workspace apps/pfotentechnik run build
