# PfotenTechnik Comparison Experience 32.0.1

Korrektur für die eingebettete Testdatei von 32.0.0.

## Ursache

Die Testquelle war als normaler JavaScript-Template-String eingebettet. Dadurch gingen Backslashes in RegExp-Literalen beim Schreiben verloren. Aus:

```js
/import "\.\/comparison-experience\.css";/
```

wurde eine ungültige RegExp.

## Korrektur

- `TEST_SOURCE` wird mit `String.raw` geschrieben.
- Die Importprüfung verwendet eine robuste String-Prüfung.
- Installer und die tatsächlich erzeugte Testdatei werden vor der Ausgabe separat mit `node --check` geprüft.
- Architektur, CSS, Cleanup und Token-Nutzung bleiben unverändert.

## Ausführung

```bash
node 3/apply-pfotentechnik-comparison-experience-32.0.1.mjs
```
