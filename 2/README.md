# PfotenTechnik SEO-Copilot Prompt Engine 2.0.11

Reparatur der Marktsignal-Testmigration.

## Ursache

Der Installer verwendete:

```js
semanticMarketSignalLines.join("\\n")
```

Dadurch wurden sichtbare `\n`-Zeichen statt echter Zeilenumbrüche in
`test/seo-copilot.test.mjs` geschrieben.

## Korrektur

Der Installer erkennt nun drei mögliche Repository-Zustände:

1. alter wortlautabhängiger Test
2. beschädigter Test mit sichtbaren `\n`
3. bereits korrekt migrierter semantischer Test

Er überführt jeden unterstützten Zustand in denselben gültigen Zielzustand.
Die Datei ist bereits Teil von Backup und Rollback. Anschließend läuft
`node --check`, bevor die vollständige Testsuite startet.

Prompt-Engine, Auditlogik, Registry und Prompt-Ausgabe bleiben unverändert.

## Ausführen

```powershell
node ./2/apply-pfotentechnik-seo-copilot-prompt-engine-2.0.11.mjs
```
