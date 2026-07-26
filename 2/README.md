# PfotenTechnik Comparison Score + Price 3.3.4

Kumulativer Installer für den aktuellen PfotenTechnik-Stand. Version 3.3.4 korrigiert zusätzlich die Audit-Validierung. Bereits vor dem Patch vorhandene Produktdatenfehler blockieren den fachfremden Vergleichspatch nicht mehr; neue Fehler führen weiterhin zwingend zum Rollback.

## Enthalten

- gemeinsame kreisförmige Score-Darstellung für Produkt- und Vergleichsseiten
- Preise und Preisbewertung in Empfehlungskarten, Siegerbereich, Szenarien, Mobilkarten, Vergleichstabelle und Fazit
- zentrale Price Engine als Datenquelle der Vergleichsseiten
- genau eine Händler-/Affiliate-Ziel-URL im SEO Cockpit
- manuelles Speichern einer URL aktualisiert gleichzeitig den Produkt- und Vergleichs-CTA
- Migration alter `price.affiliateUrl`- und `price.source.url`-Dopplungen nach `affiliate.url`
- Rücknahme des hybriden Editorial-Layouts auf Produktseiten
- Wiederherstellung der vorherigen Karten für Galerie, Kaufentscheidung, Alltag, Vor-/Nachteile, Alternativen und Transparenz
- neutrale und negative Gründe der interaktiven Kaufentscheidung bleiben echte DOM-Symbole und können nicht als grüne Haken überschrieben werden
- sichtbare Breadcrumb-Ausgabe auf Vergleichsseiten entfernt, strukturierte Breadcrumb-Daten bleiben im Layout erhalten

## Installation

```powershell
node .\pfotentechnik-comparison-score-price-3.3.4\install.mjs --repo C:\hp\Projekt\affiliate-template
```

Der Installer legt vor jeder Änderung ein Backup unter `.patch-backups` an. Die Änderungspunkte werden anhand stabiler Codebereiche statt eines einzelnen exakten Import-Strings erkannt. Vor der ersten Änderung wird ein Produktdaten-Baseline-Audit erzeugt. Nach der Installation laufen Tests, ein zweiter Audit und der PfotenTechnik-Build. Der Installer bricht ab, sobald neue Produktfehler oder neue doppelte Slugs hinzukommen. Bereits vorhandene Fehler werden klar gemeldet, aber nicht diesem Patch zugerechnet. Bei einer Regression oder einem Buildfehler wird der gesamte Installationslauf zurückgesetzt.

## Rollback

```powershell
node .\pfotentechnik-comparison-score-price-3.3.4\rollback.mjs --repo C:\hp\Projekt\affiliate-template
```

## Hinweis zur URL-Migration

`affiliate.url` ist die kanonische URL-Wahrheit. Alte URL-Kopien im Preisblock werden beim Installieren bereinigt, sofern sie gültige HTTPS-Ziele enthalten. Nicht valide Altwerte werden nicht automatisch verändert und bleiben im Audit sichtbar.
