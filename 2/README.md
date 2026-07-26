# PfotenTechnik Product Experience Hotfix 2.0.1

Der Hotfix korrigiert den aktuell installierten Stand von Product Experience 2.0.

## Änderungen

- Product Experience nutzt im Light und Dark Mode die zentralen semantischen Design-Tokens.
- Negative Gründe erhalten ein rotes X, neutrale Hinweise einen amberfarbenen Punkt. Nur echte Vorteile erhalten einen grünen Haken.
- Trockenfutter und Nassfutter werden ausschließlich bei Futterautomaten abgefragt.
- Nicht-Futterautomaten werden mit fünf statt sieben Fragen bewertet.
- Bei einem schwachen persönlichen Fit wird nur eine Alternative eingeblendet, deren berechneter persönlicher Fit oder redaktioneller Score mindestens fünf Punkte höher liegt.
- Preise können im SEO Cockpit manuell gepflegt werden.
- Manuelle Preise werden mit Quelle, Prüfzeitpunkt, Währung, URL und optionaler Preiseinordnung im zentralen `price`-Block gespeichert.

## Installation unter Windows

```powershell
node .\pfotentechnik-product-experience-hotfix-2.0.1\install.mjs --repo C:\hp\Projekt\affiliate-template
```

Der Installer sichert alle betroffenen Dateien und führt anschließend aus:

```text
node --experimental-strip-types --test test/product-experience-2-hotfix.test.mjs
npm run audit:products
npm run build
```

Bei einem Fehler werden die Änderungen automatisch zurückgerollt.

## Manueller Rollback

```powershell
node .\pfotentechnik-product-experience-hotfix-2.0.1\rollback.mjs --repo C:\hp\Projekt\affiliate-template
```

## Preis manuell pflegen

Nach dem Start des SEO Cockpits:

```text
http://localhost:4321/admin/seo/prices/
```

Dort kann ein Produkt ausgewählt oder über die Schaltfläche `Manuell` direkt in das Formular übernommen werden.
