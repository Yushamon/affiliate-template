# Product Engine 2.1.1 Complete

Dieses Paket behebt den UNRESOLVED_IMPORT-Fehler und installiert in einem Lauf:

- Product Standard 2.0 Foundation
- Product Standard 2.0 Part 2
- Product Engine 2.1
- ProductRenderer.astro
- alle abhängigen Komponenten
- Product-Engine-Libraries
- die migrierte `src/pages/produkt/[product].astro`

## Installation

Im Repository-Root:

```bash
node <entpackter-ordner>/install.mjs
```

Der Installer legt ein Backup an, kopiert alle Dateien, ergänzt die Audit-Skripte und führt anschließend `npm run build:pfotentechnik` aus. Bei einem Fehler erfolgt ein Rollback.
