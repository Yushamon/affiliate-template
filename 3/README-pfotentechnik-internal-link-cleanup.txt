PfotenTechnik Internal Link + Selflink Cleanup 1.0.0
===================================================

Datei:
  apply-pfotentechnik-internal-link-and-selflink-cleanup-1.0.0.mjs

Ausführung
----------

1. ZIP entpacken.
2. Die .mjs-Datei in den Root von Yushamon/affiliate-template kopieren.
3. Im Repository-Root ausführen:

   node apply-pfotentechnik-internal-link-and-selflink-cleanup-1.0.0.mjs

Optionaler Vorabscan ohne Änderungen:

   node apply-pfotentechnik-internal-link-and-selflink-cleanup-1.0.0.mjs --dry-run

Wenn node_modules bereits aktuell ist:

   node apply-pfotentechnik-internal-link-and-selflink-cleanup-1.0.0.mjs --skip-install

Nur Patch anwenden, ohne Build und Audits:

   node apply-pfotentechnik-internal-link-and-selflink-cleanup-1.0.0.mjs --skip-tests --skip-install

Was der Installer erledigt
--------------------------

- liest alte Vergleichsrouten ausschließlich aus apps/pfotentechnik/public/_redirects
- ersetzt interne Legacy-Vergleichslinks durch das endgültige /vergleiche/-Ziel
- berücksichtigt relative und absolute PfotenTechnik-URLs sowie Slash-, Query- und Hash-Varianten
- lässt externe URLs, Canonicals, Redirect-Definitionen, Reports, Backups und Codeblöcke unberührt
- entfernt manuelle Markdown- und HTML-Selbstlinks, ohne den Linktext zu löschen
- ergänzt eine zentrale URL-Policy mit Redirect-Alias-Auflösung
- filtert Selbstlinks aus DecisionNextSteps-Karten und unterdrückt leere Blöcke
- stärkt die Selbstlinkprüfung der Auto-Link-Engine für absolute URLs, Host- und Slash-Varianten
- erstellt einen strikten Audit des gebauten dist-HTML
- ergänzt fünf Tests für Alias-Auflösung, Host-/Slash-Normalisierung, Sprunglinks, Filterzustände und Empfehlungslisten
- legt vor jeder Änderung Backups unter .patch-backups/ an
- verändert keine Redirects und veröffentlicht nichts auf GitHub

Standardmäßig ausgeführte Validierung
--------------------------------------

- npm install
- npm --workspace apps/pfotentechnik run test:internal-linking
- npm run build:pfotentechnik
- npm --workspace apps/pfotentechnik run audit:internal-links:strict
- npm --workspace apps/pfotentechnik run audit:internal-link-targets:strict
- npm --workspace apps/pfotentechnik run audit:repository:strict
- npm --workspace apps/pfotentechnik run audit:technical-seo
- npm --workspace apps/pfotentechnik run comparison:audit:strict
- npm --workspace apps/pfotentechnik run comparison:integrity

Nur tatsächlich vorhandene Skripte werden ausgeführt. Fehlende optionale Skripte werden benannt und übersprungen.

Berichte
--------

- apps/pfotentechnik/reports/internal-linking/internal-link-cleanup.json
- apps/pfotentechnik/reports/internal-linking/internal-link-cleanup.md
- apps/pfotentechnik/reports/internal-linking/internal-link-target-audit.json
- apps/pfotentechnik/reports/internal-linking/internal-link-target-audit.md

Hinweis zur Prüfung
-------------------

Der Installer wurde außerhalb des echten Repositories syntaktisch geprüft und in einer isolierten Nachbildung getestet. Dort liefen die URL-Policy-Tests mit 5/5 erfolgreich und eine zweite Ausführung erzeugte keine weiteren Änderungen. Der vollständige Astro-Build kann erst in deiner lokalen Repository-Arbeitskopie erfolgen.
