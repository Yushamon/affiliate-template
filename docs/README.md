# PfotenTechnik Content Platform 2.0 – Installer

Dieser Installer ersetzt den nicht mehr anwendbaren Git-Patch.

## Installation

Ordner in den Repository-Root entpacken:

```bash
node pfotentechnik-content-platform-2.0-installer/install-content-platform.mjs
npm run build:pfotentechnik
```

## Rollback

```bash
node pfotentechnik-content-platform-2.0-installer/rollback-content-platform.mjs
```

## Verhalten

- arbeitet mit stabilen Codeankern
- ist wiederholt ausführbar
- legt vor jeder Änderung ein Backup an
- übernimmt vorhandene Conversion-Journey- und Lightbox-Änderungen
- installiert Schema, Assembler, AutoContentBlocks und Dokumentation
