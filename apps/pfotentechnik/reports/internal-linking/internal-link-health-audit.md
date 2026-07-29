# Internal-Link Health Audit 4.0.1

Erstellt: 2026-07-29T09:13:38.067Z

## Zusammenfassung

- Dokumente: 187
- Legacy-Fehler: 32
- Build-verifizierte Laufzeitfehler: 0
- Effektive Strict-Fehler: 0
- Effektive Warnungen: 66
- Erkannte False Positives: 20

## Bewertungslogik

- Der gebaute HTML-Linkziel-Audit ist für 404-Ziele und Selflinks maßgeblich.
- Astro-Seiten und Hub-Routen werden über den tatsächlichen `dist`-Bestand validiert.
- Alias-Konflikte bleiben Governance-Warnungen, bis ein falscher gerenderter Link nachgewiesen ist.
- Strict scheitert nur bei verifizierten Laufzeitfehlern oder deterministischen Architekturfehlern.

## Verifizierte Laufzeitfehler

Keine Befunde.

## Architekturfehler

Keine Befunde.

## False Positives des Quellmodells

- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /smarte-haustiertechnik/ verlinkt auf die nicht vorhandene Route /hersteller/. — Ziel /hersteller/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /smarte-haustiertechnik/ verlinkt auf die nicht vorhandene Route /vergleiche/. — Ziel /vergleiche/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /smarte-haustiertechnik/ verlinkt auf die nicht vorhandene Route /wissen/. — Ziel /wissen/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /so-bewerten-wir/ verlinkt auf die nicht vorhandene Route /kontakt/. — Ziel /kontakt/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /vergleiche/beste-futterautomaten-fuer-hunde/ verlinkt auf die nicht vorhandene Route /vergleiche/. — Ziel /vergleiche/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /vergleiche/beste-futterautomaten-fuer-katzen/ verlinkt auf die nicht vorhandene Route /vergleiche/. — Ziel /vergleiche/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /vergleiche/beste-futterautomaten-fuer-nassfutter/ verlinkt auf die nicht vorhandene Route /vergleiche/. — Ziel /vergleiche/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /vergleiche/beste-futterautomaten-fuer-zwei-katzen/ verlinkt auf die nicht vorhandene Route /vergleiche/. — Ziel /vergleiche/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /vergleiche/beste-futterautomaten-mit-kamera/ verlinkt auf die nicht vorhandene Route /vergleiche/. — Ziel /vergleiche/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /vergleiche/beste-futterautomaten-ohne-wlan/ verlinkt auf die nicht vorhandene Route /vergleiche/. — Ziel /vergleiche/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /vergleiche/beste-gps-tracker-fuer-hunde/ verlinkt auf die nicht vorhandene Route /vergleiche/. — Ziel /vergleiche/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /vergleiche/beste-gps-tracker-fuer-katzen/ verlinkt auf die nicht vorhandene Route /vergleiche/. — Ziel /vergleiche/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /vergleiche/beste-trinkbrunnen-fuer-hunde/ verlinkt auf die nicht vorhandene Route /vergleiche/. — Ziel /vergleiche/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /vergleiche/beste-trinkbrunnen-fuer-katzen/ verlinkt auf die nicht vorhandene Route /vergleiche/. — Ziel /vergleiche/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /vergleiche/futterautomat-mit-app/ verlinkt auf die nicht vorhandene Route /vergleiche/. — Ziel /vergleiche/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /vergleiche/gps-tracker-mit-langer-akkulaufzeit/ verlinkt auf die nicht vorhandene Route /vergleiche/. — Ziel /vergleiche/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /vergleiche/gps-tracker-ohne-abo/ verlinkt auf die nicht vorhandene Route /vergleiche/. — Ziel /vergleiche/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /vergleiche/kleine-gps-tracker-fuer-katzen/ verlinkt auf die nicht vorhandene Route /vergleiche/. — Ziel /vergleiche/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /welche-portionsgroesse-ist-richtig/ verlinkt auf die nicht vorhandene Route /vergleiche/. — Ziel /vergleiche/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.
- **INFO · LINK_TARGET_ROUTE_MISSING · source-model-false-positive:** /wie-gross-sollte-ein-futterautomat-sein/ verlinkt auf die nicht vorhandene Route /vergleiche/. — Ziel /vergleiche/ ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.

