# PfotenTechnik Quality Operations 1.0.0

Der SEO Copilot verwendet den bestehenden lokalen Copilot-Workspace jetzt als zentrale Quality-Operations-Plattform. Vorhandene Audits bleiben die fachlichen Quellen; es gibt keine zweite Audit-Architektur.

## Betrieb

- `npm --workspace apps/pfotentechnik run quality-ops:sync` sammelt vorhandene Reports ein, normalisiert Findings, bildet Gruppen und schreibt einen historischen Snapshot.
- `npm --workspace apps/pfotentechnik run quality-ops:check` führt denselben Abgleich aus und beendet sich bei aktiven Release-Blockern mit Exitcode 1.
- `npm --workspace apps/pfotentechnik run test:seo-copilot` prüft Modell, Priorisierung, Regressionen, Gruppengrenzen, Actions, Migration und die kompakte Build-Architektur.
- `seo:release:check` führt `quality-ops:check` nach den bestehenden Fach-Audits aus.

## Datenmodell

Jedes Finding enthält ID, Typ, Kategorie, Bereich, Schweregrad, Confidence, Priorität mit Faktoren, Status, Quelle, Report, Dateien, URLs, Beschreibung, Auswirkung, Fix-Art, Aktion und Zeitstempel. Stabile Fingerprints verbinden aufeinanderfolgende Snapshots.

Status: Open, In Progress, Fixed, Ignored, Snoozed, Waiting, Manual Review, Auto Fixed und Regression.

Die Priorität gewichtet Ranking- und Nutzerauswirkung, Release-Blocker, technische Risiken, Vertrauen, Wiederholungswahrscheinlichkeit und Aufwand. Gruppen enthalten höchstens vier Findings und fünf Dateien und werden aus Bereich, Kategorie und gemeinsamem Ziel gebildet.

## Sicherheit und Performance

Der Astro-Build führt keine Audits aus. Admin-Seiten lesen ausschließlich den bereits erzeugten Workspace-Snapshot; der Advisor zeigt höchstens zwölf Arbeitspakete und vierzig zentrale Findings.

Statusänderungen werden atomar gespeichert und protokolliert. Auto-Fixes sind explizit erlaubt, benötigen eine Bestätigung und führen Vorprüfung, festen Fix, Strict-Audit und erneuten zentralen Abgleich aus. Es gibt keine frei parametrisierbare Shell-Aktion. Derzeit ist nur der vorhandene Comparison-Auto-Fix freigegeben.

Preis und Verfügbarkeit erzeugen Datenqualitäts-Findings, verändern aber keinen redaktionellen Produkt- oder Empfehlungsscore.
