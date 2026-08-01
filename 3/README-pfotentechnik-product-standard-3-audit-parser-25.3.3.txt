PfotenTechnik Product Standard 3 Audit Parser 25.3.3

Gezielter Fix für die beiden pauschalen False Positives.

Änderungen:
- `specs` werden als YAML-Objektliste über ihre `- label:`-Einträge gezählt
- `editorial.evidence` wird über den echten verschachtelten Pfad gezählt
- die generische Listenzählung bleibt für andere einfache Listen bestehen
- Audit läuft vor den Regressionstests, damit der Report aktuell ist

Installation:
  node 3/apply-pfotentechnik-product-standard-3-audit-parser-25.3.3.mjs
