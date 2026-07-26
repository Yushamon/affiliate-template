# PfotenTechnik Mobile Product Layout 4.0.1

Korrigierte Fassung von 4.0.0.

## Behebt

1. `spawnSync npm.cmd EINVAL` unter Windows/Node 24 und Node 26
2. zerstörte mobile Preisdarstellung in Vergleichs-Empfehlungskarten
3. installiert weiterhin das mobile Premium-Layout der Produktseiten

## Ursache der Vergleichsdarstellung

Die mobile Empfehlungskarte verwendet eine schmale Bildspalte und eine breite
Inhaltsspalte. Der nachträglich ergänzte Preisblock konnte als weiteres
Grid-Element in die Bildspalte einsortiert werden. Dadurch wurden sowohl
`PREIS` als auch Beträge wie `ca. 45,71 €` zeichenweise umgebrochen.

Version 4.0.1 weist dem Preisblock explizit `grid-column: 1 / -1` zu und
verhindert Zeichenumbrüche innerhalb des Preislabels und des Geldbetrags.

## Installation

```powershell
node .\pfotentechnik-mobile-product-layout-4.0.1\install.mjs --repo C:\hp\Projekt\affiliate-template
```

Der Installer startet npm unter Windows über `cmd.exe /d /s /c`, da das direkte
Starten von `npm.cmd` bei bestimmten Node-Versionen mit `EINVAL` fehlschlägt.

## Optional ohne Baseline-Build

Nur verwenden, wenn der unveränderte Repository-Stand bereits unmittelbar
zuvor erfolgreich gebaut wurde:

```powershell
node .\pfotentechnik-mobile-product-layout-4.0.1\install.mjs --repo C:\hp\Projekt\affiliate-template --skip-baseline
```

Der Abschluss-Build wird weiterhin immer ausgeführt.

## Rollback

```powershell
node .\pfotentechnik-mobile-product-layout-4.0.1\rollback.mjs --repo C:\hp\Projekt\affiliate-template
```
