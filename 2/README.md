# PfotenTechnik SEO-Preisbereich Workflow 2.0.0

Behebt den aktuellen SEO-Preisbereich:

- Filter funktionieren wieder sichtbar. Ursache war eine CSS-Regel, die das HTML-Attribut `hidden` überschrieben hat.
- Preise werden beim ersten Speichern übernommen. Eine Preiseingabe setzt den Preisstatus automatisch auf „vorhanden“.
- Affiliate- und Händlerlinks können auch ohne Preis gespeichert oder entfernt werden.
- Links ohne Protokoll werden auf HTTPS normalisiert.
- Händlername wird aus der URL vorgeschlagen, wenn das Feld leer ist.
- Produktaktionen bleiben ohne horizontales Scrollen sichtbar.
- Die Filterleiste bleibt beim Scrollen erreichbar.
- `Strg + Enter` beziehungsweise `Cmd + Enter` speichert den geöffneten Datensatz.
- Zusätzliche Tests schützen Filter, Preisstatus und Link-Persistenz.

## Installation

Im Root von `affiliate-template` ausführen:

### macOS / Linux

```bash
node apply-pfotentechnik-seo-price-workflow-2.0.0.mjs
```

### Windows PowerShell

```powershell
node .\apply-pfotentechnik-seo-price-workflow-2.0.0.mjs
```

Nur Vorprüfung:

```bash
node apply-pfotentechnik-seo-price-workflow-2.0.0.mjs --check
```

Ohne automatische Tests und Build:

```bash
node apply-pfotentechnik-seo-price-workflow-2.0.0.mjs --skip-verify
```

Der Installer legt vor jeder Änderung ein Backup unter `.patch-backups/` an und ist erneut ausführbar.
