# PfotenTechnik Header Navigation 13.1.0

Behebt:

- doppeltes Burger-Icon
- fehlenden Vergleichslink
- ungeordnete dynamische Hauptnavigation
- unstrukturierte mobile Menüansicht
- mobile Dark-Mode- und Scroll-Probleme

## Installation

ZIP entpacken und die MJS-Datei in den Root des Repositories `affiliate-template` legen.

Vorprüfung:

```bash
node pfotentechnik-header-navigation-13.1.0.mjs --check
```

Anwenden und Build ausführen:

```bash
node pfotentechnik-header-navigation-13.1.0.mjs
```

Ohne Build:

```bash
node pfotentechnik-header-navigation-13.1.0.mjs --no-build
```

Mit lokalem Commit:

```bash
node pfotentechnik-header-navigation-13.1.0.mjs --commit
```

Der Installer legt vor Änderungen Backups unter `.patch-backups/` ab.
