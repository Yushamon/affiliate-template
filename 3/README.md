# CSS Architecture Audit Accuracy 21.1.4

Korrigiert den Escape-Fehler aus 21.1.3. Der vorherige Patch erzeugte versehentlich
`/!important\\b/g` und fand dadurch keine Deklarationen.

Ausführen:

```bash
node 3/apply-pfotentechnik-css-architecture-audit-accuracy-21.1.4.mjs
```
