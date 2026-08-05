# pfotentechnik-sureflap-product-family-schema-closure-25.11.11

Schließt die aktuell erkennbare SureFlap-Schema-Kette:

- Connect wird vollständig auf das aktuelle Produktschema normalisiert.
- Standard erhält den fehlenden neutralen `rating: 0`-Platzhalter.
- DualScan und Petporte werden als bestehende Familienmitglieder mitgeprüft.
- Erfolg gibt es nur bei bestandenem Produkt-Audit und vollständigem Astro-Build.

```bash
node 3/apply-pfotentechnik-sureflap-product-family-schema-closure-25.11.11.mjs
```


## Korrektur in 25.11.11

Der generierte Test verwendete mehrzeilige Regex-Literale. Beim Schreiben des
Tests wurde `\n` als echter Zeilenumbruch interpretiert, wodurch ein ungültiges
JavaScript-RegExp entstand.

Die Frontmatter-Prüfung verwendet nun robuste String-Prüfungen:

- `source.startsWith("---\n")`
- `source.includes("\n---\n")`

Die Produktdaten und der fachliche Patch-Inhalt bleiben unverändert.


## Korrektur in 25.11.11

DualScan lag nach den vorangegangenen Rollbacks weiterhin als reine
Inhaltserweiterung ohne YAML-Frontmatter vor. Der Familienpatch schreibt nun
auch DualScan vollständig in den gültigen Produktzustand.

Außerdem prüft die Produktabgrenzung die Bedeutung statt eines einzigen
exakten Wortlauts. Connect, Standard und DualScan werden gemeinsam geschrieben,
getestet, gebaut und auf einen idempotenten zweiten Lauf geprüft.


## Korrektur in 25.11.11

Die Frontmatter-Prüfung verwendet keine Escape-Sequenzen mehr. Sie zerlegt den
Dateiinhalt über `String.fromCharCode(10)` in Zeilen und prüft die
YAML-Begrenzer als normale Strings.

Vor dem eigentlichen Testlauf wird die erzeugte Testdatei zusätzlich mit
`node --check` validiert. Ein syntaktisch beschädigter generierter Test kann
damit nicht mehr bis zur Testausführung gelangen.


## Korrektur in 25.11.11

Der Produkt-Audit meldete bereits 0 Fehler, das Astro-Content-Schema beanstandete
jedoch noch den alten `testStatus` der Standard-SureFlap.

Der Installer setzt nun strukturell:

```yaml
testStatus: "manufacturer-data"
rating: 0
```

Der generierte Familientest prüft beide Werte ausdrücklich. Der vollständige
Astro-Build bleibt das verbindliche Abschlusskriterium.
