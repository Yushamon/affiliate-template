PfotenTechnik Research Engine 2.0.2

Ursache des Fehlers:
Das Script research:check rief den Research-Importer mit --check, aber ohne
Importdatei auf. Der Importer verlangte trotzdem zwingend einen Dateipfad und
beendete sich mit der Nutzungsmeldung.

Generelle Lösung:
- `research:check` validiert ohne Dateipfad den bestehenden Store
  `apps/pfotentechnik/research/research.json`.
- `research:import -- <datei>` importiert weiterhin eine externe JSON-Datei.
- `research:import -- <datei> --check` prüft weiterhin eine externe Datei,
  ohne sie zu schreiben.
- Es entsteht kein zweites Prüfscript und keine Sonderbehandlung im Installer.

Anwendung:

node 3/apply-pfotentechnik-research-engine-2.0.2.mjs --check

Danach:

node 3/apply-pfotentechnik-research-engine-2.0.2.mjs
