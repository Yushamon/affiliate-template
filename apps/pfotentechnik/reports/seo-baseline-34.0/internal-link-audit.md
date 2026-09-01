# Internal Link & Decision Graph Audit

| Messung | Ergebnis |
|---|---:|
| Validierte Build-Routen | 367 |
| Content-Routen im Graph | 243 |
| Graph-Kanten | 57.835 |
| definierte Links | 514 |
| gerenderte automatische Links | 562 |
| defekte Ziele | 0 |
| kritische Befunde | 0 |
| Warnungen | 9 |

Die neun Warnungen sind fehlende eingehende Links, nicht defekte Ziele:

- `/hund-hat-durchfall/`, `/hund-trinkt-ploetzlich-viel/`, `/katze-an-trinkbrunnen-gewoehnen/`
- `/katzentrinkbrunnen-dauerbetrieb-urlaub/`, `/katzentrinkbrunnen-ohne-filter/`, `/trinkbrunnen-fuer-kitten-sicher/`
- `/seniorenhunde-richtig-versorgen/`, `/wie-kann-technik-gegen-langeweile-helfen/`
- `/produkt/feelneedy-fn-w18-8l-katzenbrunnen/`

Der Product → Comparison → Category-Pfad ist im Produktionsmodell grundsätzlich vorhanden: Products verlinken zu passenden Vergleichen/Alternativen, Comparisons führen zu Finalisten, relevanten Alternativen und dem vollständigen Explorer, Hubs führen in Kaufberatung und Vergleich. Die neun Ausnahmen sind P2-Linkpflege; es wird keine Link-Duplizierung allein zur Kantensteigerung empfohlen.
