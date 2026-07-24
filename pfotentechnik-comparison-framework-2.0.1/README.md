# PfotenTechnik Comparison Framework 2.0.1

Korrigierte, syntaxsichere Version. Die Scoring-Engine liegt als separate Datei im Payload und wird nicht mehr als verschachtelter Template-String in den Installer eingebettet.

## Mac

```bash
node ./pfotentechnik-comparison-framework-2.0.1/apply-comparison-framework-2.0.1.mjs
node ./apps/pfotentechnik/scripts/generate-water-fountain-comparisons.mjs --write --force
npm run build:pfotentechnik
```

## Logik

- Kleine Hunde: Zielwert 2,5 l
- Mittelgroße Hunde: Zielwert 3,5 l
- Große Hunde: Mindestwert 4 l, Bonus ab 5 l
- Mehrhundehaushalte: Mindestwert 5 l, Bonus ab 6 l
- Reine Katzenbrunnen werden im Hundevergleich stark abgewertet
- Allgemeine Bewertung bleibt nur ein Teil des Scores
