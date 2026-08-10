# PfotenTechnik SEO Recovery Query Match 33.3.1

Fix gegenüber 33.3.0:
- behebt den Syntaxfehler im eingebetteten Regressionstest
- ersetzt die fragile RegExp-Erzeugung durch eine direkte `includes()`-Prüfung
- Installer wurde vor Bereitstellung mit `node --check` geprüft

Ausführen aus dem Repository-Root:

```bash
node 3/apply-pfotentechnik-seo-recovery-query-match-33.3.1.mjs
```
