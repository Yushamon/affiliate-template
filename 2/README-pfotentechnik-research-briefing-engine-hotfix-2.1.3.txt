PfotenTechnik Research Briefing Engine Hotfix 2.1.3

Warum 2.1.2 nicht geholfen hat

Die Erkennung in 2.1.2 hielt einen vorhandenen, aber nicht wirksamen
implementationBrief-Treffer für den eigentlichen Laufzeit-Helper. Deshalb wurde
nichts geändert, obwohl normalizeResearchStore weiterhin eine nicht definierte
Funktion aufrief.

2.1.3 behebt das eindeutig:

- verwendet einen neuen, unverwechselbaren Helpernamen:
  normalizeImplementationBrief
- ersetzt den alten Funktionsaufruf zentral
- fügt den Helper garantiert im Modul-Scope direkt vor normalizeResearchStore ein
- prüft, dass der Helper genau einmal vorhanden ist
- testet alte Items ohne Briefing und neue Items mit Briefing
- führt anschließend alle bestehenden Research-Tests erneut aus

Anwendung

node ./2/apply-pfotentechnik-research-briefing-engine-hotfix-2.1.3.mjs --check

Danach

node ./2/apply-pfotentechnik-research-briefing-engine-hotfix-2.1.3.mjs

Anschließend

npm --workspace apps/pfotentechnik run build