## Anchor-Governance

- **WARNING · UNRESOLVED_ANCHOR_CONFLICT · anchor-governance-review:** „automatischer futterspender“ wird von mehreren Zielen ohne eindeutigen Eigentümer beansprucht. — Mehrere Ziele beanspruchen denselben Alias. Das ist eine Ownership-Entscheidung, aber kein automatisch nachgewiesener kaputter Link.
- **WARNING · UNRESOLVED_ANCHOR_CONFLICT · anchor-governance-review:** „futterautomat fur grosse hunde“ wird von mehreren Zielen ohne eindeutigen Eigentümer beansprucht. — Mehrere Ziele beanspruchen denselben Alias. Das ist eine Ownership-Entscheidung, aber kein automatisch nachgewiesener kaputter Link.
- **WARNING · UNRESOLVED_ANCHOR_CONFLICT · anchor-governance-review:** „futtermenge katze“ wird von mehreren Zielen ohne eindeutigen Eigentümer beansprucht. — Mehrere Ziele beanspruchen denselben Alias. Das ist eine Ownership-Entscheidung, aber kein automatisch nachgewiesener kaputter Link.
- **WARNING · UNRESOLVED_ANCHOR_CONFLICT · anchor-governance-review:** „hundetrinkbrunnen“ wird von mehreren Zielen ohne eindeutigen Eigentümer beansprucht. — Mehrere Ziele beanspruchen denselben Alias. Das ist eine Ownership-Entscheidung, aber kein automatisch nachgewiesener kaputter Link.
- **WARNING · UNRESOLVED_ANCHOR_CONFLICT · anchor-governance-review:** „katze trinkt viel“ wird von mehreren Zielen ohne eindeutigen Eigentümer beansprucht. — Mehrere Ziele beanspruchen denselben Alias. Das ist eine Ownership-Entscheidung, aber kein automatisch nachgewiesener kaputter Link.
- **WARNING · UNRESOLVED_ANCHOR_CONFLICT · anchor-governance-review:** „katze trinkt zu wenig“ wird von mehreren Zielen ohne eindeutigen Eigentümer beansprucht. — Mehrere Ziele beanspruchen denselben Alias. Das ist eine Ownership-Entscheidung, aber kein automatisch nachgewiesener kaputter Link.
- **WARNING · UNRESOLVED_ANCHOR_CONFLICT · anchor-governance-review:** „petkit yumshare dual hopper 2“ wird von mehreren Zielen ohne eindeutigen Eigentümer beansprucht. — Mehrere Ziele beanspruchen denselben Alias. Das ist eine Ownership-Entscheidung, aber kein automatisch nachgewiesener kaputter Link.
- **WARNING · UNRESOLVED_ANCHOR_CONFLICT · anchor-governance-review:** „trinkbrunnen fur hunde“ wird von mehreren Zielen ohne eindeutigen Eigentümer beansprucht. — Mehrere Ziele beanspruchen denselben Alias. Das ist eine Ownership-Entscheidung, aber kein automatisch nachgewiesener kaputter Link.
- **WARNING · UNRESOLVED_ANCHOR_CONFLICT · anchor-governance-review:** „trinkbrunnen fur katzen“ wird von mehreren Zielen ohne eindeutigen Eigentümer beansprucht. — Mehrere Ziele beanspruchen denselben Alias. Das ist eine Ownership-Entscheidung, aber kein automatisch nachgewiesener kaputter Link.
- **WARNING · UNRESOLVED_ANCHOR_CONFLICT · anchor-governance-review:** „trinkbrunnen reinigen“ wird von mehreren Zielen ohne eindeutigen Eigentümer beansprucht. — Mehrere Ziele beanspruchen denselben Alias. Das ist eine Ownership-Entscheidung, aber kein automatisch nachgewiesener kaputter Link.
- **WARNING · UNRESOLVED_ANCHOR_CONFLICT · anchor-governance-review:** „wasserbedarf hund“ wird von mehreren Zielen ohne eindeutigen Eigentümer beansprucht. — Mehrere Ziele beanspruchen denselben Alias. Das ist eine Ownership-Entscheidung, aber kein automatisch nachgewiesener kaputter Link.
- **WARNING · UNRESOLVED_ANCHOR_CONFLICT · anchor-governance-review:** „wie oft hund futtern“ wird von mehreren Zielen ohne eindeutigen Eigentümer beansprucht. — Mehrere Ziele beanspruchen denselben Alias. Das ist eine Ownership-Entscheidung, aber kein automatisch nachgewiesener kaputter Link.

