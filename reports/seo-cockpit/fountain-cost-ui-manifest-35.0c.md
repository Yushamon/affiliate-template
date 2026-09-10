# Fountain Cost UI Manifest 35.0C

Status: **VALIDATED / PRODUCTION DISABLED**

Die Aktivierungsentscheidung ist für alle 24 Trinkbrunnen explizit hinterlegt und wird nicht zur Laufzeit aus unvollständigen Daten erraten. Validiert wurden Produktdaten, gewähltes Kostenangebot, Calculation Engine und die Commerce-Auflösung aus 35.0B.2.

| State | Produkte | Kosten | Angebot | Affiliate-CTA |
| --- | ---: | ---: | ---: | ---: |
| FULL | 5 | 5 | 5 | 5 |
| COST_ONLY | 10 | 10 | 10 | 0 |
| OFFER_ONLY | 1 | 0 | 1 | 0 |
| INFO_ONLY | 8 | 0 | 0 | 0 |
| HIDE | 0 | 0 | 0 | 0 |
| **Gesamt** | **24** | **15** | **16** | **5** |

| Slug | State | Cost | Offer | CTA | Evidence | Grund |
| --- | --- | --- | --- | --- | --- | --- |
| cat-mate-shell-fountain | COST_ONLY | ja | ja | nein | verified | Kein exakt konsistentes Affiliate-Angebot |
| oneisall-7l-dog-water-fountain | OFFER_ONLY | nein | ja | nein | verified | Intervall/Jahreskosten nicht belastbar |
| petkit-eversweet-max-cordless | COST_ONLY | ja | ja | nein | verified | Kein exakt konsistentes Affiliate-Angebot |
| petkit-eversweet-ultra | INFO_ONLY | nein | nein | nein | partial | Keine belastbare Jahreskostenangabe |
| petlibro-dockstream-rfid-smart | COST_ONLY | ja | ja | nein | verified | Kein exakt konsistentes Affiliate-Angebot |
| petlibro-glacier-ultrafiltration | COST_ONLY | ja | ja | nein | verified | Kein exakt konsistentes Affiliate-Angebot |
| petlibro-stainless-steel-fountain | INFO_ONLY | nein | nein | nein | partial | Keine belastbare Jahreskostenangabe |
| xiaomi-smart-pet-fountain-2 | COST_ONLY | ja | ja | nein | verified | Kein exakt konsistentes Affiliate-Angebot |
| cat-mate-335-pet-fountain | FULL | ja | ja | ja | verified | Exakt verifiziertes Amazon-Direktangebot |
| feelneedy-fn-w18-8l-katzenbrunnen | INFO_ONLY | nein | nein | nein | partial | Keine belastbare Jahreskostenangabe |
| oneisall-3-2l-cordless-fountain | INFO_ONLY | nein | nein | nein | partial | Keine belastbare Jahreskostenangabe |
| petkit-eversweet-3-pro-uvc | FULL | ja | ja | ja | verified | Exakt verifiziertes Amazon-Direktangebot |
| petlibro-dockstream-2-smart | COST_ONLY | ja | ja | nein | verified | COST_INPUT_OFFER_MISMATCH |
| petlibro-dockstream-2-smart-cordless | COST_ONLY | ja | ja | nein | verified | COST_INPUT_OFFER_MISMATCH |
| catit-pixi-smart-trinkbrunnen | FULL | ja | ja | ja | verified | Exakt verifiziertes Amazon-Direktangebot |
| oneisall-2-2l-cordless-fountain | INFO_ONLY | nein | nein | nein | partial | Keine belastbare Jahreskostenangabe |
| oneisall-3-5l-cordless-fountain | INFO_ONLY | nein | nein | nein | partial | Keine belastbare Jahreskostenangabe |
| petkit-eversweet-5-mini | INFO_ONLY | nein | nein | nein | partial | Keine belastbare Jahreskostenangabe |
| petkit-eversweet-max-2-uvc | COST_ONLY | ja | ja | nein | verified | Kein exakt konsistentes Affiliate-Angebot |
| petkit-eversweet-solo-2-fountain | FULL | ja | ja | ja | verified | Exakt verifiziertes Amazon-Direktangebot |
| petkit-eversweet-solo-se | FULL | ja | ja | ja | verified | Exakt verifiziertes Amazon-Direktangebot |
| petlibro-capsule-dog-fountain | INFO_ONLY | nein | nein | nein | partial | Keine belastbare Jahreskostenangabe |
| petlibro-dockstream-cordless | COST_ONLY | ja | ja | nein | verified | COST_INPUT_OFFER_MISMATCH |
| petsafe-streamside-trinkbrunnen | COST_ONLY | ja | ja | nein | verified | Kein exakt konsistentes Affiliate-Angebot |

Die drei PETLIBRO-Konflikte bleiben bewusst `COST_ONLY`: 4er-Kosteninput und 8er-Amazon-Angebot werden weder zusammengeführt noch für einen CTA optimiert.
