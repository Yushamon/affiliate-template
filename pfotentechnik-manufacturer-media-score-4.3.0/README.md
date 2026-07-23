# PfotenTechnik Hersteller Media & Score 4.3.0

Dieser Patch behebt die verbliebenen Probleme auf Herstellerseiten und in der Herstellerübersicht.

## Herstellerbilder

- maximale Hero-Höhe: 340 px auf Desktop
- maximale Hero-Höhe: 230 px auf Mobilgeräten
- vollständige Darstellung über `object-fit: contain`
- keine viewportfüllenden oder extrem vergrößerten Herstellerbilder mehr
- zentrierte Darstellung für Hoch- und Querformate

## Bewertungen

Alle erkannten Varianten werden auf dasselbe Format normalisiert:

```text
82/100
```

Beispiele:

- `⭐ 4.6 / 5` → `92/100`
- `82 Score` → `82/100`
- `Score 82` → `82/100`
- `82/100` bleibt `82/100`

Sterne und das ausgeschriebene Wort „Score“ entfallen.

## Installation unter Windows

Im Repository-Root:

```powershell
py .\pfotentechnik-manufacturer-media-score-4.3.0\apply-pfotentechnik-manufacturer-media-score-4.3.0.py
```

Falls Python npm nicht findet, bleiben die Änderungen installiert. Danach:

```powershell
npm run build:pfotentechnik
```
