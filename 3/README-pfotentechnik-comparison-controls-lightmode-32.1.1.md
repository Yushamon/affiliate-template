# PfotenTechnik Comparison Controls & Light Mode 32.1.1

Behebt die aktuellen Mobile-Findings:

- Checkboxen im Filter und bei „Nur Unterschiede“ sind wieder kompakt
- keine langen leeren Pillen mehr
- Filteroptionen werden als klare zweispaltige Zeilen dargestellt
- Drawer nutzt globale Surface-, Border- und Text-Tokens
- Sticky-CTA ist im Light Mode hell und bleibt im Dark Mode tokenbasiert korrekt
- keine Theme-Sonderselektoren
- keine neuen `!important`

Ausführen:

```bash
node 3/apply-pfotentechnik-comparison-controls-lightmode-32.1.1.mjs
```
