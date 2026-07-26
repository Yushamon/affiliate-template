# Validierung

Stand der Paketprüfung: 26. Juli 2026.

## Lokal ausgeführt

- Syntaxprüfung aller `.mjs`-Dateien mit `node --check`
- Syntaxprüfung aller TypeScript-Domänenmodule mit Node Type-Stripping
- Transpile-Prüfung der Frontmatter- und Client-Script-Blöcke aller enthaltenen Astro-Komponenten
- 10 Unit-Tests für Preisrange, Preis-Freshness, Entscheidungslogik, Händlerdaten-Extraktion, Netzwerkziel-Sperren, Amazon-Mediafilter, Produktzuordnung und atomaren Dateiersatz
- vollständige Mock-Installation aller vier Module
- vollständiger Mock-Rollback mit Wiederherstellung der Originaldateien und Entfernung neu angelegter Verzeichnisse

## Im Zielrepository durch den Installer ausgeführt

Der Installer startet vor jeder Änderung einen Baseline-Build. Danach führt jedes Modul seine eigenen Tests, Audits und einen vollständigen PfotenTechnik-Build aus. Modul 4 ergänzt den vorhandenen Repository-Audit. Bei einem Fehler wird das laufende Modul zurückgerollt und die Installation gestoppt.

## Technische Grenze dieser Übergabe

Der GitHub-Connector konnte das Repository lesen, hat aber Branch- und Datei-Schreiboperationen trotz angezeigter Schreibrechte mit HTTP 403 abgelehnt. Deshalb konnte in dieser Sitzung kein Branch und kein Pull Request angelegt werden. Außerdem stand im Ausführungscontainer kein vollständiger Repository-Checkout mit installierten Abhängigkeiten zur Verfügung. Der reale Astro-Build wird daher bewusst vom Installer im Zielrepository erzwungen und nicht als bereits hier ausgeführt behauptet.
