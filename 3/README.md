# pfotentechnik-topical-authority-journey-completion-26.8.2

Korrigiert die Fertiglogik der Topical-Authority-Roadmap.

## Änderung

Die Chance „Trinkbrunnen um kaufnahe Intentionen ergänzen“ hängt nicht mehr
pauschal an `linkCoverage < 70`. Stattdessen werden zehn konkrete Pflichtkanten
zwischen Hub, Material, Reinigung, Filter und Katzenvergleich geprüft.

Die globale Linkabdeckung bleibt als Diagnosewert erhalten. Medizinische oder
rein pflegeorientierte Seiten müssen nicht künstlich zum Produktvergleich
verlinken.

## Ausführen

```bash
node 3/apply-pfotentechnik-topical-authority-journey-completion-26.8.2.mjs
```

## Eigenschaften

- keine Content-Dateien
- keine neue Seite
- allgemeine Journey-Completion-Registry
- idempotent
- Git-Konfliktprüfung vor Änderungen
- Backup und Rollback
- Node 24/26, Windows, macOS und Linux


## Korrektur in 26.8.2

Der Regressionstest entfernt ausschließlich die Rückkante
`Katzenvergleich → Filterratgeber`.

Version 26.8.1 entfernte versehentlich jeden Link zum Filterratgeber und damit
zusätzlich `Hub → Filterratgeber`. Die Produktionslogik war korrekt; der
Installer hat sämtliche Änderungen ordnungsgemäß zurückgerollt.
