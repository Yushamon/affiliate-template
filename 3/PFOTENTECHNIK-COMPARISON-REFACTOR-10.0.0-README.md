# PfotenTechnik Vergleichsplattform Refactor 10.0.0

## Warum dieses Paket existiert

Die verbundene GitHub-App kann das Repository `Yushamon/affiliate-template` lesen, blockiert aber sämtliche Schreiboperationen mit HTTP 403. Betroffen waren sowohl Branch-Refs als auch die Contents- und Git-Objects-API. Deshalb konnten die Änderungen nicht direkt auf GitHub committed werden.

Der Installer ist gegen den gelesenen Stand von `main` mit Commit

`f4b68252f37a09530f56ed7a2e6b630b74761652`

erstellt.

## Ausführung

Kopiere die MJS-Datei in das Stammverzeichnis von `affiliate-template`.

### Windows PowerShell

```powershell
node .\pfotentechnik-comparison-platform-refactor-10.0.0.mjs --branch=refactor/comparison-platform-premium --push
```

### macOS oder Linux

```bash
node ./pfotentechnik-comparison-platform-refactor-10.0.0.mjs --branch=refactor/comparison-platform-premium --push
```

Ohne `--push` werden Branch und Commits nur lokal erstellt.

## Vorprüfung

```bash
node ./pfotentechnik-comparison-platform-refactor-10.0.0.mjs --check
```

Der eigentliche Lauf verlangt standardmäßig ein sauberes Git-Arbeitsverzeichnis. `--allow-dirty` hebt diese Sicherung bewusst auf. Das ist nicht empfehlenswert, wenn bereits Änderungen an Vergleichsseiten oder internen Links offen sind.

## Was der Installer verändert

1. Er identifiziert alle vorhandenen Vergleichsseiten und alle Live-Seiten mit `category: vergleich`.
2. Er migriert kommerzielle Vergleichsseiten in `src/content/comparisons`.
3. Er führt überlappende Seiten in bereits vorhandene Vergleiche zusammen.
4. Er übernimmt Body, FAQ, Premiumblöcke, Produktauswahl, Methodik, Quellen und interne Links.
5. Er löscht die alte Seite erst nach erfolgreicher Erstellung des Zielvergleichs.
6. Er normalisiert alle Vergleichsseiten auf dieselbe Frontmatter- und Inhaltsbaseline.
7. Er ergänzt die gemeinsame ComparisonShell um eine echte Kurzantwort.
8. Er vereinheitlicht Testsieger, Preis-Leistung und Alternativen.
9. Er schreibt vollständige 301-Redirects mit und ohne abschließenden Slash.
10. Er ersetzt alte interne Vergleichslinks in Content, Komponenten, Navigation und CTA-Logik.
11. Er installiert einen eigenen strikten Refactor-Audit.
12. Er führt bestehende Comparison-, SEO- und Repository-Audits sowie den PfotenTechnik-Build aus.
13. Er erstellt logisch getrennte Git-Commits.
14. Er schreibt den Abschlussbericht nach:

```text
apps/pfotentechnik/reports/comparison-platform/comparison-refactor-2026-07-27.md
```

## Logische Commits

Der Installer erzeugt bei tatsächlichen Änderungen diese Commit-Gruppen:

```text
refactor(comparisons): migrate legacy commercial comparisons
feat(comparisons): enforce premium comparison baseline
fix(seo): canonicalize comparison routes and internal links
test(comparisons): add refactor integrity audit
docs(comparisons): record migration mapping
docs(comparisons): record successful final audit
```

## Ausgeführte Prüfungen

```text
node apps/pfotentechnik/scripts/comparison-platform/refactor-audit.mjs
npm --workspace apps/pfotentechnik run comparison:audit:strict
npm --workspace apps/pfotentechnik run comparison:integrity
npm --workspace apps/pfotentechnik run comparison:metadata:check
npm --workspace apps/pfotentechnik run comparison:data:audit:strict
npm --workspace apps/pfotentechnik run audit:technical-seo
npm --workspace apps/pfotentechnik run audit:comparison-schema
npm --workspace apps/pfotentechnik run audit:repository
npm run build:pfotentechnik
```

Schlägt eine Prüfung fehl, bricht der Installer mit Fehlercode 1 ab und schreibt einen Fehlerbericht. Er behauptet dann ausdrücklich nicht, dass der Refactor abgeschlossen sei.

## Sicherung

Vor jeder Änderung wird die ursprüngliche Datei unter folgendem Muster gesichert:

```text
.patch-backups/pfotentechnik-comparison-platform-refactor-10.0.0-<Zeitstempel>/
```

## Weitere Optionen

```text
--check           Nur Ist-Zustand und installierten Refactor-Audit prüfen
--no-commit       Dateien ändern, aber keine Commits erstellen
--no-branch       Auf dem aktuellen Branch arbeiten
--allow-dirty     Unsauberes Arbeitsverzeichnis bewusst zulassen
--push            Den erzeugten Branch nach origin pushen
--branch=<name>   Eigenen Branch-Namen verwenden
```

## Voraussetzungen

- Ausführung aus dem Stammverzeichnis von `affiliate-template`
- Node.js ab 22.12
- installierte Repository-Abhängigkeiten
- funktionierendes Git
- Push-Rechte nur bei Verwendung von `--push`
