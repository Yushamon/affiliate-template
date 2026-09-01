# Product Data Baseline

| Kennzahl | Ergebnis |
|---|---:|
| Produkte | 101 |
| externe Evidenz vollständig | 72 |
| externe Evidenz teilweise | 28 |
| externe Evidenz fehlend | 1 |
| Product-standard-2 kritisch | 0 |
| Product-standard-2 Verbesserung | 16 |
| Product-standard-2 Warnung | 85 |

Der konkrete fehlende Evidence-Fall ist `furbo-360-katzenkamera` (keine Professional Reviews, User Reviews oder Consensus). Die 28 teilweisen Fälle sind Datenanreicherung, kein Rendering- oder SEO-Blocker.

Die 33.3-Migrationsnotiz nennt 94 volle und 7 partielle Darstellungslanes. Sie persistiert jedoch keine Slug-Liste und ihr damaliges Kriterium ist nicht im aktuellen Datenmodell kodiert. Eine genaue Siebener-Liste wäre daher erfunden. Der reproduzierbare aktuelle Befund ist: alle 101 Routen rendern über `ProductRenderer → ProductExperience2`; optionale Lücken erhalten generische, klar als solche behandelte Fallbacks. P3: künftig einen expliziten, slug-basierten `experienceFallbackReasons`-Export erzeugen, statt eine nicht reproduzierbare Aggregatszahl fortzuschreiben.

Die Produktstandard-Warnungen betreffen überwiegend optionale Medienrollen; sie dürfen nach 33.3 nicht wieder als Releaseblocker missverstanden werden. Priorität haben externe Evidenz und fehlende Kernmedien auf wirtschaftlich/traffic-relevanten Produkten.