## Weitere Prüfhinweise

- **WARNING · LINKING_METADATA_MISSING · advisory:** /futterautomat-katze/ besitzt keine Linking-Metadaten. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · LINKING_METADATA_MISSING · advisory:** /gps-tracker-oder-bluetooth-tag/ besitzt keine Linking-Metadaten. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · LINKING_METADATA_MISSING · advisory:** /hund-frisst-zu-schnell/ besitzt keine Linking-Metadaten. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · LINKING_METADATA_MISSING · advisory:** /hund-trinkt-ploetzlich-viel/ besitzt keine Linking-Metadaten. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · LINKING_METADATA_MISSING · advisory:** /katze-an-trinkbrunnen-gewoehnen/ besitzt keine Linking-Metadaten. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · LINKING_METADATA_MISSING · advisory:** /katzentrinkbrunnen-dauerbetrieb-urlaub/ besitzt keine Linking-Metadaten. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · LINKING_METADATA_MISSING · advisory:** /seniorenhunde-richtig-versorgen/ besitzt keine Linking-Metadaten. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · LINKING_METADATA_MISSING · advisory:** /smarte-gadgets-fuer-hunde-und-katzen/ besitzt keine Linking-Metadaten. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · LINKING_METADATA_MISSING · advisory:** /so-bewerten-wir/ besitzt keine Linking-Metadaten. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · LINKING_METADATA_MISSING · advisory:** /wasserstelle-katze-richtiger-standort/ besitzt keine Linking-Metadaten. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · LINKING_METADATA_MISSING · advisory:** /wie-funktioniert-ein-futterautomat/ besitzt keine Linking-Metadaten. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · LINKING_METADATA_MISSING · advisory:** /wie-kann-technik-gegen-langeweile-helfen/ besitzt keine Linking-Metadaten. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /futtermenge-hund/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /hund-hat-durchfall/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /hund-ist-muede/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /katze-an-trinkbrunnen-gewoehnen/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /katzentrinkbrunnen-dauerbetrieb-urlaub/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /katzentrinkbrunnen-ohne-filter/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/aqara-smart-pet-feeder-c1/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/cat-mate-335-pet-fountain/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/cat-mate-c200/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/cat-mate-shell-fountain/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/catit-pixi-vision-smart-feeder/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/garmin-alpha-tt-25/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/honeyguardian-a305d/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/honeyguardian-a68/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/honeyguardian-smart-pet-feeder-s305d/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/imipaw-3l-automatic-cat-feeder/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/oneisall-2-2l-cordless-fountain/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/oneisall-2-in-1-feeder-water/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/oneisall-3-2l-cordless-fountain/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/oneisall-3-5l-cordless-fountain/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/oneisall-5l-automatic-cat-feeder/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/pawbby-smart-pet-feeder/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/petkit-eversweet-5-mini/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/petkit-eversweet-max-cordless/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/petkit-eversweet-solo-se/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/petkit-fresh-element-infinity/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/petlibro-air-automatic-feeder/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/petlibro-air-wifi-feeder/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/petlibro-glacier-ultrafiltration/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/petlibro-granary-2-vision/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/petlibro-granary-dual-feeder/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/petlibro-stainless-steel-fountain/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/petsafe-freshfeed-refrigerated-feeder/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/petsafe-healthy-pet-simply-feed/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/wopet-cube-air-ca10/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/wopet-heritage-view-camera-feeder/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/wopet-pioneer-f01-plus/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/xiaomi-smart-pet-fountain-2/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /produkt/zeromouse-2-0/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /seniorenhunde-richtig-versorgen/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /trinkbrunnen-fuer-kitten-sicher/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /wie-kann-technik-gegen-langeweile-helfen/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
