# Hotfix 10.0.1

Der Hotfix ersetzt die fragile Badge-Ankerprüfung durch eine whitespace-tolerante RegExp-Prüfung.

## Aktueller Zustand

Der erste Lauf hat bereits folgenden Commit lokal erstellt:

```text
65addc0 refactor(comparisons): migrate legacy commercial comparisons
```

Diesen Commit nicht zurücksetzen. Der Installer ist idempotent und setzt auf dem vorhandenen Branch fort.

## Ausführung

Aus dem Repository-Stammverzeichnis:

```bash
node 3/pfotentechnik-comparison-platform-refactor-10.0.1.mjs --branch=refactor/comparison-platform-premium --push
```

Da der Branch bereits ausgecheckt ist, erkennt der Installer ihn und arbeitet weiter. Sollte die Branch-Erstellung beanstandet werden, nutze:

```bash
node 3/pfotentechnik-comparison-platform-refactor-10.0.1.mjs --no-branch --push
```

Der zweite Befehl ist für den aktuellen Zustand die sicherste Variante.
