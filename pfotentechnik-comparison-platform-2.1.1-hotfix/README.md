# Comparison Platform 2.1.1 Hotfix

Behebt zwei Punkte:

1. `npm run comparison:audit` ist ein Diagnosebefehl und beendet sich künftig trotz gefundener Probleme mit Code 0.
2. Nur `npm run comparison:audit:strict` schlägt bei Fehlern oder Warnungen fehl.
3. Der Qualitätsscore wird weniger aggressiv gewichtet und fällt bei vielen Warnungen nicht sofort auf 0.

## Installation

```powershell
node .\pfotentechnik-comparison-platform-2.1.1-hotfix\apply-pfotentechnik-comparison-platform-2.1.1-hotfix.mjs --check
node .\pfotentechnik-comparison-platform-2.1.1-hotfix\apply-pfotentechnik-comparison-platform-2.1.1-hotfix.mjs
```

Danach:

```powershell
cd .\apps\pfotentechnik
npm run comparison:audit
```
