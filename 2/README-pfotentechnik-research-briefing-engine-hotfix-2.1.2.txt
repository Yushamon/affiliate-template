PfotenTechnik Research Briefing Engine Hotfix 2.1.2

Fehlerursache

2.1.1 hat den Aufruf

implementationBrief: implementationBrief(...)

in normalizeResearchStore ergänzt. Der zugehörige Laufzeit-Helper wurde in
deinem formatierten Schema jedoch nicht eingefügt. TypeScript konnte die Datei
laden, aber beim ersten belegten Research-Item entstand deshalb:

ReferenceError: implementationBrief is not defined

Der Hotfix

- ergänzt ausschließlich den fehlenden zentralen Normalizer
- fügt keine Sonderregel für einzelne Research-Items ein
- hält implementationBrief weiterhin optional
- testet alte Items ohne Briefing
- testet neue Items mit vollständigem Briefing
- führt danach die vorhandenen Research-Tests erneut aus

Anwendung

node ./2/apply-pfotentechnik-research-briefing-engine-hotfix-2.1.2.mjs --check

Danach

node ./2/apply-pfotentechnik-research-briefing-engine-hotfix-2.1.2.mjs

Anschließend

npm --workspace apps/pfotentechnik run build
