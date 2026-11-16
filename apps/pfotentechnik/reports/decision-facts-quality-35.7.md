# Redaktionelle Entscheidungshinweise 35.7

Die Schema-Übernahme und die Veröffentlichung sind getrennt. Die Freigabeliste enthält 0 passende Freigaben; 437 Hinweise bleiben ungeprüft und gesperrt. Eine regelbasierte Vorprüfung ist keine redaktionelle Freigabe.

## Umfang und Ergebnis

- Produktdateien mit Hinweisen: 73
- Hinweise insgesamt: 437
- Produkte mit exakt erhaltenen Daten im gebauten Content-Speicher: 73
- Hinweise mit Prüfbefund: 268
- Hinweise ohne regelbasierten Befund: 169
- Verwaiste Freigaben: 0

- completeness: 0 Hinweise mit Befund
- duplicateConsequences: 134 Hinweise mit Befund
- technicalConsistency: 52 Hinweise mit Befund
- unknownProperties: 0 Hinweise mit Befund
- decisionUsefulness: 209 Hinweise mit Befund

Mehrere Prüfungen können denselben Hinweis markieren; die Kategorien sind nicht zu summieren.

- CONSEQUENCE_CONTRADICTS_VALUE: 1 Hinweise
- DUPLICATE_CONSEQUENCE: 134 Hinweise
- GENERIC_CONSEQUENCE: 209 Hinweise
- VALUE_REQUIRES_COMPARISON: 12 Hinweise
- WRONG_DECISION_CONTEXT: 39 Hinweise

## Verfahren und Grenzen

Geprüft wird der Produktionsspeicher .astro-cache/data-store.json gemäß astro.config.mjs. Der separate Entwicklungsdatenspeicher unter .astro ist dafür nicht maßgeblich. Die Schema-Revision in src/content.config.ts sorgt dafür, dass Astro alte, bereits geparste Produkte beim normalen Build neu einliest.

Der Report prüft leere/unvollständige Felder, normalisierte identische Konsequenzen innerhalb eines Produkts, Vorhandenseins- und Mengenabweichungen sowie abweichende Originalwerte zu gleich benannten technischen Merkmalen, positive Funktionsbehauptungen bei unbekannten Angaben und pauschale Vorlagentexte ohne konkrete Einordnung. Themenfremde Hinweise (z. B. Futterportionen bei Wasser) werden zusätzlich markiert.

Ein abweichender Wortlaut oder Zahlenwert ist ein Prüfauftrag, kein automatisch bewiesener Sachfehler. Nicht vergleichbare Angaben sind ausdrücklich nicht verifizierbar. Die Regeln verstehen nicht jede freie Formulierung und prüfen nicht sämtliche Aussagen des Fließtexts. Fehlende Befunde bedeuten daher weder sachliche Bestätigung noch Freigabe. Als Evidenz dienen ausschließlich vorhandene specs und passende boolesche comparisonFilters; weitere bestehende Felder und Fließtext können in der anschließenden redaktionellen Prüfung berücksichtigt werden.

Originaltexte stehen unten als JSON-Strings, damit Zeilenumbrüche und Sonderzeichen unverändert rekonstruierbar bleiben. Fingerabdrücke binden eine spätere Freigabe an das genaue Tripel aus Label, Wert und Konsequenz sowie an den Produkt-Slug. Die Produktdateien werden durch diesen Report nicht umgeschrieben. Bei Teilfreigaben erhalten freigegebene Hinweise Vorrang; übrige Plätze werden mit der automatischen Ableitung aus 35.6 gefüllt.

Reproduktion nach dem Build: npm --workspace apps/pfotentechnik run audit:decision-facts. Gegenprüfung ohne Neuschreiben: npm --workspace apps/pfotentechnik run audit:decision-facts:check. --source-only überspringt die Prüfung des gebauten Speichers ausdrücklich. Die Ausgabe enthält keine flüchtigen Zeitstempel.

## Vollständige Einzelbefunde

### aqara-smart-pet-feeder-c1

Datei: src/content/products/aqara-smart-pet-feeder-c1.md

SHA-256: db9b846e356a20eb65a258e01e7b91eac4d37be7aeb5b64007762c865b2a2e71

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 394a1e352a61516cc31b797313afb1987481d819b7edaf4368f2e2c7c3124994
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "4 Liter / etwa 1,7 kg"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 4 Liter / etwa 1,7 kg“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"4 Liter / etwa 1,7 kg"}]

#### Hinweis 2

- Fingerabdruck: 5de619371ea04ff731b7ea48dfe53e5297e11a6ec48f77c2b988ace5da63a998
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Krokettengröße"
- Original Wert: "2 bis 12 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Die Krokettengröße „2 bis 12 mm“ wird mit Stellplatz oder Körpergröße begründet; das sind andere Größen als die zulässigen Futterabmessungen.
  - Vorhandene Evidenz category: {"key":"futterautomaten","label":"Futterautomaten","path":"/smarte-futterautomaten/"}
  - Vorhandene Evidenz decisionFacts.1.label: "Krokettengröße"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Krokettengröße: 2 bis 12 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"2 bis 12 mm"}]

#### Hinweis 3

- Fingerabdruck: 363f2784f6ffde9af6c9bde9d0b869071a0e91763a9809bcd69a29f6ffbe3ba7
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "Etwa 6 bis 10 g je Ausgabeeinheit, futterabhängig"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"Etwa 6 bis 10 g je Ausgabeeinheit, futterabhängig"}]

#### Hinweis 4

- Fingerabdruck: c622ba14de913431bd10e7e5825bb0f481c3d0505056b1b4ab0cc301f6b38e81
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "USB-A, 5 V/1 A; optional 3 LR20/D-Batterien als Backup"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: USB-A, 5 V/1 A; optional 3 LR20/D-Batterien als Backup“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"USB-A, 5 V/1 A; optional 3 LR20/D-Batterien als Backup"}]

#### Hinweis 5

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"Nein"}]

#### Hinweis 6

- Fingerabdruck: 34fc96e20b6e243956e06feef3494ecf22be3221ecd1a4dc8ec0f6b03de96e38
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.14.value","value":"Nicht vom Hersteller ausgewiesen"}]

### cat-mate-335-pet-fountain

Datei: src/content/products/cat-mate-335-pet-fountain.md

SHA-256: 5d0776fcb572c953939a1d32ba3f4ddd7f8e2a79fdaa437b1f7b737f35fc83ad

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: f9066500c94a116181fed82b5bd7957102030c122d3daaafa7fab0f2f2bfebb9
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "70 fl. oz., rund 2 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „70 fl. oz., rund 2 Liter“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 70 fl. oz., rund 2 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"70 fl. oz., rund 2 Liter"}]

#### Hinweis 2

- Fingerabdruck: 015fb87e6e3e541d3ed9afaeaa952c829af81db35439097d6388eaf745c1b8f3
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Material"
- Original Wert: "BPA- und BHT-freier Kunststoff; Schale und Basis aus Polypropylen"
- Original Konsequenz: "Kunststoff ist leicht, sollte wegen Kratzern und möglicher Geruchsaufnahme regelmäßig kontrolliert werden."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"BPA- und BHT-freier Kunststoff; Schale und Basis aus Polypropylen"}]

#### Hinweis 3

- Fingerabdruck: 5380fcdf6b57ca25ce5ea1da47cb68d5d9a18b9f76418cf4366b10b49f923653
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzbetrieb mit Niedervolt-Netzteil und 3 m Kabel"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzbetrieb mit Niedervolt-Netzteil und 3 m Kabel“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Netzbetrieb mit Niedervolt-Netzteil und 3 m Kabel"}]

#### Hinweis 4

- Fingerabdruck: e0eeb355f90d6eabe258719529bfcd4bc2fcd0b736b879ecc2a00e852a196063
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akku"
- Original Wert: "Nein"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akku: Nein“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"Nein"}]

#### Hinweis 5

- Fingerabdruck: 66162d289cc8f9545473c116026246372aa43a154fe80ba2f8bd66232a7ebfa1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"Nein"}]

#### Hinweis 6

- Fingerabdruck: b15fde3630acc2e220b03e6e1bad51e783c3a22e824e0c5723ec277248f6e2e3
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Filter im Lieferumfang"
- Original Wert: "Polymer-Aktivkohlefilter"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"Polymer-Aktivkohlefilter"}]

### cat-mate-c200

Datei: src/content/products/cat-mate-c200.md

SHA-256: b1992aab7dad73c0d734413a4eae518ba63f1c96d01b15f1c2bb4d465ae5237f

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 436a79dc6c6e88b3aa30c0ac77e7c20f968ec51b849a919a88a08ab440dafe07
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "zwei Fächer mit je bis zu 400 g"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: zwei Fächer mit je bis zu 400 g“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"zwei Fächer mit je bis zu 400 g"}]

#### Hinweis 2

- Fingerabdruck: 66162d289cc8f9545473c116026246372aa43a154fe80ba2f8bd66232a7ebfa1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"Nein"}]

#### Hinweis 3

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Nein"}]

#### Hinweis 4

- Fingerabdruck: 5b400d6484b2eff72151122fb4de034d315093ee05a190d0f37526963676076c
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "eine AA-Batterie"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: eine AA-Batterie“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"eine AA-Batterie"}]

#### Hinweis 5

- Fingerabdruck: 9c60dda313b63979d4b54f04a921281b7a17ee1a72d19465953e3b297dd5f246
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Batterielaufzeit"
- Original Wert: "Herstellerangabe bis zwölf Monate"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Batterielaufzeit: Herstellerangabe bis zwölf Monate“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"Herstellerangabe bis zwölf Monate"}]

#### Hinweis 6

- Fingerabdruck: 34fc96e20b6e243956e06feef3494ecf22be3221ecd1a4dc8ec0f6b03de96e38
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.14.value","value":"Nicht vom Hersteller ausgewiesen"}]

### cat-mate-c300

Datei: src/content/products/cat-mate-c300.md

SHA-256: 349b6c05ef8f45d13e81f988d7fa75c80b1871e5514f03fee4b73901a665e133

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 14669a95549ed842cae598feae06c36d161c6b4672220de7c63f0c14955eb67e
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "drei Fächer; aktuelle Produktseite nennt 170 g je Fach, Supportseite 330 g"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: drei Fächer; aktuelle Produktseite nennt 170 g je Fach, Supportseite 330 g“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"drei Fächer; aktuelle Produktseite nennt 170 g je Fach, Supportseite 330 g"}]

#### Hinweis 2

- Fingerabdruck: 66162d289cc8f9545473c116026246372aa43a154fe80ba2f8bd66232a7ebfa1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"Nein"}]

#### Hinweis 3

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Nein"}]

#### Hinweis 4

- Fingerabdruck: 98ff6d4e6cb606798a5f06709e7d81255cfe978a5f504ab94aa96ed6dfd0e7b0
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "drei AA-Batterien"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: drei AA-Batterien“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"drei AA-Batterien"}]

#### Hinweis 5

- Fingerabdruck: f54f9da5b8318c75e292044d0e550c81d708b4d4aeb86d0c8cd488a93b0e7e65
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Batterielaufzeit"
- Original Wert: "Herstellerangabe etwa zwölf Monate"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Batterielaufzeit: Herstellerangabe etwa zwölf Monate“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"Herstellerangabe etwa zwölf Monate"}]

#### Hinweis 6

- Fingerabdruck: 34fc96e20b6e243956e06feef3494ecf22be3221ecd1a4dc8ec0f6b03de96e38
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.15.value","value":"Nicht vom Hersteller ausgewiesen"}]

### cat-mate-c500

Datei: src/content/products/cat-mate-c500.md

SHA-256: 53f452767cedd710f315457dc16d596aba8f77968ea6da966addaabde7243352

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 179998b03c2ca52e21c807863bdc15a2a88680791d610325efb1f84a18b8d139
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "fünf Fächer mit je 155 g"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: fünf Fächer mit je 155 g“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"fünf Fächer mit je 155 g"}]

#### Hinweis 2

- Fingerabdruck: 66162d289cc8f9545473c116026246372aa43a154fe80ba2f8bd66232a7ebfa1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"Nein"}]

#### Hinweis 3

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"Nein"}]

#### Hinweis 4

- Fingerabdruck: 98ff6d4e6cb606798a5f06709e7d81255cfe978a5f504ab94aa96ed6dfd0e7b0
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "drei AA-Batterien"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: drei AA-Batterien“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"drei AA-Batterien"}]

#### Hinweis 5

- Fingerabdruck: 2d0db9a535834cfa285b98179754ed7ecac206eea2b885c7474d47d2c8d339e5
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Batterielaufzeit"
- Original Wert: "Herstellerangabe bis etwa zwölf Monate"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Batterielaufzeit: Herstellerangabe bis etwa zwölf Monate“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Herstellerangabe bis etwa zwölf Monate"}]

#### Hinweis 6

- Fingerabdruck: 34fc96e20b6e243956e06feef3494ecf22be3221ecd1a4dc8ec0f6b03de96e38
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.13.value","value":"Nicht vom Hersteller ausgewiesen"}]

### cat-mate-shell-fountain

Datei: src/content/products/cat-mate-shell-fountain.md

SHA-256: 41de3db4372481e9ec3b4a6573158beca2ad0bcd08de689de1db7bc23c859d1a

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 0c4b956f94f22f3f7b5c77598c4e08b29ac38c0d8d95e5d1ff3b0d31f8568489
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "3 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „3 Liter“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 3 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"3 Liter"}]

#### Hinweis 2

- Fingerabdruck: 300800e404c519d6c7f95c5ff387faa9047535708e138f40c9695bf311c3ee56
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Niedervolt-Netzbetrieb mit etwa 3 m Kabel"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Niedervolt-Netzbetrieb mit etwa 3 m Kabel“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"Niedervolt-Netzbetrieb mit etwa 3 m Kabel"}]

#### Hinweis 3

- Fingerabdruck: 66162d289cc8f9545473c116026246372aa43a154fe80ba2f8bd66232a7ebfa1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Nein"}]

#### Hinweis 4

- Fingerabdruck: db9f9d347ba045cada5ac843abc7dfdafec5b023de10be5c9536bd53a30e66cb
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Filter"
- Original Wert: "Polymer-Aktivkohle oder dreistufig mit Ionenaustauschharz"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Polymer-Aktivkohle oder dreistufig mit Ionenaustauschharz"}]

#### Hinweis 5

- Fingerabdruck: ed4a97d2efba56f2c39ae6f047ca07aaba1354cd85ad47f51c927159dc3299fa
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Filterwechsel"
- Original Wert: "Herstellerempfehlung monatlich"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"Herstellerempfehlung monatlich"}]

#### Hinweis 6

- Fingerabdruck: 951a5ab9195f41029c3dba29f47647ac684c568aa6210200ef47918cdd01f402
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Lautstärke"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Geräusche können bei schreckhaften Tieren und in Schlafräumen kaufentscheidend sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.12.value","value":"Nicht vom Hersteller ausgewiesen"}]

### catit-pixi-smart-6-meal-feeder

Datei: src/content/products/catit-pixi-smart-6-meal-feeder.md

SHA-256: 45e7a831c11af733a4d726c82d73a14f698ae6e5e04a04b4d09011dc777e0e44

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 46c6a366a9c5c16996bff9fb2f28e2b130f53907e7006d7a0cdeae3aa0e7ffc1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "6 Fächer mit je 170 ml"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 6 Fächer mit je 170 ml“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"6 Fächer mit je 170 ml"}]

#### Hinweis 2

- Fingerabdruck: f9a661a1bcdf5329f533acff658b7f3d6663138e7246b9d88b10cac18319b6e2
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "Catit PIXI App, kostenlos und ohne Abonnement"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Catit PIXI App, kostenlos und ohne Abonnement"}]

#### Hinweis 3

- Fingerabdruck: 8489a2be64210c5b0ef33a674d4c97be5a9edf1e8a01cdaae4614e5c0306b3e9
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "USB-C-Netzbetrieb, DC 5 V/1 A mit Adapter"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: USB-C-Netzbetrieb, DC 5 V/1 A mit Adapter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.12.value","value":"USB-C-Netzbetrieb, DC 5 V/1 A mit Adapter"}]

#### Hinweis 4

- Fingerabdruck: 6377a01fb4cf926652cbd91831e273a7a29253bc55457a924d53034a3281a348
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Batterie-Backup"
- Original Wert: "4 C/LR14-Batterien, nicht enthalten; Herstellerangabe durchschnittlich etwa 4 Tage"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Batterie-Backup: 4 C/LR14-Batterien, nicht enthalten; Herstellerangabe durchschnittlich etwa 4 Tage“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.13.value","value":"4 C/LR14-Batterien, nicht enthalten; Herstellerangabe durchschnittlich etwa 4 Tage"}]

#### Hinweis 5

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.16.value","value":"Nein"}]

#### Hinweis 6

- Fingerabdruck: 98011ca8437b73c64c34ac23f9881fb3bdb066e192277d3fb042648e2fabdc82
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "1,204 kg leer; 1,708 kg mit Kühlakkus"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: 1,204 kg leer; 1,708 kg mit Kühlakkus“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.19.value","value":"1,204 kg leer; 1,708 kg mit Kühlakkus"}]

### catit-pixi-vision-smart-feeder

Datei: src/content/products/catit-pixi-vision-smart-feeder.md

SHA-256: 3472e1052e92e68f2fa50caee05f4275d96a6bfcc87fc3c5a9c2b1b28e19d77a

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 1f18f846d35c74acdf98daa2c9bdbf9d42dd528d29beaf6150fb9fe845ca6d43
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "2,9 Liter / etwa 1,2 kg"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 2,9 Liter / etwa 1,2 kg“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"2,9 Liter / etwa 1,2 kg"}]

#### Hinweis 2

- Fingerabdruck: a5564001dea6b8861c322ff2310fc44b27f691d7ebc54453b9631e959a32dd4c
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Krokettengröße"
- Original Wert: "Bis 9 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Die Krokettengröße „Bis 9 mm“ wird mit Stellplatz oder Körpergröße begründet; das sind andere Größen als die zulässigen Futterabmessungen.
  - Vorhandene Evidenz category: {"key":"futterautomaten","label":"Futterautomaten","path":"/smarte-futterautomaten/"}
  - Vorhandene Evidenz decisionFacts.1.label: "Krokettengröße"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Krokettengröße: Bis 9 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"Bis 9 mm"}]

#### Hinweis 3

- Fingerabdruck: b63a5a05e08c329af6982753b783f6f8ec0f3e9b62228214d5752498ab0f9b1d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "USB-Netzteil, Eingang 5 V/2 A und 10 W; Backup mit 4 C/LR14-Batterien"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: USB-Netzteil, Eingang 5 V/2 A und 10 W; Backup mit 4 C/LR14-Batterien“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"USB-Netzteil, Eingang 5 V/2 A und 10 W; Backup mit 4 C/LR14-Batterien"}]

#### Hinweis 4

- Fingerabdruck: fa871728ebdc5a58f5e9b3c788260b757c9a3f9e3c003b01de63a890f215256c
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "Individuell einstellbare Mahlzeitengrößen, bis zu 12 Mahlzeiten pro Tag"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"Individuell einstellbare Mahlzeitengrößen, bis zu 12 Mahlzeiten pro Tag"}]

#### Hinweis 5

- Fingerabdruck: 27ca966c4714c56221dc217c3978d582d5e39844e1e672a8438b9a85ae251589
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "1,782 kg"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: 1,782 kg“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"1,782 kg"}]

### devoko-90l-automatisches-katzenklo

Datei: src/content/products/devoko-90l-automatisches-katzenklo.md

SHA-256: d249929473cb7575bb8c6703751c78827864fe35ffded91a530653125a9a0cc9

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 9cc421eb6a70abbeaf070feea884327bfa6e2e4ca9ab3d9a5f37eecaa6f2fa8a
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "90 Liter"
- Original Wert: "Innenraum"
- Original Konsequenz: "Die große Zahl beschreibt den Katzenbereich. Der tatsächlich zu leerende Abfallbehälter ist mit 8,5 Litern deutlich kleiner."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 2

- Fingerabdruck: 71eb07d5545bbc6f3bcf8aa3965b642596059d7f5f683857667ceb899f209e1d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Abfallbehälter"
- Original Wert: "8,5 l"
- Original Konsequenz: "Für eine einzelne Katze werden bis zu zehn Tage genannt. In Mehrkatzenhaushalten ist ein kürzeres Intervall realistischer."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- VALUE_REQUIRES_COMPARISON: Abweichender Originalwortlaut: redaktionell „8,5 l“, technisch „8,5 Liter“. Dies allein belegt keinen sachlichen Widerspruch.
  - Vorhandene Evidenz specs.6.value: "8,5 Liter"

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"8,5 Liter"}]

#### Hinweis 3

- Fingerabdruck: 2f3ba54151304f8d88a41914c4d1c4d13b8b9a2f9473712be78174fe31aa0b79
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Einstieg"
- Original Wert: "ca. 23 cm"
- Original Konsequenz: "Niedriger als bei einigen Open-Top-Konkurrenten und damit potenziell leichter zugänglich. Beweglichkeit der individuellen Katze bleibt entscheidend."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 4

- Fingerabdruck: 6a9a06e13860855ab46e6eeb1bb55e8fe85890aa54f9119af21291446dcaa4c3
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Gewichtsbereich"
- Original Wert: "ca. 1,5–10 kg"
- Original Konsequenz: "Passt zu vielen Hauskatzen, schließt aber sehr leichte Kitten und besonders schwere Großkatzen laut dokumentiertem Bereich aus."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 5

- Fingerabdruck: 2773309c4d955befaaeaa6ed9f196c02bcf4380047b1ef3c7cdec1f700f252c1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "App"
- Original Wert: "2,4-GHz-WLAN"
- Original Konsequenz: "Gewicht, Nutzungsfrequenz, Fernreinigung und Einstellungen sind verfügbar. Reine 5-GHz-Netze reichen für die Einrichtung nicht."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- VALUE_REQUIRES_COMPARISON: Abweichender Originalwortlaut: redaktionell „2,4-GHz-WLAN“, technisch „Ja“. Dies allein belegt keinen sachlichen Widerspruch.
  - Vorhandene Evidenz specs.15.value: "Ja"

Technische Vergleichsdaten: [{"path":"specs.15.value","value":"Ja"}]

#### Hinweis 6

- Fingerabdruck: 1b54ac23d08c76b765377c216c7dc55984f0b6c444f22e258f2121060bad3649
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Sicherheit"
- Original Wert: "IR + Gewicht + Radar"
- Original Konsequenz: "Die Sensorarten sind mehrfach dokumentiert. Die genaue Zahl der Sensoren ist öffentlich widersprüchlich und sollte nicht als gesicherte Kennzahl beworben werden."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- VALUE_REQUIRES_COMPARISON: Abweichender Originalwortlaut: redaktionell „IR + Gewicht + Radar“, technisch „Infrarot-, Gewichts- und Radarerkennung dokumentiert; Quellen widersprechen sich bei der Zahl der Sensoren“. Dies allein belegt keinen sachlichen Widerspruch.
  - Vorhandene Evidenz specs.22.value: "Infrarot-, Gewichts- und Radarerkennung dokumentiert; Quellen widersprechen sich bei der Zahl der Sensoren"

Technische Vergleichsdaten: [{"path":"specs.22.value","value":"Infrarot-, Gewichts- und Radarerkennung dokumentiert; Quellen widersprechen sich bei der Zahl der Sensoren"}]

#### Hinweis 7

- Fingerabdruck: 4d6c5941667b32bf1660aa22250f33df2bb23760708442ab80403b517b02790f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Geruchskontrolle"
- Original Wert: "Integriertes System"
- Original Konsequenz: "Zusätzlich zum geschlossenen Abfallbehälter ist ein Geruchsneutralisator vorgesehen. Verbrauchsmaterial und regelmäßige Behälterreinigung bleiben nötig."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- VALUE_REQUIRES_COMPARISON: Abweichender Originalwortlaut: redaktionell „Integriertes System“, technisch „Integriertes Anti-Geruch-System; über App steuerbar“. Dies allein belegt keinen sachlichen Widerspruch.
  - Vorhandene Evidenz specs.21.value: "Integriertes Anti-Geruch-System; über App steuerbar"

Technische Vergleichsdaten: [{"path":"specs.21.value","value":"Integriertes Anti-Geruch-System; über App steuerbar"}]

#### Hinweis 8

- Fingerabdruck: 3850b7787079658efbb43f1b500f04e64f60d1a9a22cca7d9b407ecf8e119f26
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Dokumentation"
- Original Wert: "Uneinheitlich"
- Original Konsequenz: "Beim konkreten Kaufangebot sollten Modellnummer, Lieferumfang, Garantie und Maße vor Bestellung noch einmal geprüft werden."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

### garmin-alpha-t-20

Datei: src/content/products/garmin-alpha-t-20.md

SHA-256: f078b29441a5442f22f75373e7da8e7a445e7cbf0565d03509ad56b3019bb673

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 288cff0dc4a81675f9750cc94dabd4c9827eda59c0f07c2757cfd5c47de08c2c
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Abo"
- Original Wert: "für die VHF-Hundeortung nicht erforderlich"
- Original Konsequenz: "Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"für die VHF-Hundeortung nicht erforderlich"}]

#### Hinweis 2

- Fingerabdruck: 3b0efe2608d90aefbe33bd72c8488a550103081563e5dd603bb1720972feb654
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Smartphone-App"
- Original Wert: "kein eigenständiger Smartphone-Tracker; optionale App-Funktionen hängen vom verwendeten Handgerät ab"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"kein eigenständiger Smartphone-Tracker; optionale App-Funktionen hängen vom verwendeten Handgerät ab"}]

#### Hinweis 3

- Fingerabdruck: 87d30cdbadf4f636b291539a07b1018a2014e856e888f789dd289ba382f4a7d6
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkutyp"
- Original Wert: "wiederaufladbarer, austauschbarer Lithium-Ionen-Akku"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4, 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkutyp: wiederaufladbarer, austauschbarer Lithium-Ionen-Akku“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.12.value","value":"wiederaufladbarer, austauschbarer Lithium-Ionen-Akku"}]

#### Hinweis 4

- Fingerabdruck: 5abd8931b6834e801004c7630da31ec8ae20132d1a5a720f86f0d9475dedea03
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkulaufzeit"
- Original Wert: "bis zu 68 Stunden mit Standardakku"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3, 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkulaufzeit: bis zu 68 Stunden mit Standardakku“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.13.value","value":"bis zu 68 Stunden mit Standardakku"}]

#### Hinweis 5

- Fingerabdruck: f9576e7745f96454318b68dffc8bdb53d2256793680216774ca61d2e4756e04f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Optionale Akkulaufzeit"
- Original Wert: "bis zu 136 Stunden mit erweitertem Akkuteil"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3, 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Optionale Akkulaufzeit: bis zu 136 Stunden mit erweitertem Akkuteil“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.14.value","value":"bis zu 136 Stunden mit erweitertem Akkuteil"}]

#### Hinweis 6

- Fingerabdruck: 69cf18902a9f72ac3c7095b01f7c801284f7dba307f760b0f23e3d9353b92082
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Wasserschutz"
- Original Wert: "1 ATM; widersteht laut Garmin einem Druck entsprechend 10 m Wassertiefe"
- Original Konsequenz: "Die Schutzklasse ist bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Wasserschutz: 1 ATM; widersteht laut Garmin einem Druck entsprechend 10 m Wassertiefe“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.17.value","value":"1 ATM; widersteht laut Garmin einem Druck entsprechend 10 m Wassertiefe"}]

### garmin-alpha-tt-25

Datei: src/content/products/garmin-alpha-tt-25.md

SHA-256: ecd78472a2c6199e70b0ac8b749cacc6cecc487e3114b828ce31e606269efe2c

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: c5e049a02dd019c09748873731d225635cc8255c6b432e645f84fec6298703b7
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Abo"
- Original Wert: "Für die VHF-Hundeortung nicht erforderlich"
- Original Konsequenz: "Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"Für die VHF-Hundeortung nicht erforderlich"}]

#### Hinweis 2

- Fingerabdruck: a7f19bb747d60cbebcfabb8ec323a9bdee74112a4cbe7416ef343d4f6b884d56
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkulaufzeit"
- Original Wert: "Bis zu 68 Stunden; optional bis zu 136 Stunden"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkulaufzeit: Bis zu 68 Stunden; optional bis zu 136 Stunden“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Bis zu 68 Stunden; optional bis zu 136 Stunden"}]

#### Hinweis 3

- Fingerabdruck: 41b99cb33a881dbab810ca7c98fd7fc7fad029ab6ee81d274e6dfd4709c67d77
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Austauschbarer Lithium-Ionen-Akku"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 2 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.1.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Austauschbarer Lithium-Ionen-Akku“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"Austauschbarer Lithium-Ionen-Akku"}]

#### Hinweis 4

- Fingerabdruck: c9924c370668ead43fca7f14c5a6e32949ea5883434e9106a15a4ecc48141c63
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Wasserschutz"
- Original Wert: "1 ATM"
- Original Konsequenz: "Die Schutzklasse ist bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Wasserschutz: 1 ATM“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"1 ATM"}]

#### Hinweis 5

- Fingerabdruck: 6d243c1848e02a14761d4cada25a701765954a34e8d03d1b7ba82ac0a80853d9
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Abmessungen"
- Original Wert: "Nicht im offiziellen Handbuch ausgewiesen"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Abmessungen: Nicht im offiziellen Handbuch ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"Nicht im offiziellen Handbuch ausgewiesen"}]

#### Hinweis 6

- Fingerabdruck: 96303e52a3b17265c9ca1e25d3072455965b3427d8ad2d65915aaafb0b44d922
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "Nicht im offiziellen Handbuch ausgewiesen"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: Nicht im offiziellen Handbuch ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"Nicht im offiziellen Handbuch ausgewiesen"}]

### honeyguardian-a305d

Datei: src/content/products/honeyguardian-a305d.md

SHA-256: 0ebbf5bed913a735a276157c29c06fdafa3995ca518f4290b02dcff8009ebd45

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 825d257751b0858ec45f7310ee2c19d99ab105f50504c0c9bd8e89d675ef980a
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "App-Steuerung"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"Nein"}]

#### Hinweis 2

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"Nein"}]

#### Hinweis 3

- Fingerabdruck: 91c01f8f591399fdac941702e6fc2ff663974f4594fe5876c732a2c616bb53c4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "5 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 5 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"5 Liter"}]

#### Hinweis 4

- Fingerabdruck: acc63660016725b86e28688c155f5ca16c2035b742a4684848336fef88908a71
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "1 bis 24 Portionen pro Mahlzeit"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"1 bis 24 Portionen pro Mahlzeit"}]

#### Hinweis 5

- Fingerabdruck: 8b6e3f5c1d71c8567a8a5f26fd7a1fbfb37cc7698ae0db3e80313d56a68d27b4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "USB-Netzteil oder 3 D-Batterien"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: USB-Netzteil oder 3 D-Batterien“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"USB-Netzteil oder 3 D-Batterien"}]

#### Hinweis 6

- Fingerabdruck: 0dbe3dd9d9a460181f6088bf2c13b3e8a8002217786c502d96d822b1d59bb2ac
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "WLAN"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 1 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.0.consequence: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"Nein"}]

### honeyguardian-a68

Datei: src/content/products/honeyguardian-a68.md

SHA-256: 96e0faefc9ceb23af4a85575624e1d1c0caca658ee1ed87b9f04695d776ad198

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: ceabd4135da3493c315948ed4d69c382151b078d4dd161048d9f680f75cb7fd7
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App-Steuerung"
- Original Wert: "Ja"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"Ja"}]

#### Hinweis 2

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"Nein"}]

#### Hinweis 3

- Fingerabdruck: dad0e69e7cc567fcfdac4fd919cb94f44ae5e9adaa85d879533c0d02ea026cd1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "6 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 6 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"6 Liter"}]

#### Hinweis 4

- Fingerabdruck: a48d1ad2352c034463f02a35d140970c81e5975447bf491e7d201db95614061f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzteil mit Batterie-Backup"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzteil mit Batterie-Backup“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Netzteil mit Batterie-Backup"}]

#### Hinweis 5

- Fingerabdruck: 3d69852c43602c14abd8103169f61d6e0f06e9aa385c6b507eee24f0a28c1feb
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Batterie"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Batterie: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"Nicht vom Hersteller ausgewiesen"}]

#### Hinweis 6

- Fingerabdruck: 34fc96e20b6e243956e06feef3494ecf22be3221ecd1a4dc8ec0f6b03de96e38
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.12.value","value":"Nicht vom Hersteller ausgewiesen"}]

### honeyguardian-smart-pet-feeder-s305d

Datei: src/content/products/honeyguardian-smart-pet-feeder-s305d.md

SHA-256: 7749201bd3331d8012552fa2a023fdddaabde6bfcab6539c9a5edfd7a8d9ceb1

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 91c01f8f591399fdac941702e6fc2ff663974f4594fe5876c732a2c616bb53c4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "5 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 5 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"5 Liter"}]

#### Hinweis 2

- Fingerabdruck: 216f26b824d6ee26822560287d59de1cedf4435e599e77169afea7c64be7db41
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "Ja, abhängig von der konkreten Version"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"Ja, abhängig von der konkreten Version"}]

#### Hinweis 3

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"Nein"}]

#### Hinweis 4

- Fingerabdruck: f6d47fbf3d13936c57e708ee0fbeffe841fe42e74e6d73da164c74dc67324ceb
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Napfmaterial"
- Original Wert: "Edelstahl"
- Original Konsequenz: "Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"Edelstahl"}]

#### Hinweis 5

- Fingerabdruck: adb8a596e5273c1fb6e35ab40c5caed552258f2fb074b25507af41856909399e
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzteil und Batteriereserve"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzteil und Batteriereserve“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Netzteil und Batteriereserve"}]

#### Hinweis 6

- Fingerabdruck: 8949c2e2607247eba716d9ee0bdd6ffcb219c8b1af95f3839d7d5a91c2432415
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "mehrere planbare Mahlzeiten; konkrete Portionsschritte unterscheiden sich je nach S305D-Version"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"mehrere planbare Mahlzeiten; konkrete Portionsschritte unterscheiden sich je nach S305D-Version"}]

### imipaw-3l-automatic-cat-feeder

Datei: src/content/products/imipaw-3l-automatic-cat-feeder.md

SHA-256: bfc1a90fc44341868a74b9876bb28b0b51fc82180a1e06519c63fbd53b75f6ab

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: f17158ef8b97c2b777fee068aaf4e08a6e548ceec788287b79f6ba2b23bc7514
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "3 Liter beziehungsweise etwa 12 Cups laut Hersteller"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 3 Liter beziehungsweise etwa 12 Cups laut Hersteller“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"3 Liter beziehungsweise etwa 12 Cups laut Hersteller"}]

#### Hinweis 2

- Fingerabdruck: b0e5842770c9eb00f07f54fbc2ed6f8e00069f9e19ce8addde8d488f6748bca3
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionen je Mahlzeit"
- Original Wert: "bis zu 20 Portionseinheiten"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"bis zu 20 Portionseinheiten"}]

#### Hinweis 3

- Fingerabdruck: 96e3b7231a4a76ae9a6287619dec33db90401c2f59c117f19a968cb707a9a0c8
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Portionsgröße"
- Original Wert: "laut Hersteller ungefähr 7 bis 9 g je Einheit; abhängig vom Futter"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Portionsgröße: laut Hersteller ungefähr 7 bis 9 g je Einheit; abhängig vom Futter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"laut Hersteller ungefähr 7 bis 9 g je Einheit; abhängig vom Futter"}]

#### Hinweis 4

- Fingerabdruck: 2d1373c805857badbdcebc70eba948c2bdd964f39f22500253b74ad513599271
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "App"
- Original Wert: "Nein, bei der hier bewerteten Basisversion"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"Nein, bei der hier bewerteten Basisversion"}]

#### Hinweis 5

- Fingerabdruck: 49fdc01b9c5a87f8c214ca8c499547753a97f9143ba337f13a55d5e95288c83a
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "WLAN"
- Original Wert: "Nein, bei der hier bewerteten Basisversion"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"Nein, bei der hier bewerteten Basisversion"}]

#### Hinweis 6

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"Nein"}]

### neakasa-m1-lite

Datei: src/content/products/neakasa-m1-lite.md

SHA-256: e95a2385905d9e77b3199a4c475d015b43e527e1ecdd983dc56a0665ed1367e0

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 55dd943c18e961a93155865e75d89003033acb60fb040432692fbbce1ce11695
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Offener Einstieg"
- Original Wert: "Open Top"
- Original Konsequenz: "Mehr Sicht- und Fluchtweg als bei geschlossenen Trommelsystemen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 2

- Fingerabdruck: 97e72a16c9720427be7fb6a8c952d6583bc10812a40671154d58dea273fa1772
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Einstiegshöhe"
- Original Wert: "35,2 cm"
- Original Konsequenz: "Für Senioren oder bewegungseingeschränkte Katzen kann eine Stufe sinnvoll sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 3

- Fingerabdruck: 50791493f7b8abaef7447ca15db9d7c41880c456ba4765cea200e05c41177e24
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Katzengewicht"
- Original Wert: "1 bis 15 kg"
- Original Konsequenz: "Auch für viele große Katzen interessant; unter etwa 1 kg Automatik deaktivieren."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- VALUE_REQUIRES_COMPARISON: Abweichender Originalwortlaut: redaktionell „1 bis 15 kg“, technisch „1 bis 15 kg; unter 1 kg Kitten-Modus ohne Automatik“. Dies allein belegt keinen sachlichen Widerspruch.
  - Vorhandene Evidenz specs.1.value: "1 bis 15 kg; unter 1 kg Kitten-Modus ohne Automatik"

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"1 bis 15 kg; unter 1 kg Kitten-Modus ohne Automatik"}]

#### Hinweis 4

- Fingerabdruck: 5a007face563ebf04ffecfc2d0999ad14364229e381e2fb52d1cca9cdd4ec0a7
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Abfallvolumen"
- Original Wert: "11,23 l"
- Original Konsequenz: "Längere Entleerungsintervalle möglich; 14 Tage sind eine Hersteller-Maximalangabe."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 5

- Fingerabdruck: 2e7cb6b4d1ac74b093bb8d61f8521e9e6b8dcdb7819cbb419465833a14677538
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Streukapazität"
- Original Wert: "7,17 l"
- Original Konsequenz: "Klumpende, siebfähige Streu erforderlich."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- VALUE_REQUIRES_COMPARISON: Abweichender Originalwortlaut: redaktionell „7,17 l“, technisch „7,17 Liter“. Dies allein belegt keinen sachlichen Widerspruch.
  - Vorhandene Evidenz specs.4.value: "7,17 Liter"

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"7,17 Liter"}]

#### Hinweis 6

- Fingerabdruck: ce3c4a8d4894679a513fc6abddd22ce794798d3a6bcdd6ab0968eb6ad0ec99ba
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Lite-Lieferumfang"
- Original Wert: "15 Beutel, keine Streumatte"
- Original Konsequenz: "Der Preisvorteil wird teilweise durch weniger Zubehör erkauft."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

### oneisall-2-2l-cordless-fountain

Datei: src/content/products/oneisall-2-2l-cordless-fountain.md

SHA-256: 9d11af047daee243e2f9a0c2ac90ab7fd16912674ea56588e5c70e7ca50402fd

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 6e552ddc47e128d45b7acebaf617f991747f1b6a889a44486a1b347c9eb0a03b
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "2,2 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „2,2 Liter“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 2,2 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"2,2 Liter"}]

#### Hinweis 2

- Fingerabdruck: 932538ac01944428327269ebbbe887b3586e05cca6594775d1dad63ecaeee5b4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Akku, Laden über USB-C mit 5 V/1 A"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Akku, Laden über USB-C mit 5 V/1 A“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"Akku, Laden über USB-C mit 5 V/1 A"}]

#### Hinweis 3

- Fingerabdruck: cc2c85d2f8bd5cbe3e8d177bcd29efff4f6b010d84af5aeaafa0f7c621db182c
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkulaufzeit"
- Original Wert: "Herstellerangabe bis 30 Tage"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 2 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.1.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkulaufzeit: Herstellerangabe bis 30 Tage“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"Herstellerangabe bis 30 Tage"}]

#### Hinweis 4

- Fingerabdruck: 66162d289cc8f9545473c116026246372aa43a154fe80ba2f8bd66232a7ebfa1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Nein"}]

#### Hinweis 5

- Fingerabdruck: beca8e75eb0452ea3124b8155ab078b2c7f651ee3a6d165ee8c2b4d9ea2d8928
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Lautstärke"
- Original Wert: "Herstellerangabe unter 20 dB"
- Original Konsequenz: "Geräusche können bei schreckhaften Tieren und in Schlafräumen kaufentscheidend sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Herstellerangabe unter 20 dB"}]

#### Hinweis 6

- Fingerabdruck: 770b5bb7891657773d76541dcbd5bf759cd5e4f8501b59f7dc1714b4fe25ea50
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Filter"
- Original Wert: "fünfstufig"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"fünfstufig"}]

### oneisall-2-in-1-feeder-water

Datei: src/content/products/oneisall-2-in-1-feeder-water.md

SHA-256: 57216c70763bb8ce4e763ef1d92085a85267f47b2cd4af52d817a65a6656ada1

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 72f5a358d0db716259ee744e47a867dfeeed6764610c375c4f994577df84c366
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Futterkapazität"
- Original Wert: "5 Liter beziehungsweise 169 fl. oz."
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 2 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.1.consequence: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Futterkapazität: 5 Liter beziehungsweise 169 fl. oz.“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"5 Liter beziehungsweise 169 fl. oz."}]

#### Hinweis 2

- Fingerabdruck: d6ed3f923692c68bba804d5e6c405eaeadef5bd69ed0432454d715e7bcf5af96
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Wasserkapazität"
- Original Wert: "3,5 Liter beziehungsweise 118 fl. oz."
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 1 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.0.consequence: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Wasserkapazität: 3,5 Liter beziehungsweise 118 fl. oz.“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"3,5 Liter beziehungsweise 118 fl. oz."}]

#### Hinweis 3

- Fingerabdruck: 0f31bf197f7f605baea7dd23c8c707fb55ce550fbbc4f9664aeff6b62de4bf26
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Krokettengröße"
- Original Wert: "bis 13 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Die Krokettengröße „bis 13 mm“ wird mit Stellplatz oder Körpergröße begründet; das sind andere Größen als die zulässigen Futterabmessungen.
  - Vorhandene Evidenz category: {"key":"futterautomaten","label":"Futterautomaten","path":"/smarte-futterautomaten/"}
  - Vorhandene Evidenz decisionFacts.2.label: "Krokettengröße"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Krokettengröße: bis 13 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"bis 13 mm"}]

#### Hinweis 4

- Fingerabdruck: 9c34cbee80989b036c627056a08662cadae130c143a2c24e6fed9a854de6c1b6
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "einstellbare Portionseinheiten; tatsächliches Gewicht hängt vom Futter ab"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"einstellbare Portionseinheiten; tatsächliches Gewicht hängt vom Futter ab"}]

#### Hinweis 5

- Fingerabdruck: 66162d289cc8f9545473c116026246372aa43a154fe80ba2f8bd66232a7ebfa1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "App"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

Technische Vergleichsdaten: [{"path":"specs.12.value","value":"Nein"}]

#### Hinweis 6

- Fingerabdruck: 0dbe3dd9d9a460181f6088bf2c13b3e8a8002217786c502d96d822b1d59bb2ac
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "WLAN"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

Technische Vergleichsdaten: [{"path":"specs.13.value","value":"Nein"}]

### oneisall-3-2l-cordless-fountain

Datei: src/content/products/oneisall-3-2l-cordless-fountain.md

SHA-256: c9737a5f27fb01a23d17f83ffe990d40c65cceba640027a7c9f4f2b20c6b5758

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 8c7f4832ab26e2963806e37b13717887649206187db414e92cf269facb4b23a4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "3,2 Liter beziehungsweise 108 fl. oz."
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „3,2 Liter beziehungsweise 108 fl. oz.“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 3,2 Liter beziehungsweise 108 fl. oz.“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"3,2 Liter beziehungsweise 108 fl. oz."}]

#### Hinweis 2

- Fingerabdruck: 37728e4b7e6352c56464db7bc0e53b50ea210ae78e0ce48d543472b0f0b8f339
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Material"
- Original Wert: "ABS-Tank mit Trinkfläche aus Edelstahl 304"
- Original Konsequenz: "Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"ABS-Tank mit Trinkfläche aus Edelstahl 304"}]

#### Hinweis 3

- Fingerabdruck: 965c90f9f31935e51fc62ae9b284ed833d18498502012f057ebb931d956a6c03
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akku"
- Original Wert: "integrierter Lithium-Ionen-Akku mit 4.000 mAh"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akku: integrierter Lithium-Ionen-Akku mit 4.000 mAh“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"integrierter Lithium-Ionen-Akku mit 4.000 mAh"}]

#### Hinweis 4

- Fingerabdruck: 5ecc90bcdd6aaa1b6a5b620b0ba7c3901b9f2a1713515bec698f44db886555af
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkulaufzeit"
- Original Wert: "Herstellerangabe bis zu 30 Tage; abhängig von Betriebsmodus und Nutzung"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkulaufzeit: Herstellerangabe bis zu 30 Tage; abhängig von Betriebsmodus und Nutzung“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"Herstellerangabe bis zu 30 Tage; abhängig von Betriebsmodus und Nutzung"}]

#### Hinweis 5

- Fingerabdruck: 471ddf5743311f2b3c723148ee9dc1182f1588d079ab7687e225e5fd6af2ea7f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Lautstärke"
- Original Wert: "Herstellerangabe ungefähr 20 dB"
- Original Konsequenz: "Geräusche können bei schreckhaften Tieren und in Schlafräumen kaufentscheidend sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.12.value","value":"Herstellerangabe ungefähr 20 dB"}]

#### Hinweis 6

- Fingerabdruck: 9a14e1f025c1d71a8c49043f2f779b48ecdac32080ecf891457d97eb578dac4a
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Filterung"
- Original Wert: "fünfstufig"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.14.value","value":"fünfstufig"}]

### oneisall-3-5l-cordless-fountain

Datei: src/content/products/oneisall-3-5l-cordless-fountain.md

SHA-256: 403262ec6c79e0e4aa280bd26f0d6dba47abced62011f0ff16e3070470bf9865

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 779d316f7d4194e64adc87e6212b238b76a75f36f239c9111aec5140e1b1e710
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "3,5 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „3,5 Liter“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 3,5 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.0.value","value":"3,5 Liter"}]

#### Hinweis 2

- Fingerabdruck: 587e65790a8d7f0713429651276f6f60528794ebbadc1f9d79b4162010362b3b
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Material"
- Original Wert: "Edelstahl"
- Original Konsequenz: "Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"Edelstahl"}]

#### Hinweis 3

- Fingerabdruck: dd7ee1f61862ecd15c827f850e02c3bd3a0f9abd039be05219e6c8e95f039e3e
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Lautstärke"
- Original Wert: "Herstellerangabe unter 30 dB"
- Original Konsequenz: "Geräusche können bei schreckhaften Tieren und in Schlafräumen kaufentscheidend sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"Herstellerangabe unter 30 dB"}]

#### Hinweis 4

- Fingerabdruck: 86b1048dc8269a396f46423d137fc8537c95f2ebd409224a6d242d8eeecd4f03
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akku"
- Original Wert: "5000 mAh; Herstellerangabe bis zu 60 Tage"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akku: 5000 mAh; Herstellerangabe bis zu 60 Tage“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"5000 mAh; Herstellerangabe bis zu 60 Tage"}]

#### Hinweis 5

- Fingerabdruck: 51f157d792b3c18d0e623709e0bce96a64e85a7b5e96894ed8b0a2567b5664e9
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Filter"
- Original Wert: "5-stufige Wasserfilterung"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.5.consequence: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"5-stufige Wasserfilterung"}]

#### Hinweis 6

- Fingerabdruck: 384a8fcd9ca2e8fb2cb191cd7b4765b0ff71f3133c2985a0937361850957c53d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Ersatzfilter"
- Original Wert: "Herstellerempfehlung: alle 2 bis 3 Wochen wechseln"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Herstellerempfehlung: alle 2 bis 3 Wochen wechseln"}]

### oneisall-5l-automatic-cat-feeder

Datei: src/content/products/oneisall-5l-automatic-cat-feeder.md

SHA-256: c892a9b4c04ac298cbb74207ba3e44055bbe9f85bce39f1d3aee8b6348cc6ade

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 91c01f8f591399fdac941702e6fc2ff663974f4594fe5876c732a2c616bb53c4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "5 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 5 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"5 Liter"}]

#### Hinweis 2

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"Nein"}]

#### Hinweis 3

- Fingerabdruck: 8474f542f8dcfcfc516d2c605cdebfa07b1fac67e30e02df9b20bdf6349b1c23
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzteil, je nach Variante Batterie-Backup"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzteil, je nach Variante Batterie-Backup“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"Netzteil, je nach Variante Batterie-Backup"}]

#### Hinweis 4

- Fingerabdruck: 2b8919ffa8ca3cd2ebbb47caec9da5ec33bb3dbe32164d0d5fe000f887286861
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "programmierbare Trockenfutterportionen auf zwei Näpfe verteilt"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"programmierbare Trockenfutterportionen auf zwei Näpfe verteilt"}]

#### Hinweis 5

- Fingerabdruck: 3d69852c43602c14abd8103169f61d6e0f06e9aa385c6b507eee24f0a28c1feb
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Batterie"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Batterie: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"Nicht vom Hersteller ausgewiesen"}]

#### Hinweis 6

- Fingerabdruck: 34fc96e20b6e243956e06feef3494ecf22be3221ecd1a4dc8ec0f6b03de96e38
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.13.value","value":"Nicht vom Hersteller ausgewiesen"}]

### oneisall-7l-dog-water-fountain

Datei: src/content/products/oneisall-7l-dog-water-fountain.md

SHA-256: e16a6c6fd55a6ee0569b77c941ace727b617a9dda7120af3d7458930ac72b5e2

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 3277ba34dc91090c0faf67c2b5931db9bc0dcbabfd01a9b60be5d7dd9e664361
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "7 Liter beziehungsweise rund 230 fl. oz."
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „7 Liter beziehungsweise rund 230 fl. oz.“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 7 Liter beziehungsweise rund 230 fl. oz.“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"7 Liter beziehungsweise rund 230 fl. oz."}]

#### Hinweis 2

- Fingerabdruck: 2efbbfbc29aa1f8571eaa6336af6a938c9ff93e644143f17aef13f1f77cbb47f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Material"
- Original Wert: "Trinkschale aus SUS/304-Edelstahl; Tank und weitere Bauteile aus Kunststoff beziehungsweise PC"
- Original Konsequenz: "Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"Trinkschale aus SUS/304-Edelstahl; Tank und weitere Bauteile aus Kunststoff beziehungsweise PC"}]

#### Hinweis 3

- Fingerabdruck: 0ca2385eadadb249adced27306c6feb8cd51e332927af85bf12a19856bf4c036
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "DC 5 V/1 A"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: DC 5 V/1 A“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"DC 5 V/1 A"}]

#### Hinweis 4

- Fingerabdruck: e0eeb355f90d6eabe258719529bfcd4bc2fcd0b736b879ecc2a00e852a196063
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akku"
- Original Wert: "Nein"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akku: Nein“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"Nein"}]

#### Hinweis 5

- Fingerabdruck: 66162d289cc8f9545473c116026246372aa43a154fe80ba2f8bd66232a7ebfa1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"Nein"}]

#### Hinweis 6

- Fingerabdruck: 21cea939ad4f48f168f21cb8e0706aff40baab2e222631f902b5b84cef3e08ba
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Lautstärke"
- Original Wert: "Herstellerangabe unter beziehungsweise ungefähr 35 dB"
- Original Konsequenz: "Geräusche können bei schreckhaften Tieren und in Schlafräumen kaufentscheidend sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.12.value","value":"Herstellerangabe unter beziehungsweise ungefähr 35 dB"}]

### paj-pet-finder-4g-mini

Datei: src/content/products/paj-pet-finder-4g-mini.md

SHA-256: 0431040a869a76c32af3db0daa6806501c152c7dcff0c117269a3d8796ce378e

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: f044fc912fbf002aa73bbae55fe973fc19ca70f64993852b85b3c915e943fb38
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Abo"
- Original Wert: "27 Monate Tracking enthalten; danach kostenpflichtiger PAJ-Tarif erforderlich"
- Original Konsequenz: "Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.0.value","value":"27 Monate Tracking enthalten; danach kostenpflichtiger PAJ-Tarif erforderlich"}]

#### Hinweis 2

- Fingerabdruck: 9789501085637dde676e835a968980c225cdd3b9aaaa9e6cd4223ed97fd83c00
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "WLAN"
- Original Wert: "2,4-GHz-WLAN kann als Energiesparzone eingerichtet werden"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.20.value","value":"2,4-GHz-WLAN kann als Energiesparzone eingerichtet werden"}]

#### Hinweis 3

- Fingerabdruck: b91f27195bd1e78277cb445623f781d32e1010a29ad38522c8573a12273a12f0
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akku"
- Original Wert: "integrierter 700-mAh-Lithium-Polymer-Akku mit 3,7 V und 2,59 Wh"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4, 5, 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akku: integrierter 700-mAh-Lithium-Polymer-Akku mit 3,7 V und 2,59 Wh“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.22.value","value":"integrierter 700-mAh-Lithium-Polymer-Akku mit 3,7 V und 2,59 Wh"}]

#### Hinweis 4

- Fingerabdruck: a5fa94bc120f92cc8dbda06c26b112961914fa4873fa9556213a79fe8a9189e2
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkulaufzeit Energiesparmodus"
- Original Wert: "bis zu 10 Tage laut Hersteller"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3, 5, 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkulaufzeit Energiesparmodus: bis zu 10 Tage laut Hersteller“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.23.value","value":"bis zu 10 Tage laut Hersteller"}]

#### Hinweis 5

- Fingerabdruck: 32143ed964dcaec3d6c87509b1dc632437885a737ab119543982893b6bf4d682
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkulaufzeit gemischte Nutzung"
- Original Wert: "aktuelle Detailangabe 4 bis 6 Tage"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3, 4, 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkulaufzeit gemischte Nutzung: aktuelle Detailangabe 4 bis 6 Tage“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.24.value","value":"aktuelle Detailangabe 4 bis 6 Tage"}]

#### Hinweis 6

- Fingerabdruck: a434cc070a3667379dbcb48c1dea66ff9137a9d83dd032d424da70032c7127db
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkulaufzeit kontinuierliches Tracking"
- Original Wert: "aktuelle Detailangabe etwa 1 bis 2 Tage; FAQ nennt teils 1 bis 3 Tage"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3, 4, 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkulaufzeit kontinuierliches Tracking: aktuelle Detailangabe etwa 1 bis 2 Tage; FAQ nennt teils 1 bis 3 Tage“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.25.value","value":"aktuelle Detailangabe etwa 1 bis 2 Tage; FAQ nennt teils 1 bis 3 Tage"}]

### pawbby-smart-pet-feeder

Datei: src/content/products/pawbby-smart-pet-feeder.md

SHA-256: bc25b08ae37e83a9bc721227076a23703162d4db2d9c8ff2d251f01c0046f267

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 7d2249a2d674af979bf3f88ed7e68dca934a0d01f97c8eaeb7a55c2068eab0a6
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App-Steuerung"
- Original Wert: "Ja, modellabhängig"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"Ja, modellabhängig"}]

#### Hinweis 2

- Fingerabdruck: 71983cc1b1cb196b91dbadfe138de97e8f846e8efd31f69217f04347c5f98753
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "häufig 3,6 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: häufig 3,6 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"häufig 3,6 Liter"}]

#### Hinweis 3

- Fingerabdruck: 4688dc5acb8b656ee80b10577573f2feb62dbe464cb0a5aa5ea41fb0bc259fa5
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzteil, modellabhängig Backup"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzteil, modellabhängig Backup“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"Netzteil, modellabhängig Backup"}]

#### Hinweis 4

- Fingerabdruck: f531106fab92b52705e348f62dc2d57e333c5f674cbe37865e9fda6cae79053e
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "zeitgesteuerte Trockenfutterportionen per App"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"zeitgesteuerte Trockenfutterportionen per App"}]

#### Hinweis 5

- Fingerabdruck: 3d69852c43602c14abd8103169f61d6e0f06e9aa385c6b507eee24f0a28c1feb
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Batterie"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Batterie: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"Nicht vom Hersteller ausgewiesen"}]

#### Hinweis 6

- Fingerabdruck: 34fc96e20b6e243956e06feef3494ecf22be3221ecd1a4dc8ec0f6b03de96e38
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.13.value","value":"Nicht vom Hersteller ausgewiesen"}]

### pawsync-smart-pet-feeder

Datei: src/content/products/pawsync-smart-pet-feeder.md

SHA-256: 23e1bcb4377c551e11b1bf3194930429fa7132954a884ded6c76bef2249fd400

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: c52f47c652609adb0c0d9fa26bbf64c3ccf1edebdfa11c0164226a9953bf2598
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "3,6 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 3,6 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"3,6 Liter"}]

#### Hinweis 2

- Fingerabdruck: 3454525a0c553d2ce7f1b988d39a2ab6b92a4a3a14ca2a9b22ae0b07f8589c75
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Krokettengröße"
- Original Wert: "4 bis 15 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Die Krokettengröße „4 bis 15 mm“ wird mit Stellplatz oder Körpergröße begründet; das sind andere Größen als die zulässigen Futterabmessungen.
  - Vorhandene Evidenz category: {"key":"futterautomaten","label":"Futterautomaten","path":"/smarte-futterautomaten/"}
  - Vorhandene Evidenz decisionFacts.1.label: "Krokettengröße"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Krokettengröße: 4 bis 15 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"4 bis 15 mm"}]

#### Hinweis 3

- Fingerabdruck: a380f0ef8a28819e0307d3f2b4bc1519af81ee48cf0677c8dbc50438f912c39a
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "5 V Netzteil plus 3 D-Batterien"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: 5 V Netzteil plus 3 D-Batterien“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"5 V Netzteil plus 3 D-Batterien"}]

#### Hinweis 4

- Fingerabdruck: 5ee9d959916b64dcb76d0decc91eacb25501c8f6cfacce962b005fa298d4fb6d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "PawSync App"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"PawSync App"}]

#### Hinweis 5

- Fingerabdruck: 96dfc22d61e6744fb1bbadc0236751bf19ebb958cd96034175a72dbd39217141
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "gewichtskontrollierte Ausgabe mit integrierter Napfwaage"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"gewichtskontrollierte Ausgabe mit integrierter Napfwaage"}]

#### Hinweis 6

- Fingerabdruck: 3d69852c43602c14abd8103169f61d6e0f06e9aa385c6b507eee24f0a28c1feb
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Batterie"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Batterie: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.12.value","value":"Nicht vom Hersteller ausgewiesen"}]

### petkit-eversweet-3-pro-uvc

Datei: src/content/products/petkit-eversweet-3-pro-uvc.md

SHA-256: 7fc34c9d94b7cc6c84c846e6e1e019e09edf275b0efbafb4b8a0328de816b2d6

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: e18a96562fa6ffa83a7d527a2c99735cd358724286f4cdcb9f47aefb175bff79
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Nutzbare Kapazität"
- Original Wert: "1,6 Liter beziehungsweise 54 fl. oz."
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 2 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.1.consequence: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."
- WRONG_DECISION_CONTEXT: Der Wasserinhalt „1,6 Liter beziehungsweise 54 fl. oz.“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Nutzbare Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Nutzbare Kapazität: 1,6 Liter beziehungsweise 54 fl. oz.“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"1,6 Liter beziehungsweise 54 fl. oz."}]

#### Hinweis 2

- Fingerabdruck: da44573785d3e9f5794575e1a698dc5d9e07591237638704308f13219b8661d6
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Maximales Behältervolumen"
- Original Wert: "1,8 Liter laut Verpackung und älterer Anleitung; PETKIT weist 1,6 Liter als tatsächlich nutzbar aus"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 1 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.0.consequence: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."
- WRONG_DECISION_CONTEXT: Der Wasserinhalt „1,8 Liter laut Verpackung und älterer Anleitung; PETKIT weist 1,6 Liter als tatsächlich nutzbar aus“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.1.label: "Maximales Behältervolumen"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Maximales Behältervolumen: 1,8 Liter laut Verpackung und älterer Anleitung; PETKIT weist 1,6 Liter als tatsächlich nutzbar aus“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"1,8 Liter laut Verpackung und älterer Anleitung; PETKIT weist 1,6 Liter als tatsächlich nutzbar aus"}]

#### Hinweis 3

- Fingerabdruck: ad187e0d9f9c88e9e2b1a9340c70860eeae98b0357d3afbd2b279a032eb81789
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Materialien"
- Original Wert: "BPA-freies ABS, Silikon, Polypropylen und Edelstahl 304"
- Original Konsequenz: "Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"BPA-freies ABS, Silikon, Polypropylen und Edelstahl 304"}]

#### Hinweis 4

- Fingerabdruck: 62938d431cb1a96c5d4ebe210aa114ddd020317ec55c6dd64d12499bdbc921ca
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "PETKIT-App für iOS und Android"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.17.value","value":"PETKIT-App für iOS und Android"}]

#### Hinweis 5

- Fingerabdruck: 6ea2914ac7237981888b63604bbd2ca6d937f42db50c23d196332702af844ad7
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Hauptfilter"
- Original Wert: "PETKIT Filter Unit 3.0, Modell P4161"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.5.consequence: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

Technische Vergleichsdaten: [{"path":"specs.22.value","value":"PETKIT Filter Unit 3.0, Modell P4161"}]

#### Hinweis 6

- Fingerabdruck: 9d2e1a5ab7201cad8fadd74bf4f32a0763a26c30c68cdd543de7787f5ba08e75
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Filteraufbau"
- Original Wert: "hochdichtes Filtervlies, Kokos-Aktivkohle und Ionenaustauschharz"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

Technische Vergleichsdaten: [{"path":"specs.23.value","value":"hochdichtes Filtervlies, Kokos-Aktivkohle und Ionenaustauschharz"}]

### petkit-eversweet-5-mini

Datei: src/content/products/petkit-eversweet-5-mini.md

SHA-256: f8642fc8010a29449d84953ac7369592956a1084d9030e91052676fc0bbc5ff2

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 332abf4ed51ec8a7ea289b70bcc0b4da8ab97229c0b68631b6e2c45a96b81278
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "1 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „1 Liter“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 1 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.0.value","value":"1 Liter"}]

#### Hinweis 2

- Fingerabdruck: 8c8e1087713028f1d16458cdd60befec108442fed8caa3cbe3f2f095362976e5
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Material"
- Original Wert: "Keramik, PP und Silikon"
- Original Konsequenz: "Keramik ist schwer und standfest, kann bei Stößen aber beschädigt werden."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"Keramik, PP und Silikon"}]

#### Hinweis 3

- Fingerabdruck: b973d3c43aaf6078c2b78fa81be6e37ff171848b9e4fd3dad7af0aee30b0ea4f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzbetrieb"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzbetrieb“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"Netzbetrieb"}]

#### Hinweis 4

- Fingerabdruck: 8c860f394c503d11e8915032445f504c23e421e290e7c50497fc19c5e7ee5320
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Filter"
- Original Wert: "mehrstufig"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"mehrstufig"}]

#### Hinweis 5

- Fingerabdruck: c0e63921f9c954167d9a7faade101645c163ff020d992c8cec61be953f81b8ec
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "1,4 kg"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: 1,4 kg“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"1,4 kg"}]

#### Hinweis 6

- Fingerabdruck: 951a5ab9195f41029c3dba29f47647ac684c568aa6210200ef47918cdd01f402
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Lautstärke"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Geräusche können bei schreckhaften Tieren und in Schlafräumen kaufentscheidend sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"Nicht vom Hersteller ausgewiesen"}]

### petkit-eversweet-max-2-uvc

Datei: src/content/products/petkit-eversweet-max-2-uvc.md

SHA-256: d022187e377efb3eadbebbc5e66fe1b04c723a3d2c9b95c5dff70ae0614de2db

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 0c4b956f94f22f3f7b5c77598c4e08b29ac38c0d8d95e5d1ff3b0d31f8568489
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "3 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „3 Liter“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 3 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"3 Liter"}]

#### Hinweis 2

- Fingerabdruck: aa4dadd093b66ad12351ce4f63b14dd7ff7a56d7ad178176aa7645dfde1bfd3f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Material"
- Original Wert: "BPA-freies ABS und Edelstahl 304"
- Original Konsequenz: "Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"BPA-freies ABS und Edelstahl 304"}]

#### Hinweis 3

- Fingerabdruck: 56e79401772448e5296e3e8b3b7bc44a7c7fd8c3912b991f45bed5b5a063e91c
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "USB 5 V/1 A und integrierter Akku"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: USB 5 V/1 A und integrierter Akku“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"USB 5 V/1 A und integrierter Akku"}]

#### Hinweis 4

- Fingerabdruck: e3deab73ceeecb03d801a6dc236d16cad058f282a085cc5d3455a1dc947b4556
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkulaufzeit"
- Original Wert: "Herstellerangabe bis 83 Tage"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkulaufzeit: Herstellerangabe bis 83 Tage“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Herstellerangabe bis 83 Tage"}]

#### Hinweis 5

- Fingerabdruck: fb433785938db11fb8cc7d582499dfea89696844350988e8580fdcd1f3fcb131
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "PETKIT App über Bluetooth"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"PETKIT App über Bluetooth"}]

#### Hinweis 6

- Fingerabdruck: 88ed389e7fdb03905f30be099f39dff3b4dada9bf7f147e7cd7bcf62fa88c953
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Lautstärke"
- Original Wert: "Herstellerangabe bis 26 dB"
- Original Konsequenz: "Geräusche können bei schreckhaften Tieren und in Schlafräumen kaufentscheidend sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"Herstellerangabe bis 26 dB"}]

### petkit-eversweet-max-cordless

Datei: src/content/products/petkit-eversweet-max-cordless.md

SHA-256: cac1aa42b099879fbac5d51cf497ff884b9297506cb18e2c24c9aa28929af5f5

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 0c4b956f94f22f3f7b5c77598c4e08b29ac38c0d8d95e5d1ff3b0d31f8568489
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "3 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „3 Liter“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 3 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"3 Liter"}]

#### Hinweis 2

- Fingerabdruck: aa4dadd093b66ad12351ce4f63b14dd7ff7a56d7ad178176aa7645dfde1bfd3f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Material"
- Original Wert: "BPA-freies ABS und Edelstahl 304"
- Original Konsequenz: "Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"BPA-freies ABS und Edelstahl 304"}]

#### Hinweis 3

- Fingerabdruck: 64446d42aa5f2cc4db4a6092d3fe2b96d5af9d2068bd46839581e26f9ae1c0ae
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "USB-Kabel und integrierter Lithium-Akku"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: USB-Kabel und integrierter Lithium-Akku“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"USB-Kabel und integrierter Lithium-Akku"}]

#### Hinweis 4

- Fingerabdruck: e3deab73ceeecb03d801a6dc236d16cad058f282a085cc5d3455a1dc947b4556
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkulaufzeit"
- Original Wert: "Herstellerangabe bis 83 Tage"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkulaufzeit: Herstellerangabe bis 83 Tage“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Herstellerangabe bis 83 Tage"}]

#### Hinweis 5

- Fingerabdruck: 9b15e3ec2e8cf8355af23affe467b1705884e3870f74a170d53d30767fa81050
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "PETKIT-App über Bluetooth"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"PETKIT-App über Bluetooth"}]

#### Hinweis 6

- Fingerabdruck: 9e624938a8c94e94d878d508ae9ad30ee48b5747dad41d23a4c19d51549eb678
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Lautstärke"
- Original Wert: "Herstellerangabe etwa 26 dB"
- Original Konsequenz: "Geräusche können bei schreckhaften Tieren und in Schlafräumen kaufentscheidend sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"Herstellerangabe etwa 26 dB"}]

### petkit-eversweet-solo-2-fountain

Datei: src/content/products/petkit-eversweet-solo-2-fountain.md

SHA-256: b4e5d2f7f713ad85094985d1519edf4c6ce182030bac740495f1bd3c790465f0

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: f460a3c6618761e633125a7adf8987976e43d33945309f7a4990e32e814cea28
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "2 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „2 Liter“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 2 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.0.value","value":"2 Liter"}]

#### Hinweis 2

- Fingerabdruck: d8b646cff76fe205b648472b720845ee0af205eca5060226cb3eebe8c0bd1d23
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Lautstärke"
- Original Wert: "Herstellerangabe bis 25 dB"
- Original Konsequenz: "Geräusche können bei schreckhaften Tieren und in Schlafräumen kaufentscheidend sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"Herstellerangabe bis 25 dB"}]

#### Hinweis 3

- Fingerabdruck: 7cba4f690adc258b8737c4d95817c8f7a08915be5369163fe73106bab6d031a4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Filter"
- Original Wert: "mehrstufig mit Aktivkohle und Ionenaustauscher"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"mehrstufig mit Aktivkohle und Ionenaustauscher"}]

#### Hinweis 4

- Fingerabdruck: 70db39e0ab50df64c69257e1b6470f76c1e3863cdff66efa4eb77b0f61ec13ef
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Ersatzfilter"
- Original Wert: "Filter Unit 3.0; Herstellerempfehlung alle 4 Wochen"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Filter Unit 3.0; Herstellerempfehlung alle 4 Wochen"}]

#### Hinweis 5

- Fingerabdruck: 6a48fec69e360a82a153fd3cf86c042855b2034fc93f049f4bc11b471566b253
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akku"
- Original Wert: "Nein; dauerhafter Netzbetrieb erforderlich"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akku: Nein; dauerhafter Netzbetrieb erforderlich“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"Nein; dauerhafter Netzbetrieb erforderlich"}]

#### Hinweis 6

- Fingerabdruck: a8a59e06d70056400aad6883c3571e1d8f738acfe2e2b0814982aa5a7970259a
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "0,8 kg"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: 0,8 kg“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.12.value","value":"0,8 kg"}]

### petkit-eversweet-solo-se

Datei: src/content/products/petkit-eversweet-solo-se.md

SHA-256: 95c9328066c2ebdb827b06a739470948e26205b32b57433374d6e3ffa2bf1ac2

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: a338f49ecf5d2ffcab08585dd1210fd81d99d94c6a470a86ce332b7123275d98
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "1,8 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „1,8 Liter“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 1,8 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"1,8 Liter"}]

#### Hinweis 2

- Fingerabdruck: 5487d3263db18817f79749690a986e3e49f399b7c7163bab6c5f23d10908c072
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "USB-Kabel, 5 V/1 A; Netzteil nicht enthalten"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: USB-Kabel, 5 V/1 A; Netzteil nicht enthalten“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"USB-Kabel, 5 V/1 A; Netzteil nicht enthalten"}]

#### Hinweis 3

- Fingerabdruck: 66162d289cc8f9545473c116026246372aa43a154fe80ba2f8bd66232a7ebfa1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"Nein"}]

#### Hinweis 4

- Fingerabdruck: d8b646cff76fe205b648472b720845ee0af205eca5060226cb3eebe8c0bd1d23
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Lautstärke"
- Original Wert: "Herstellerangabe bis 25 dB"
- Original Konsequenz: "Geräusche können bei schreckhaften Tieren und in Schlafräumen kaufentscheidend sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"Herstellerangabe bis 25 dB"}]

#### Hinweis 5

- Fingerabdruck: 8c860f394c503d11e8915032445f504c23e421e290e7c50497fc19c5e7ee5320
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Filter"
- Original Wert: "mehrstufig"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.5.consequence: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"mehrstufig"}]

#### Hinweis 6

- Fingerabdruck: 161d296f421d92e0f04db8c9a62a8e850220fface553f181402cb494011842f2
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Filterwechsel"
- Original Wert: "Herstellerempfehlung etwa alle vier Wochen"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"Herstellerempfehlung etwa alle vier Wochen"}]

### petkit-eversweet-ultra

Datei: src/content/products/petkit-eversweet-ultra.md

SHA-256: 016d32487aae18c32e38b9d0283b40f7ac08bdb508b01a808bec72a7bf300fbd

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: a7d0babe7647e1451dcf76a4aeffe5fd9837940282769cca97cae6faac37f63e
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "5 Liter Frischwasser plus 1,8 Liter Abwasser"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „5 Liter Frischwasser plus 1,8 Liter Abwasser“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 5 Liter Frischwasser plus 1,8 Liter Abwasser“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.0.value","value":"5 Liter Frischwasser plus 1,8 Liter Abwasser"}]

#### Hinweis 2

- Fingerabdruck: 9f4a00d99a4ef41c7aed4a4557f5643193e30eb230164284cc58170a7485ef9c
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Klassischer Hauptfilter"
- Original Wert: "Nein"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.12.value","value":"Nein"}]

#### Hinweis 3

- Fingerabdruck: 44dbff1cd44d5b3208186cd129664c1d51d2e9932d8714ac1583124c13723262
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "PETKIT-App"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.24.value","value":"PETKIT-App"}]

#### Hinweis 4

- Fingerabdruck: 7e0b3a9f835b7ebb8d1ab80ef2fa8a009f2d2ca6b784e7ca25687acbd2d2e576
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Lautstärke"
- Original Wert: "Herstellerangabe höchstens etwa 26 dB im Normalbetrieb; beim Spülen und Nachfüllen höher"
- Original Konsequenz: "Geräusche können bei schreckhaften Tieren und in Schlafräumen kaufentscheidend sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.28.value","value":"Herstellerangabe höchstens etwa 26 dB im Normalbetrieb; beim Spülen und Nachfüllen höher"}]

#### Hinweis 5

- Fingerabdruck: 97e5595f773c0797c639aad7873b5441254ae5e5cc07de3703a525602aaf1b09
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzbetrieb mit 12 V/2 A"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzbetrieb mit 12 V/2 A“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.29.value","value":"Netzbetrieb mit 12 V/2 A"}]

#### Hinweis 6

- Fingerabdruck: e0eeb355f90d6eabe258719529bfcd4bc2fcd0b736b879ecc2a00e852a196063
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akku"
- Original Wert: "Nein"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akku: Nein“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.30.value","value":"Nein"}]

### petkit-fresh-element-infinity

Datei: src/content/products/petkit-fresh-element-infinity.md

SHA-256: a8e22b1c4009ed338f685df6d556c893755c979aef3a414f39ad57d128813ebb

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: ceabd4135da3493c315948ed4d69c382151b078d4dd161048d9f680f75cb7fd7
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App-Steuerung"
- Original Wert: "Ja"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"Ja"}]

#### Hinweis 2

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"Nein"}]

#### Hinweis 3

- Fingerabdruck: 91c01f8f591399fdac941702e6fc2ff663974f4594fe5876c732a2c616bb53c4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "5 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 5 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"5 Liter"}]

#### Hinweis 4

- Fingerabdruck: 47d59bd8d231de332c240587366a0a02e3857a1a45291aa45f4f15c384c2a3a5
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzteil mit integriertem Akku"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzteil mit integriertem Akku“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Netzteil mit integriertem Akku"}]

#### Hinweis 5

- Fingerabdruck: 9de374f3cb17c4905cb0077addf3e72e4940e491c7831935af2a32aaf1158037
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "App-gesteuerte Portionierung; integrierte Napfwaage erfasst die Futtermenge"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"App-gesteuerte Portionierung; integrierte Napfwaage erfasst die Futtermenge"}]

#### Hinweis 6

- Fingerabdruck: 3d69852c43602c14abd8103169f61d6e0f06e9aa385c6b507eee24f0a28c1feb
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Batterie"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Batterie: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"Nicht vom Hersteller ausgewiesen"}]

### petkit-fresh-element-solo

Datei: src/content/products/petkit-fresh-element-solo.md

SHA-256: 9bfcbff6ecd8b9036c9e73602423741008778f847fb8d609f894ea8d8541fd90

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 7a09cc5df7a3cf094e61c31659646c3a2eb2f5a71ee4dbf81327532076ddfc87
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Krokettengröße Trockenfutter"
- Original Wert: "höchstens 12 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 2, 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.1.consequence: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."
- WRONG_DECISION_CONTEXT: Die Krokettengröße „höchstens 12 mm“ wird mit Stellplatz oder Körpergröße begründet; das sind andere Größen als die zulässigen Futterabmessungen.
  - Vorhandene Evidenz category: {"key":"futterautomaten","label":"Futterautomaten","path":"/smarte-futterautomaten/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Krokettengröße Trockenfutter"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Krokettengröße Trockenfutter: höchstens 12 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"höchstens 12 mm"}]

#### Hinweis 2

- Fingerabdruck: 1503de2a5e46a3a3651bf16bc2470df89c514aaba7042fbb096e334ffc04b2ea
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Krokettengröße gefriergetrocknet"
- Original Wert: "aktuelle Produktseite nennt höchstens 9 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 1, 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.0.consequence: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."
- WRONG_DECISION_CONTEXT: Die Krokettengröße „aktuelle Produktseite nennt höchstens 9 mm“ wird mit Stellplatz oder Körpergröße begründet; das sind andere Größen als die zulässigen Futterabmessungen.
  - Vorhandene Evidenz category: {"key":"futterautomaten","label":"Futterautomaten","path":"/smarte-futterautomaten/"}
  - Vorhandene Evidenz decisionFacts.1.label: "Krokettengröße gefriergetrocknet"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Krokettengröße gefriergetrocknet: aktuelle Produktseite nennt höchstens 9 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"aktuelle Produktseite nennt höchstens 9 mm"}]

#### Hinweis 3

- Fingerabdruck: a6e3265409bba9c656478f2857f12d1694bbb5bae79d52a4459d6f5f14433d9d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "3 Liter beziehungsweise 12 Cups"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 3 Liter beziehungsweise 12 Cups“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"3 Liter beziehungsweise 12 Cups"}]

#### Hinweis 4

- Fingerabdruck: 13a29b0d8b748b45e06cb44dcf65f36df1e90b313386b38b45310887d889cba2
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht des Vorrats"
- Original Wert: "Herstellerschätzung etwa 1,33 kg; abhängig von der Schüttdichte"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht des Vorrats: Herstellerschätzung etwa 1,33 kg; abhängig von der Schüttdichte“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"Herstellerschätzung etwa 1,33 kg; abhängig von der Schüttdichte"}]

#### Hinweis 5

- Fingerabdruck: 28cc4cf6a766b07f27dae0d28a30dfdd07ef32bfca95a9d5078fdbde02c3e10d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionen je Mahlzeit"
- Original Wert: "1 bis 5 Portionseinheiten"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"1 bis 5 Portionseinheiten"}]

#### Hinweis 6

- Fingerabdruck: 36cb1b396a078015a54b8b3f9de12dbc2b52e750b18a45ae4ecb980fceb31973
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Portionsgröße"
- Original Wert: "Herstellerangabe ungefähr 10 g beziehungsweise 1/12 Cup je Einheit"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 1, 2 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.0.consequence: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."
  - Vorhandene Evidenz decisionFacts.1.consequence: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Portionsgröße: Herstellerangabe ungefähr 10 g beziehungsweise 1/12 Cup je Einheit“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"Herstellerangabe ungefähr 10 g beziehungsweise 1/12 Cup je Einheit"}]

### petkit-yumshare-dual-hopper

Datei: src/content/products/petkit-yumshare-dual-hopper.md

SHA-256: 1db2c4983a9bb73b000cc05ad2a532405b07cc8c5d444be2c5823c05c2ed1c56

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 133344fa66f56a2c5f1ecc9ee05aded5547678065fb7a95452e2fed8ca6cb611
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gesamtkapazität"
- Original Wert: "5 Liter beziehungsweise 21 Cups"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gesamtkapazität: 5 Liter beziehungsweise 21 Cups“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"5 Liter beziehungsweise 21 Cups"}]

#### Hinweis 2

- Fingerabdruck: 7a09cc5df7a3cf094e61c31659646c3a2eb2f5a71ee4dbf81327532076ddfc87
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Krokettengröße Trockenfutter"
- Original Wert: "höchstens 12 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."
- WRONG_DECISION_CONTEXT: Die Krokettengröße „höchstens 12 mm“ wird mit Stellplatz oder Körpergröße begründet; das sind andere Größen als die zulässigen Futterabmessungen.
  - Vorhandene Evidenz category: {"key":"futterautomaten","label":"Futterautomaten","path":"/smarte-futterautomaten/"}
  - Vorhandene Evidenz decisionFacts.1.label: "Krokettengröße Trockenfutter"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Krokettengröße Trockenfutter: höchstens 12 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"höchstens 12 mm"}]

#### Hinweis 3

- Fingerabdruck: 434c1c01eb95d7e13344c53084ca4f6440ceda110f60f8815b9b563c075ec5c3
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Krokettengröße gefriergetrocknet"
- Original Wert: "höchstens 9 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 2 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.1.consequence: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."
- WRONG_DECISION_CONTEXT: Die Krokettengröße „höchstens 9 mm“ wird mit Stellplatz oder Körpergröße begründet; das sind andere Größen als die zulässigen Futterabmessungen.
  - Vorhandene Evidenz category: {"key":"futterautomaten","label":"Futterautomaten","path":"/smarte-futterautomaten/"}
  - Vorhandene Evidenz decisionFacts.2.label: "Krokettengröße gefriergetrocknet"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Krokettengröße gefriergetrocknet: höchstens 9 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"höchstens 9 mm"}]

#### Hinweis 4

- Fingerabdruck: 0893e6c73433e9250b2e99e31b232b93247c8355dca0ddae83cbef9823f4b873
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Portionen je Mahlzeit"
- Original Wert: "1 bis 10 Portionseinheiten pro Kammer"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5, 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."
  - Vorhandene Evidenz decisionFacts.5.consequence: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"1 bis 10 Portionseinheiten pro Kammer"}]

#### Hinweis 5

- Fingerabdruck: 15cedfe3783f5e75ec9ef6e602cfb204e94f5effccc5e1ec5191cdf68e4da66f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Nominelle Portionsspanne"
- Original Wert: "PETKIT nennt 10 bis 100 g pro Kammer und Mahlzeit; tatsächliches Gewicht hängt vom Futter und der Kammer ab"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4, 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."
  - Vorhandene Evidenz decisionFacts.5.consequence: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"PETKIT nennt 10 bis 100 g pro Kammer und Mahlzeit; tatsächliches Gewicht hängt vom Futter und der Kammer ab"}]

#### Hinweis 6

- Fingerabdruck: 0d3ba92c8a5e29fc63f4072eeac703431817d8f34667f238c468480cc4b3e9ff
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Portionsmessung"
- Original Wert: "volumetrisch; keine integrierte Waage"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4, 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."
  - Vorhandene Evidenz decisionFacts.4.consequence: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"volumetrisch; keine integrierte Waage"}]

### petkit-yumshare-solo-2

Datei: src/content/products/petkit-yumshare-solo-2.md

SHA-256: d9c1d4db1ba8fedcce99fb8e91404b53bc95ca3528175ee36a6e77a8b66a9eee

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: a6e3265409bba9c656478f2857f12d1694bbb5bae79d52a4459d6f5f14433d9d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "3 Liter beziehungsweise 12 Cups"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 3 Liter beziehungsweise 12 Cups“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"3 Liter beziehungsweise 12 Cups"}]

#### Hinweis 2

- Fingerabdruck: eb537ad58997238f2fb40830c3a678edb5d28838ce17928061f461fe62f66393
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionen"
- Original Wert: "1 bis 5 Portionen pro Mahlzeit; Herstellerdarstellung ungefähr 10 bis 50 g"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"1 bis 5 Portionen pro Mahlzeit; Herstellerdarstellung ungefähr 10 bis 50 g"}]

#### Hinweis 3

- Fingerabdruck: 44dbff1cd44d5b3208186cd129664c1d51d2e9932d8714ac1583124c13723262
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "PETKIT-App"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"PETKIT-App"},{"path":"comparisonFilters.app","value":true}]

#### Hinweis 4

- Fingerabdruck: 2da4efd413392a2d9d0faf11262787a95d31c5a65af9d9d01c89cd70515b87c7
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "6-V-Netzteil; Backup-Stromversorgung vorhanden"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5, 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: 6-V-Netzteil; Backup-Stromversorgung vorhanden“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"6-V-Netzteil; Backup-Stromversorgung vorhanden"}]

#### Hinweis 5

- Fingerabdruck: 5e46df9c1f09fccda689c880eea886b32a4e1d1f87375b7a3e9ee754cd5d6be4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Batterie-Backup"
- Original Wert: "Laut aktueller PETKIT-Produktseite bis zu 14 Tage mit fünf AAA-Alkaline-Batterien"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4, 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Batterie-Backup: Laut aktueller PETKIT-Produktseite bis zu 14 Tage mit fünf AAA-Alkaline-Batterien“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"laut aktueller PETKIT-Produktseite bis zu 14 Tage mit fünf AAA-Alkaline-Batterien"}]

#### Hinweis 6

- Fingerabdruck: 78df3bdc61d9ec2b08f23ffde53539a634642fd5699a848b3b4e20c6c54f4e79
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Batteriemodus"
- Original Wert: "Kamera laut Hersteller deaktiviert"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4, 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Batteriemodus: Kamera laut Hersteller deaktiviert“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.12.value","value":"Kamera laut Hersteller deaktiviert"}]

### petlibro-air-automatic-feeder

Datei: src/content/products/petlibro-air-automatic-feeder.md

SHA-256: ef07c7fa46d2722e3219d76f044ed6c9f2b8ae2b2b4124df4008272423a04340

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 825d257751b0858ec45f7310ee2c19d99ab105f50504c0c9bd8e89d675ef980a
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "App-Steuerung"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"Nein"}]

#### Hinweis 2

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"Nein"}]

#### Hinweis 3

- Fingerabdruck: f460a3c6618761e633125a7adf8987976e43d33945309f7a4990e32e814cea28
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "2 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 2 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"2 Liter"}]

#### Hinweis 4

- Fingerabdruck: 01f3bb0887d97ab6e42d94d2ea0c3996b3bdba85ff434c4bcf37e0f3dad42788
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "USB-C-Netzteil oder 3 D-Batterien"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: USB-C-Netzteil oder 3 D-Batterien“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"USB-C-Netzteil oder 3 D-Batterien"}]

#### Hinweis 5

- Fingerabdruck: 0dbe3dd9d9a460181f6088bf2c13b3e8a8002217786c502d96d822b1d59bb2ac
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "WLAN"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 1 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.0.consequence: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"Nein"}]

#### Hinweis 6

- Fingerabdruck: 3d69852c43602c14abd8103169f61d6e0f06e9aa385c6b507eee24f0a28c1feb
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Batterie"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Batterie: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"Nicht vom Hersteller ausgewiesen"}]

### petlibro-air-wifi-feeder

Datei: src/content/products/petlibro-air-wifi-feeder.md

SHA-256: 6dd2b57b8ff8e0f3b92346ea57a7475f9ecf21b3c6a0289fb1e524562d8accc2

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: c43062cca4d10a78ff683a6e02b3bf630a62c4702030254f45ce2e3eae4f3ca4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Krokettengröße"
- Original Wert: "2 bis 15 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Die Krokettengröße „2 bis 15 mm“ wird mit Stellplatz oder Körpergröße begründet; das sind andere Größen als die zulässigen Futterabmessungen.
  - Vorhandene Evidenz category: {"key":"futterautomaten","label":"Futterautomaten","path":"/smarte-futterautomaten/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Krokettengröße"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Krokettengröße: 2 bis 15 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"2 bis 15 mm"}]

#### Hinweis 2

- Fingerabdruck: f460a3c6618761e633125a7adf8987976e43d33945309f7a4990e32e814cea28
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "2 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 2 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"2 Liter"}]

#### Hinweis 3

- Fingerabdruck: dabd405a4c60b1726e92a695bab7c38b987051e985442ad0f74f18e76dea7587
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionen je Mahlzeit"
- Original Wert: "1 bis 16 Portionseinheiten"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"1 bis 16 Portionseinheiten"}]

#### Hinweis 4

- Fingerabdruck: 3a815fcfcb5939d46d3d5501d9a51ad63b0215f41d73d60007bdb84d1366b580
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Volumen je Portion"
- Original Wert: "10,4 ml beziehungsweise 1/24 Cup"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 2 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.1.consequence: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Volumen je Portion: 10,4 ml beziehungsweise 1/24 Cup“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"10,4 ml beziehungsweise 1/24 Cup"}]

#### Hinweis 5

- Fingerabdruck: 104dc5d4f2963061c0a6c8591a7955b7a0c31114a2ebb13d9015b11e95e1b398
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Portionsgewicht"
- Original Wert: "nicht fest; abhängig von Form, Größe und Dichte des Futters"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Portionsgewicht: nicht fest; abhängig von Form, Größe und Dichte des Futters“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"nicht fest; abhängig von Form, Größe und Dichte des Futters"}]

#### Hinweis 6

- Fingerabdruck: f3ec93c660af8540362565912a3009e0899cc6140513bb79abafe70fc5a35521
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "PETLIBRO-App, nicht PETLIBRO Lite"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"PETLIBRO-App, nicht PETLIBRO Lite"}]

### petlibro-capsule-dog-fountain

Datei: src/content/products/petlibro-capsule-dog-fountain.md

SHA-256: faa8576e3b59adf8a2f7603ec87e065f16379936e51dcf568cbab74a9b49ea30

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 59e7d07737ae263debc97b0c0fcac1c303493cb21e4fc4ab23edbc1d7f0203c1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "2,1 Gallonen, etwa 7,95 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „2,1 Gallonen, etwa 7,95 Liter“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 2,1 Gallonen, etwa 7,95 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"2,1 Gallonen, etwa 7,95 Liter"}]

#### Hinweis 2

- Fingerabdruck: 10c0ccf4834e6f9007863e8eac53a659279a1778921822761311c35d2a0385dc
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "USB 5 V/1 A, Kabel etwa 2 m"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: USB 5 V/1 A, Kabel etwa 2 m“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"USB 5 V/1 A, Kabel etwa 2 m"}]

#### Hinweis 3

- Fingerabdruck: deff6d13661470b17a57107855ea594a2d01614a0522b0ad431f396e5d44deeb
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Lautstärke"
- Original Wert: "Herstellerangabe 28 dB"
- Original Konsequenz: "Geräusche können bei schreckhaften Tieren und in Schlafräumen kaufentscheidend sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"Herstellerangabe 28 dB"}]

#### Hinweis 4

- Fingerabdruck: 770b5bb7891657773d76541dcbd5bf759cd5e4f8501b59f7dc1714b4fe25ea50
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Filter"
- Original Wert: "fünfstufig"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"fünfstufig"}]

#### Hinweis 5

- Fingerabdruck: 69c9abc469f0dcbde0ba5b530fd9e3ee90255142295480a2e762bc0512f7913d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Filterwechsel"
- Original Wert: "Herstellerempfehlung etwa alle zwei Wochen"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"Herstellerempfehlung etwa alle zwei Wochen"}]

#### Hinweis 6

- Fingerabdruck: cb0a1993e5695ab880f4faab68f510edde6c88ba6a3a6cc5ee40fb65d1538a5c
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Trockenlaufschutz"
- Original Wert: "automatische Abschaltung bei zu niedrigem Wasserstand"
- Original Konsequenz: "Die Schutzklasse ist bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Trockenlaufschutz: automatische Abschaltung bei zu niedrigem Wasserstand“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"automatische Abschaltung bei zu niedrigem Wasserstand"}]

### petlibro-dockstream-2-smart-cordless

Datei: src/content/products/petlibro-dockstream-2-smart-cordless.md

SHA-256: 16e530097f0c125a6afd9788f84c857b92c0a48a4bb12ccb091a5e5b5a58736c

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 0c4b956f94f22f3f7b5c77598c4e08b29ac38c0d8d95e5d1ff3b0d31f8568489
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "3 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."
- WRONG_DECISION_CONTEXT: Der Wasserinhalt „3 Liter“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 3 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"3 Liter"}]

#### Hinweis 2

- Fingerabdruck: 913b4d81b4599f337372bc55863b83f6eac8d58154885581def6db4c70409a21
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Material"
- Original Wert: "ABS-Kunststoff und Edelstahl"
- Original Konsequenz: "Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"ABS-Kunststoff und Edelstahl"}]

#### Hinweis 3

- Fingerabdruck: 64326668f5dc8146b65f79f5abc783b3b79577805a36b1c2a871803066831fc3
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Abmessungen"
- Original Wert: "246 × 200 × 198 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Abmessungen: 246 × 200 × 198 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"246 × 200 × 198 mm"}]

#### Hinweis 4

- Fingerabdruck: 2b97feb1d01289eb74c36d22deac5554cfebd1bbbb33e31dba9c4cbc5b3dd525
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "1,89 kg"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: 1,89 kg“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"1,89 kg"}]

#### Hinweis 5

- Fingerabdruck: 5b996ab7f96e9481c46997756528019eea879d7cefc8c4cb5c48555ace309d0d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkukapazität"
- Original Wert: "5200 mAh"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 1 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.0.consequence: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."
- WRONG_DECISION_CONTEXT: Der Wasserinhalt „5200 mAh“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.4.label: "Akkukapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkukapazität: 5200 mAh“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"5200 mAh"}]

#### Hinweis 6

- Fingerabdruck: 73fb38749b4a2df6520273a3550841615364092b822cbc73bad00633310a908d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkulaufzeit"
- Original Wert: "laut Hersteller bis zu 30 Tage bei einer Katze, 30 Sitzungen täglich und je 45 Sekunden"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkulaufzeit: laut Hersteller bis zu 30 Tage bei einer Katze, 30 Sitzungen täglich und je 45 Sekunden“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"laut Hersteller bis zu 30 Tage bei einer Katze, 30 Sitzungen täglich und je 45 Sekunden"}]

### petlibro-dockstream-2-smart

Datei: src/content/products/petlibro-dockstream-2-smart.md

SHA-256: f50a383aba16e85bf95526eeb4d5a3e39d8eb9011df073a287aef5222002ba09

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 0c4b956f94f22f3f7b5c77598c4e08b29ac38c0d8d95e5d1ff3b0d31f8568489
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "3 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „3 Liter“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 3 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"3 Liter"}]

#### Hinweis 2

- Fingerabdruck: 913b4d81b4599f337372bc55863b83f6eac8d58154885581def6db4c70409a21
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Material"
- Original Wert: "ABS-Kunststoff und Edelstahl"
- Original Konsequenz: "Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"ABS-Kunststoff und Edelstahl"}]

#### Hinweis 3

- Fingerabdruck: 64326668f5dc8146b65f79f5abc783b3b79577805a36b1c2a871803066831fc3
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Abmessungen"
- Original Wert: "246 × 200 × 198 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Abmessungen: 246 × 200 × 198 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"246 × 200 × 198 mm"}]

#### Hinweis 4

- Fingerabdruck: 34cabb01fa3b942bbbbdd062cdbf8e5c6302722190b3b5faf96d9111b0fe442a
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "etwa 1,77 kg"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: etwa 1,77 kg“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"etwa 1,77 kg"}]

#### Hinweis 5

- Fingerabdruck: 9fb98677e13c791356ce4969bb255ba180db50de69804133692f0b7a8bbac8a8
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "ausschließlich Netzbetrieb"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: ausschließlich Netzbetrieb“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"ausschließlich Netzbetrieb"}]

#### Hinweis 6

- Fingerabdruck: e0eeb355f90d6eabe258719529bfcd4bc2fcd0b736b879ecc2a00e852a196063
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akku"
- Original Wert: "Nein"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akku: Nein“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Nein"}]

### petlibro-dockstream-cordless

Datei: src/content/products/petlibro-dockstream-cordless.md

SHA-256: 2cc0dc85497273a30a5585d09d2e7fb71292fb6546cc141a94b7c7c4fbf2ea9d

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 25a3ce83537e4c6d8171a8aed3ffade65aa2fa7697504ae1e21a1caf5e94cd2c
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "2,5 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „2,5 Liter“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 2,5 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"2,5 Liter"}]

#### Hinweis 2

- Fingerabdruck: f56bda15a00a8ac0b596639657a8fe5103430d510d2bd43c0d1587025b8c8ca0
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netz- und Akkubetrieb"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3, 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netz- und Akkubetrieb“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"Netz- und Akkubetrieb"}]

#### Hinweis 3

- Fingerabdruck: 2ec6b5f9c8c304e8989745003c7af68ecf81fb09fc7e9782213a721fb67e208d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akku"
- Original Wert: "5000 mAh"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 2, 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.1.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akku: 5000 mAh“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"5000 mAh"}]

#### Hinweis 4

- Fingerabdruck: cc2c85d2f8bd5cbe3e8d177bcd29efff4f6b010d84af5aeaafa0f7c621db182c
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkulaufzeit"
- Original Wert: "Herstellerangabe bis 30 Tage"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 2, 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.1.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkulaufzeit: Herstellerangabe bis 30 Tage“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Herstellerangabe bis 30 Tage"}]

#### Hinweis 5

- Fingerabdruck: 66162d289cc8f9545473c116026246372aa43a154fe80ba2f8bd66232a7ebfa1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Nein"}]

#### Hinweis 6

- Fingerabdruck: 37ac6428c4e5c78809fd02e800b833eccee9d68b657e4d847e68f622c740ce79
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Lautstärke"
- Original Wert: "Herstellerangabe 23 dB"
- Original Konsequenz: "Geräusche können bei schreckhaften Tieren und in Schlafräumen kaufentscheidend sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"Herstellerangabe 23 dB"}]

### petlibro-dockstream-rfid-smart

Datei: src/content/products/petlibro-dockstream-rfid-smart.md

SHA-256: d9a2b5c1d1d6e596d1cb9515f5809e01922902ff50593c8d1afa093ff1f79163

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 0c4b956f94f22f3f7b5c77598c4e08b29ac38c0d8d95e5d1ff3b0d31f8568489
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "3 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „3 Liter“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 3 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"3 Liter"}]

#### Hinweis 2

- Fingerabdruck: cd367444d6312b21181aab7aea01bfdaad83f7326bb29508c964f2864fe17d35
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Material"
- Original Wert: "ABS und Edelstahl"
- Original Konsequenz: "Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"ABS und Edelstahl"}]

#### Hinweis 3

- Fingerabdruck: 27fe6397d17c98ec4bc1ff35a846b004372c26960f17bc379005388582570ea5
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "PETLIBRO-App"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"PETLIBRO-App"}]

#### Hinweis 4

- Fingerabdruck: 00be8bbecbceee0be358b9cd048e80cada4d960dcc7d6ee81bb35e93dd4a46ec
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "kabelgebunden, 5 V/1 A"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: kabelgebunden, 5 V/1 A“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"kabelgebunden, 5 V/1 A"}]

#### Hinweis 5

- Fingerabdruck: 37ac6428c4e5c78809fd02e800b833eccee9d68b657e4d847e68f622c740ce79
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Lautstärke"
- Original Wert: "Herstellerangabe 23 dB"
- Original Konsequenz: "Geräusche können bei schreckhaften Tieren und in Schlafräumen kaufentscheidend sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"Herstellerangabe 23 dB"}]

#### Hinweis 6

- Fingerabdruck: 8c860f394c503d11e8915032445f504c23e421e290e7c50497fc19c5e7ee5320
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Filter"
- Original Wert: "mehrstufig"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"mehrstufig"}]

### petlibro-glacier-ultrafiltration

Datei: src/content/products/petlibro-glacier-ultrafiltration.md

SHA-256: b70263cdb6f8044de65e3c1c069a8aacd84b64b78b1b62e29ed82ccee26c4960

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 25a3ce83537e4c6d8171a8aed3ffade65aa2fa7697504ae1e21a1caf5e94cd2c
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "2,5 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „2,5 Liter“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 2,5 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"2,5 Liter"}]

#### Hinweis 2

- Fingerabdruck: 1c4eb2ef154c72d8488f9d51902b99a149ee25dc6e30cbd376ff28676046fb3f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Material"
- Original Wert: "SUS 304 Edelstahl"
- Original Konsequenz: "Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"SUS 304 Edelstahl"}]

#### Hinweis 3

- Fingerabdruck: b973d3c43aaf6078c2b78fa81be6e37ff171848b9e4fd3dad7af0aee30b0ea4f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzbetrieb"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzbetrieb“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"Netzbetrieb"}]

#### Hinweis 4

- Fingerabdruck: 66162d289cc8f9545473c116026246372aa43a154fe80ba2f8bd66232a7ebfa1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Nein"}]

#### Hinweis 5

- Fingerabdruck: 226ac4b1cdb6fc839d796ec19e83639903e4176b643ef81e3586a25f101eb357
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Filter"
- Original Wert: "Ultrafiltrationsmodul"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Ultrafiltrationsmodul"}]

#### Hinweis 6

- Fingerabdruck: ba7afef38c6915a8d186b99ba5ffa0cd6dbd351b4bac6808d035c0d21f0d0bbd
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Abmessungen"
- Original Wert: "265 × 220 × 167 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Abmessungen: 265 × 220 × 167 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"265 × 220 × 167 mm"}]

### petlibro-granary-2-vision

Datei: src/content/products/petlibro-granary-2-vision.md

SHA-256: 2f1c1e2bc8a0ab24b8a234f8db8ec1512fb685a12cfe4a06cea33c4463345e4b

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 91c01f8f591399fdac941702e6fc2ff663974f4594fe5876c732a2c616bb53c4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "5 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 5 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"5 Liter"}]

#### Hinweis 2

- Fingerabdruck: fec6d62045886ebfb36153ff789689413d12ee2c5dc55a10d2025a3b999673f3
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "Geplante Mahlzeiten und Smart Refill; ausgegebene und verbleibende Futtermenge werden laut Hersteller über die integrierte Waage erfasst"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Geplante Mahlzeiten und Smart Refill; ausgegebene und verbleibende Futtermenge werden laut Hersteller über die integrierte Waage erfasst"}]

#### Hinweis 3

- Fingerabdruck: c7e2b424dbe00144e4cbfc4f33a45ad93c6a79b7954344a64e049b0aee73c0f4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Krokettengröße"
- Original Wert: "2 bis 18 mm; keine übergroßen oder unregelmäßigen Formen"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."
- WRONG_DECISION_CONTEXT: Die Krokettengröße „2 bis 18 mm; keine übergroßen oder unregelmäßigen Formen“ wird mit Stellplatz oder Körpergröße begründet; das sind andere Größen als die zulässigen Futterabmessungen.
  - Vorhandene Evidenz category: {"key":"futterautomaten","label":"Futterautomaten","path":"/smarte-futterautomaten/"}
  - Vorhandene Evidenz decisionFacts.2.label: "Krokettengröße"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Krokettengröße: 2 bis 18 mm; keine übergroßen oder unregelmäßigen Formen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"2 bis 18 mm; keine übergroßen oder unregelmäßigen Formen"}]

#### Hinweis 4

- Fingerabdruck: f5031ed81c0cf1da5464d7a3782abc3b9f46967c2ebeb13639cb94aa4138002f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzbetrieb und wiederaufladbarer Akku"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzbetrieb und wiederaufladbarer Akku“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.15.value","value":"Netzbetrieb und wiederaufladbarer Akku"}]

#### Hinweis 5

- Fingerabdruck: aaa764d31a625319a8e063387a6acfc07cb458cbe926522a490efe0064569a1e
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Material"
- Original Wert: "Gehäuse aus BPA-freiem ABS und Silikon; Edelstahlnapf"
- Original Konsequenz: "Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.17.value","value":"Gehäuse aus BPA-freiem ABS und Silikon; Edelstahlnapf"}]

#### Hinweis 6

- Fingerabdruck: 6999ab68d535ce8fdef181806db3a722862ba891bf447810491691bb051dce79
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Abmessungen"
- Original Wert: "357 × 180 × 356 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Abmessungen: 357 × 180 × 356 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.18.value","value":"357 × 180 × 356 mm"}]

### petlibro-granary-camera-feeder

Datei: src/content/products/petlibro-granary-camera-feeder.md

SHA-256: 223688fd87ad07dfd6e0b0d8f0e47a24f0dabb97cca2d29617fbd32da2a75fc9

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 91c01f8f591399fdac941702e6fc2ff663974f4594fe5876c732a2c616bb53c4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "5 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 5 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"5 Liter"}]

#### Hinweis 2

- Fingerabdruck: 27fe6397d17c98ec4bc1ff35a846b004372c26960f17bc379005388582570ea5
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "App"
- Original Wert: "PETLIBRO-App"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"PETLIBRO-App"}]

#### Hinweis 3

- Fingerabdruck: 97ce03329bf1271c26abf8b86f95d8c41b74f3b114dadb047f5660d0aeac0b71
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "WLAN"
- Original Wert: "WLAN-Verbindung erforderlich"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 2 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.1.consequence: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"WLAN-Verbindung erforderlich"}]

#### Hinweis 4

- Fingerabdruck: 0b82e8ca89efd32a9de6ec5575dd5221bd88041a936abda9d78ba4a87c560063
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzbetrieb mit Batterie-Backup"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzbetrieb mit Batterie-Backup“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"Netzbetrieb mit Batterie-Backup"}]

#### Hinweis 5

- Fingerabdruck: 3d69852c43602c14abd8103169f61d6e0f06e9aa385c6b507eee24f0a28c1feb
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Batterie"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Batterie: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"Nicht vom Hersteller ausgewiesen"}]

#### Hinweis 6

- Fingerabdruck: 34fc96e20b6e243956e06feef3494ecf22be3221ecd1a4dc8ec0f6b03de96e38
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.13.value","value":"Nicht vom Hersteller ausgewiesen"}]

### petlibro-granary-dual-feeder

Datei: src/content/products/petlibro-granary-dual-feeder.md

SHA-256: 6eaa45b0058961806ecde3d2f7979c3ee3f58a38e162bbafa921de19f6acc8ca

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: c43062cca4d10a78ff683a6e02b3bf630a62c4702030254f45ce2e3eae4f3ca4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Krokettengröße"
- Original Wert: "2 bis 15 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."
- WRONG_DECISION_CONTEXT: Die Krokettengröße „2 bis 15 mm“ wird mit Stellplatz oder Körpergröße begründet; das sind andere Größen als die zulässigen Futterabmessungen.
  - Vorhandene Evidenz category: {"key":"futterautomaten","label":"Futterautomaten","path":"/smarte-futterautomaten/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Krokettengröße"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Krokettengröße: 2 bis 15 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"2 bis 15 mm"}]

#### Hinweis 2

- Fingerabdruck: 91c01f8f591399fdac941702e6fc2ff663974f4594fe5876c732a2c616bb53c4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "5 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 5 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"5 Liter"}]

#### Hinweis 3

- Fingerabdruck: 0d95d28d72798e5bf5e51b8044d9970d3feeee73ebea32f25fc4def7d3b2e584
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "1 bis 50 Portionen je Mahlzeit"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"1 bis 50 Portionen je Mahlzeit"}]

#### Hinweis 4

- Fingerabdruck: d897d3d8d11c7bfcd4553a228f726e9e183fe6f428aa4a9542d6b84c93fb69e3
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Portionsgröße"
- Original Wert: "20 ml, ungefähr 10 g"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 1 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.0.consequence: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Portionsgröße: 20 ml, ungefähr 10 g“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"20 ml, ungefähr 10 g"}]

#### Hinweis 5

- Fingerabdruck: 27fe6397d17c98ec4bc1ff35a846b004372c26960f17bc379005388582570ea5
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "PETLIBRO-App"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"PETLIBRO-App"}]

#### Hinweis 6

- Fingerabdruck: 8054b81b86b4bfbb17b02af37026c9a96672492cba002acdf9a3fb9b29ac6298
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzadapter und drei D-Batterien"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzadapter und drei D-Batterien“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"Netzadapter und drei D-Batterien"}]

### petlibro-granary-wifi-feeder

Datei: src/content/products/petlibro-granary-wifi-feeder.md

SHA-256: 9408e36edc521ad74be808ec35fc8b5ee290994acc32fac6725a829d1816c80a

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: c43062cca4d10a78ff683a6e02b3bf630a62c4702030254f45ce2e3eae4f3ca4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Krokettengröße"
- Original Wert: "2 bis 15 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."
- WRONG_DECISION_CONTEXT: Die Krokettengröße „2 bis 15 mm“ wird mit Stellplatz oder Körpergröße begründet; das sind andere Größen als die zulässigen Futterabmessungen.
  - Vorhandene Evidenz category: {"key":"futterautomaten","label":"Futterautomaten","path":"/smarte-futterautomaten/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Krokettengröße"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Krokettengröße: 2 bis 15 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"2 bis 15 mm"}]

#### Hinweis 2

- Fingerabdruck: 91c01f8f591399fdac941702e6fc2ff663974f4594fe5876c732a2c616bb53c4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "5 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 5 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"5 Liter"}]

#### Hinweis 3

- Fingerabdruck: 505be18b950e478234e9b0e15abf68841b8c8c77cd4e3585298169393e699c6d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "1 bis 50 Portionen pro Mahlzeit"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"1 bis 50 Portionen pro Mahlzeit"}]

#### Hinweis 4

- Fingerabdruck: e522777f88a3a55c1e4eb2e316687930dc710ac228eaf9bb2d68a15e4cc07bc7
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Portionsgröße"
- Original Wert: "20 ml, laut Hersteller ungefähr 10 g"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 1 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.0.consequence: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Portionsgröße: 20 ml, laut Hersteller ungefähr 10 g“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"20 ml, laut Hersteller ungefähr 10 g"}]

#### Hinweis 5

- Fingerabdruck: 27fe6397d17c98ec4bc1ff35a846b004372c26960f17bc379005388582570ea5
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "PETLIBRO-App"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"PETLIBRO-App"}]

#### Hinweis 6

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"Nein"}]

### petlibro-one-rfid-smart-feeder

Datei: src/content/products/petlibro-one-rfid-smart-feeder.md

SHA-256: e5bafcd6b6728ec826ea629768fc79fc5a2f4594232c1be98189656189e27be8

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: ceabd4135da3493c315948ed4d69c382151b078d4dd161048d9f680f75cb7fd7
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App-Steuerung"
- Original Wert: "Ja"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"Ja"}]

#### Hinweis 2

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"Nein"}]

#### Hinweis 3

- Fingerabdruck: 0c4b956f94f22f3f7b5c77598c4e08b29ac38c0d8d95e5d1ff3b0d31f8568489
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "3 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 3 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"3 Liter"}]

#### Hinweis 4

- Fingerabdruck: 07250b0f15411d8c42e8990abe1291b33040fc39eab4f8ce4e484b1049f6cfde
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "Bis zu 10 Mahlzeiten täglich"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"Bis zu 10 Mahlzeiten täglich"}]

#### Hinweis 5

- Fingerabdruck: a48d1ad2352c034463f02a35d140970c81e5975447bf491e7d201db95614061f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzteil mit Batterie-Backup"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzteil mit Batterie-Backup“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Netzteil mit Batterie-Backup"}]

#### Hinweis 6

- Fingerabdruck: 3d69852c43602c14abd8103169f61d6e0f06e9aa385c6b507eee24f0a28c1feb
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Batterie"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Batterie: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"Nicht vom Hersteller ausgewiesen"}]

### petlibro-polar-wet-food-feeder

Datei: src/content/products/petlibro-polar-wet-food-feeder.md

SHA-256: 1d41105b3523665ff8209757907ed8a310199e4290ca7dfe68a231b08f9d27c7

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 50815e6d64950990e90bcd8b41ec95c5f269459d9d67d8d6f0ebd333b5931139
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "Drei zeitgesteuerte Fächer mit je 200 ml"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.0.value","value":"Drei zeitgesteuerte Fächer mit je 200 ml"}]

#### Hinweis 2

- Fingerabdruck: d906ca49bffab48c8b7d5cd63759bbb2e80995f709f702b311c8395fb64c59d5
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "drei Fächer mit je 200 ml"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: drei Fächer mit je 200 ml“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"drei Fächer mit je 200 ml"}]

#### Hinweis 3

- Fingerabdruck: 7889a3afd8a2e6b7bb76782f04b83119e4641365dc3441945f4bf44665dd997b
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "PETLIBRO-App für Android und iOS 13 oder neuer"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"PETLIBRO-App für Android und iOS 13 oder neuer"},{"path":"comparisonFilters.app","value":true}]

#### Hinweis 4

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"Nein"},{"path":"comparisonFilters.camera","value":false}]

#### Hinweis 5

- Fingerabdruck: c95a7e257a3a1f8beef579031c970a2da5dfb61c582b56592848c4ade694853c
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzteil 12 V/5 A"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzteil 12 V/5 A“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.12.value","value":"Netzteil 12 V/5 A"}]

#### Hinweis 6

- Fingerabdruck: 32a1d9a2a38282189dcbd7a9abc4eedb2552f6bd36ade76c05f9ff3427b11dc2
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Batterie-Backup"
- Original Wert: "drei AA-Batterien; laut Hersteller bis zu 12 Stunden Schutz des Fütterungsplans"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- VALUE_REQUIRES_COMPARISON: Abweichender Originalwortlaut: redaktionell „drei AA-Batterien; laut Hersteller bis zu 12 Stunden Schutz des Fütterungsplans“, technisch „drei AA-Batterien; laut Hersteller läuft der Fütterungsplan bei Stromausfall bis zu 12 Stunden weiter“. Dies allein belegt keinen sachlichen Widerspruch.
  - Vorhandene Evidenz specs.13.value: "drei AA-Batterien; laut Hersteller läuft der Fütterungsplan bei Stromausfall bis zu 12 Stunden weiter"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Batterie-Backup: drei AA-Batterien; laut Hersteller bis zu 12 Stunden Schutz des Fütterungsplans“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.13.value","value":"drei AA-Batterien; laut Hersteller läuft der Fütterungsplan bei Stromausfall bis zu 12 Stunden weiter"}]

### petlibro-space-smart-feeder

Datei: src/content/products/petlibro-space-smart-feeder.md

SHA-256: e083054ff56f426bdb1a26784e3177cbaa7472eb9c5134c53ee1d99f204121ac

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: b01dc97208dc2920cab8073feb8ea5d30a69e841f42a6f24b9f28c23693f5330
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Portionierung"
- Original Wert: "Volumetrisch; etwa 20 ml je Einheit, bis zu 50 Einheiten pro Mahlzeit"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4, 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."
  - Vorhandene Evidenz decisionFacts.4.consequence: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

Technische Vergleichsdaten: [{"path":"specs.0.value","value":"Volumetrisch; etwa 20 ml je Einheit, bis zu 50 Einheiten pro Mahlzeit"}]

#### Hinweis 2

- Fingerabdruck: 60c09ed5ec5b957b9ee65e3bba4065408a957efb468970ff2dc061f258bc07ff
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "8 Liter laut PLAF107-Handbuch"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 8 Liter laut PLAF107-Handbuch“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"8 Liter laut PLAF107-Handbuch"}]

#### Hinweis 3

- Fingerabdruck: d4248bde84e00a4a8487a5341ad6383fe4995918c6575f8e47c61c7f332a06bb
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Krokettengröße"
- Original Wert: "2 bis 18 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Die Krokettengröße „2 bis 18 mm“ wird mit Stellplatz oder Körpergröße begründet; das sind andere Größen als die zulässigen Futterabmessungen.
  - Vorhandene Evidenz category: {"key":"futterautomaten","label":"Futterautomaten","path":"/smarte-futterautomaten/"}
  - Vorhandene Evidenz decisionFacts.2.label: "Krokettengröße"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Krokettengröße: 2 bis 18 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"2 bis 18 mm"}]

#### Hinweis 4

- Fingerabdruck: a2cb5fc7199d2e037213eb13d7d9ec4948b9dfc582ae54e42d31b5ae758d11d0
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Portionseinheit"
- Original Wert: "ca. 20 ml je Portion"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 1, 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.0.consequence: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."
  - Vorhandene Evidenz decisionFacts.4.consequence: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"ca. 20 ml je Portion"}]

#### Hinweis 5

- Fingerabdruck: 55f163f389e80fe5e83094c9fec88589f162119a7ff76e3dd7a1128213e6705b
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Maximale Portionszahl"
- Original Wert: "bis zu 50 Portionen je Mahlzeit"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 1, 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.0.consequence: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."
  - Vorhandene Evidenz decisionFacts.3.consequence: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"bis zu 50 Portionen je Mahlzeit"}]

#### Hinweis 6

- Fingerabdruck: 3f57c75c5ada54ef16af45055b0d06a94812ba374ae5616a7f6fb9248565fec2
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Portionsgewicht"
- Original Wert: "herstellerseitig ungefähr 10 g, abhängig von Form und Dichte des Futters"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Portionsgewicht: herstellerseitig ungefähr 10 g, abhängig von Form und Dichte des Futters“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"herstellerseitig ungefähr 10 g, abhängig von Form und Dichte des Futters"}]

### petlibro-stainless-steel-fountain

Datei: src/content/products/petlibro-stainless-steel-fountain.md

SHA-256: 2508629762699c99168693ca15f91e403c304f20ab12786c897d4fcfeafa145c

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 0c4b956f94f22f3f7b5c77598c4e08b29ac38c0d8d95e5d1ff3b0d31f8568489
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "3 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „3 Liter“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 3 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"3 Liter"}]

#### Hinweis 2

- Fingerabdruck: 610b447a78b8e7e09ab53b36a8fd9169cac6e7cc547562ebb2f5d161a9c5de43
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Material"
- Original Wert: "Tank aus Edelstahl 304, Auslauf aus Polypropylen"
- Original Konsequenz: "Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"Tank aus Edelstahl 304, Auslauf aus Polypropylen"}]

#### Hinweis 3

- Fingerabdruck: 4ac3694276de4a78d0548cdc5331f758af7b070bff5b024c5e72563ff54d9ffb
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzbetrieb, Ausgang 5 V/1 A"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzbetrieb, Ausgang 5 V/1 A“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"Netzbetrieb, Ausgang 5 V/1 A"}]

#### Hinweis 4

- Fingerabdruck: 66162d289cc8f9545473c116026246372aa43a154fe80ba2f8bd66232a7ebfa1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"Nein"}]

#### Hinweis 5

- Fingerabdruck: e55479b0795489210cf4f2f237f018743248bdc98b5638b23e47a7ae7d0a50ed
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Lautstärke"
- Original Wert: "Herstellerangabe bis 30 dB"
- Original Konsequenz: "Geräusche können bei schreckhaften Tieren und in Schlafräumen kaufentscheidend sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"Herstellerangabe bis 30 dB"}]

#### Hinweis 6

- Fingerabdruck: 545d03465b7f5d95c08de9b481136e8d20f0bbf60f0bc1e322cef7a34c538e7b
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Filter"
- Original Wert: "dreistufig"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"dreistufig"}]

### petsafe-freshfeed-refrigerated-feeder

Datei: src/content/products/petsafe-freshfeed-refrigerated-feeder.md

SHA-256: 242d1406bfda74be078c0407c8384b26621d665481da2a45d82e87d9470ade13

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: e46108acfe63f931bc5cb76cb8339e52127bb2d60f44db9038b2acfdafc6f256
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "4,5 Cups gesamt; bis 5 fl oz je Fach"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 4,5 Cups gesamt; bis 5 fl oz je Fach“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"4,5 Cups gesamt; bis 5 fl oz je Fach"}]

#### Hinweis 2

- Fingerabdruck: a00222cf4392b402cdd71e9f28c3d944697fe10e67894a28a970ea694e6d86c5
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzteil"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzteil“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Netzteil"}]

#### Hinweis 3

- Fingerabdruck: 3d69852c43602c14abd8103169f61d6e0f06e9aa385c6b507eee24f0a28c1feb
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Batterie"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 2 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.1.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Batterie: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"Nicht vom Hersteller ausgewiesen"}]

#### Hinweis 4

- Fingerabdruck: 34fc96e20b6e243956e06feef3494ecf22be3221ecd1a4dc8ec0f6b03de96e38
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.13.value","value":"Nicht vom Hersteller ausgewiesen"}]

### petsafe-healthy-pet-simply-feed

Datei: src/content/products/petsafe-healthy-pet-simply-feed.md

SHA-256: e9faf98d5c27970cf911894845573e45bf22ffdd0f9cc31dbdb8230c0c67964a

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: d6e52dda8eb61dab12e0156d31a0f620fe93e133b078195b987ad52a4942dbf2
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "24 Cups / etwa 5,7 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 24 Cups / etwa 5,7 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"24 Cups / etwa 5,7 Liter"}]

#### Hinweis 2

- Fingerabdruck: b872d639d7debac3f31f55af77a4b830c6266e59b118c4ea4e240ba5c25683d7
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Krokettengröße"
- Original Wert: "Bis 3/4 Zoll / etwa 19 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Die Krokettengröße „Bis 3/4 Zoll / etwa 19 mm“ wird mit Stellplatz oder Körpergröße begründet; das sind andere Größen als die zulässigen Futterabmessungen.
  - Vorhandene Evidenz category: {"key":"futterautomaten","label":"Futterautomaten","path":"/smarte-futterautomaten/"}
  - Vorhandene Evidenz decisionFacts.1.label: "Krokettengröße"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Krokettengröße: Bis 3/4 Zoll / etwa 19 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"Bis 3/4 Zoll / etwa 19 mm"}]

#### Hinweis 3

- Fingerabdruck: e9e0abc8c50c5d780f8f98e0b8a6cd51de6bb56e5800bec27c24608eae451ea9
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "1/8 bis 4 Cups"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"1/8 bis 4 Cups"}]

#### Hinweis 4

- Fingerabdruck: 35b97ef4e52bd1a6694fc877c5bc5637710415efc4720ca16c513fbebfc395f8
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "4 D-Batterien; Netzadapter optional"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: 4 D-Batterien; Netzadapter optional“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"4 D-Batterien; Netzadapter optional"}]

#### Hinweis 5

- Fingerabdruck: 825d257751b0858ec45f7310ee2c19d99ab105f50504c0c9bd8e89d675ef980a
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "App-Steuerung"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"Nein"}]

#### Hinweis 6

- Fingerabdruck: 0dbe3dd9d9a460181f6088bf2c13b3e8a8002217786c502d96d822b1d59bb2ac
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "WLAN"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

Technische Vergleichsdaten: [{"path":"specs.13.value","value":"Nein"}]

### petsafe-petporte-smart-flap

Datei: src/content/products/petsafe-petporte-smart-flap.md

SHA-256: faa67f6b57fc187a3f718257d2e6d89631e600e6a9501dfb8bf8f0194cc13efb

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: b9404bb167a4232e31b56e6920d768dd1b3955f5d4cb328476bc7dbced86ce0f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Durchgang"
- Original Wert: "160 × 160 mm"
- Original Konsequenz: "Der größere Durchgang kann kräftigeren Katzen entgegenkommen. Entscheidend bleibt der Abgleich mit der maximal angegebenen Schulterbreite von 150 mm."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 2

- Fingerabdruck: 19e948133ca3341a1e13d14b9113ae1b78c4183fc30f177e7e288fa625d7b2af
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Netzbetrieb"
- Original Wert: "EU-Netzteil enthalten"
- Original Konsequenz: "Regelmäßige Batteriewechsel entfallen. Dafür müssen Steckdose und ein dauerhaft sicherer Kabelweg am Einbauort vorhanden sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 3

- Fingerabdruck: 5dde5dfb2e0a523c8a27473cafc9689c1b725c39a49780a2006f442303144e44
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Speicher"
- Original Wert: "Bis zu 25 Katzen"
- Original Konsequenz: "Die Kapazität reicht auch für große Mehrkatzenhaushalte, die Zugangsregel gilt jedoch nicht als individuelles Ausgangsprofil pro Tier."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Bis zu 25 Katzen"}]

#### Hinweis 4

- Fingerabdruck: 348db72f0e1919e9bc303c5f88905c43a68658b8f81ed95a06559b3b659ae667
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Chipgrenzen"
- Original Wert: "Nicht jedes Nummernformat kompatibel"
- Original Konsequenz: "PetSafe schließt Chips mit 10 Ziffern oder Buchstaben sowie Chips aus, die mit 977xxxxxxxxxxxx oder 98514xxxxxxxxxx beginnen. Die Chipnummer sollte vor dem Kauf geprüft werden."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 5

- Fingerabdruck: 48fd55373057c65aa02f7574809cd10681e79263f6152a80b5be808966ba3893
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Metalltür"
- Original Wert: "Funktionstest vor dem Ausschnitt"
- Original Konsequenz: "Metall kann den RFID-Leser stören. PetSafe empfiehlt, die montierte und programmierte Klappe am geplanten Einbauort zu testen, bevor die Tür ausgeschnitten wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 6

- Fingerabdruck: c17f2332ce2ae1ae5f0a7a2337728edda97a3df60cdcd7e46d0c61a5450618f4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Nachtmodus"
- Original Wert: "Optional"
- Original Konsequenz: "Die Katze kann nachts im Haus gehalten werden, ohne dass dafür eine App oder Cloud-Verbindung nötig ist."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"Optional"}]

#### Hinweis 7

- Fingerabdruck: 44f6c211442bd7e05d0b76df3cb0410549ec258e9f158092b5209e4efce445ac
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Systemabhängigkeit"
- Original Wert: "Lokal ohne App oder Hub"
- Original Konsequenz: "Die Kernfunktion hängt nicht von WLAN, Smartphone-App, Benutzerkonto oder Cloud-Dienst ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

### petsafe-smart-feed-2

Datei: src/content/products/petsafe-smart-feed-2.md

SHA-256: b18eef7297a798b235c7ad46263267a2e708f1a5d6084f6bf90f833f2b69c027

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: d6e52dda8eb61dab12e0156d31a0f620fe93e133b078195b987ad52a4942dbf2
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "24 Cups / etwa 5,7 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 24 Cups / etwa 5,7 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"24 Cups / etwa 5,7 Liter"}]

#### Hinweis 2

- Fingerabdruck: 6e7fc7d9cad118843df94305fe6486aca18fac8ca34f11fd91dabf23817003d2
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "1/8 bis 4 Cups je Mahlzeit"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"1/8 bis 4 Cups je Mahlzeit"}]

#### Hinweis 3

- Fingerabdruck: 6df8cb1e384eb31c84259bb15f842c0e2507a2ea728b1a6373d7dbed6a6ebf37
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzadapter; Backup mit 4 D-Batterien"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzadapter; Backup mit 4 D-Batterien“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"Netzadapter; Backup mit 4 D-Batterien"}]

#### Hinweis 4

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"Nein"}]

#### Hinweis 5

- Fingerabdruck: 34fc96e20b6e243956e06feef3494ecf22be3221ecd1a4dc8ec0f6b03de96e38
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.13.value","value":"Nicht vom Hersteller ausgewiesen"}]

### surefeed-microchip-pet-feeder-connect

Datei: src/content/products/surefeed-microchip-pet-feeder-connect.md

SHA-256: 5f7bcc595983271f4dfb75d81baa1e4e6ad2fc6682ac4aa89c5b7e02834ba511

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 96c5ba7287813b7a12e67de19b2460beae5c47817bda39cc73dcac192f1093bf
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Hub und App"
- Original Wert: "Sure Petcare Hub erforderlich"
- Original Konsequenz: "Mikrochipzugang und Portionswaage arbeiten am Gerät; App-Protokolle, Push-Mitteilungen und die Auswertung der Fressgewohnheiten benötigen zusätzlich den mit dem Router verbundenen Hub."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 2

- Fingerabdruck: 07eab1dda0135004be68e577b66265e723fa46471301a4a5b938b7f835499058
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kaufvariante"
- Original Wert: "Einzelgerät oder Bundle"
- Original Konsequenz: "Wer bereits einen kompatiblen Sure Petcare Hub besitzt, kann das Einzelgerät verwenden. Beim ersten Connect-Produkt müssen Bundle oder separater Hub in Preis und Einrichtung eingeplant werden."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 3

- Fingerabdruck: 0a37c324d8c631429cc93c974449043020ea34c63358fac76fce0f50cd740656
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "App-Auswertung"
- Original Wert: "Menge, Häufigkeit, Dauer und Tageszeit"
- Original Konsequenz: "Die App dokumentiert individuelle Fressereignisse und kann Veränderungen sichtbar machen; sie ersetzt keine tierärztliche Bewertung auffälliger Fressmuster."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- VALUE_REQUIRES_COMPARISON: Abweichender Originalwortlaut: redaktionell „Menge, Häufigkeit, Dauer und Tageszeit“, technisch „Fressmenge, Häufigkeit, Dauer und Tageszeiten; Push-Mitteilungen bei Fressereignissen“. Dies allein belegt keinen sachlichen Widerspruch.
  - Vorhandene Evidenz specs.3.value: "Fressmenge, Häufigkeit, Dauer und Tageszeiten; Push-Mitteilungen bei Fressereignissen"

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"Fressmenge, Häufigkeit, Dauer und Tageszeiten; Push-Mitteilungen bei Fressereignissen"}]

#### Hinweis 4

- Fingerabdruck: dbd4455244a02fe09a86e64f1e12f68c3a77020130b3b75511b5f2c88b114bf6
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Portionierung"
- Original Wert: "Auf 1 Gramm genau"
- Original Konsequenz: "Die integrierte Waage und LED-Anzeige helfen beim manuellen Befüllen einer festgelegten Portion; das Gerät gibt Futter nicht zeitgesteuert aus."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- VALUE_REQUIRES_COMPARISON: Abweichender Originalwortlaut: redaktionell „Auf 1 Gramm genau“, technisch „Manuelles Befüllen mit integrierter Waage und LED-Anzeige auf 1 Gramm genau“. Dies allein belegt keinen sachlichen Widerspruch.
  - Vorhandene Evidenz specs.4.value: "Manuelles Befüllen mit integrierter Waage und LED-Anzeige auf 1 Gramm genau"

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"Manuelles Befüllen mit integrierter Waage und LED-Anzeige auf 1 Gramm genau"}]

#### Hinweis 5

- Fingerabdruck: 9a1d3a9e61ff73a7013533ed113945bbc91475c1f577bf03a4e63469fc5b4f5d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Futterart und Volumen"
- Original Wert: "Nass- und Trockenfutter, 400 ml"
- Original Konsequenz: "Der geschützte Napf eignet sich für individuelle Rationen, besitzt aber keinen gekühlten Vorrat und keine automatische Nachfüllung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 6

- Fingerabdruck: f824d8d3d07e21912ba4633c58f769fc5b2aae5c912e2120dad7ad1391fc6a13
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Preis und Verfügbarkeit"
- Original Wert: "Aktuell prüfen"
- Original Konsequenz: "Einzelgerät, Hub und Bundle werden getrennt angeboten. Hersteller- und Händlerbestand können voneinander abweichen; ein dauerhaft statischer Preis wäre deshalb irreführend."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

### surefeed-microchip-pet-feeder

Datei: src/content/products/surefeed-microchip-pet-feeder.md

SHA-256: 6826210375fe6b9282e379fa07dd94045c98edb58ddf032c4a235cd2f875b605

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 780b6c27ef3633bd40e48a3e6a8867169232642333e16133765b1daadc1c77dd
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "400 ml"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 400 ml“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"400 ml"}]

#### Hinweis 2

- Fingerabdruck: 057f3c5a609d8e85cc85b043153c43461df5222f8b289f2ce0adb38c63b2e9b3
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "Nein, Standardversion"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"Nein, Standardversion"}]

#### Hinweis 3

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Nein"}]

#### Hinweis 4

- Fingerabdruck: 8ffe105512742bc8a70c7130f565e7412325d22c3e6e07b025d081bd72bb24dc
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "vier C-Batterien"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: vier C-Batterien“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"vier C-Batterien"}]

#### Hinweis 5

- Fingerabdruck: b98f7e4eded105d477227bbe30ef877c865ff83ef9f022a744f04db4e327ab49
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "manuell eingefüllte Napfportion; keine automatische Dosierung"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"manuell eingefüllte Napfportion; keine automatische Dosierung"}]

#### Hinweis 6

- Fingerabdruck: a97e3363c9138042018601bf6f51d26ca39b2655c7abbe02141154ceb2c54273
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "WLAN"
- Original Wert: "Nein; die Standardversion arbeitet lokal ohne App oder Hub"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- CONSEQUENCE_CONTRADICTS_VALUE: Die Konsequenz behauptet die Funktion, obwohl der eigene redaktionelle Wert „Nein; die Standardversion arbeitet lokal ohne App oder Hub“ sie verneint.
  - Vorhandene Evidenz decisionFacts.5.value: "Nein; die Standardversion arbeitet lokal ohne App oder Hub"

Technische Vergleichsdaten: [{"path":"specs.12.value","value":"Nein; die Standardversion arbeitet lokal ohne App oder Hub"}]

### sureflap-dualscan-mikrochip-katzenklappe

Datei: src/content/products/sureflap-dualscan-mikrochip-katzenklappe.md

SHA-256: d3630b564f35488e0c976c9ed3d12bd6974c4cfe414e1124b1f14784ca3ce101

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 95ad3d4190b428034189f239e979a0031fd54deecb463e00b0d896f945d609ad
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "DualScan-Funktion"
- Original Wert: "Individuelle Ausgangsrechte"
- Original Konsequenz: "Für jedes gespeicherte Tier kann festgelegt werden, ob es das Haus verlassen darf."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 2

- Fingerabdruck: 3f41e38dd485e7dbc73a8584fb8ecfeed9fa872500abb373a00e53a6a99b178f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Sicherheitsmodus"
- Original Wert: "Rückkehr bleibt möglich"
- Original Konsequenz: "Eine als Wohnungskatze konfigurierte Katze kann wieder hinein, falls sie unbeabsichtigt nach draußen gelangt."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 3

- Fingerabdruck: 54eb831d651e9ef6830e757150f3d0db2987e84bf414652416ba34a94695b24f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Systemabhängigkeit"
- Original Wert: "Vollständig lokal"
- Original Konsequenz: "Mikrochip-Erkennung und Verriegelung benötigen weder WLAN noch App, Konto oder Hub."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 4

- Fingerabdruck: ac2bbd57aaffce2485c6733725bbf29f095f28fb7f7dfe3bc539efc08e149435
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Verriegelung und Tailgating"
- Original Wert: "Chipprüfung auf beiden Seiten; kein Anti-Tailgating-Schutz dokumentiert"
- Original Konsequenz: "Die individuellen Richtungsrechte belegen keine mechanische Vereinzelung zweier dicht folgender Tiere."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 5

- Fingerabdruck: 2782f6169419f11a73dfb0207bf83bc3f26d90046518f39f0726bfed93b0101d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Verfügbarkeit"
- Original Wert: "Temporär nicht vorrätig"
- Original Konsequenz: "Das Modell wird weiterhin geführt, war im deutschen Shop zum Prüfzeitpunkt jedoch nicht auf Lager."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

### sureflap-mikrochip-katzenklappe-connect

Datei: src/content/products/sureflap-mikrochip-katzenklappe-connect.md

SHA-256: de701bded47474ae3289afbab3560369494793e7aa513be915f2d1bc69db0607

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 2f1ce1b64794bb138d65c412485c7a0903fb5d0bf471c17b7b8be6180f951570
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Lokale Funktion"
- Original Wert: "Mikrochip-Erkennung an der Klappe"
- Original Konsequenz: "Die grundlegende Zutrittsprüfung findet lokal statt."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 2

- Fingerabdruck: 4ef42947ce1f053c532164d76f4cb4236654d900b6d655b15cda4498e8b83a0f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App-Abhängigkeit"
- Original Wert: "Hub erforderlich"
- Original Konsequenz: "Benachrichtigungen, Fernfunktionen und Aktivitätsdaten benötigen Hub, Netzwerk und Internetverbindung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 3

- Fingerabdruck: 7c37da49b1bb3875557ed37566a1103200eb6d869e00c673f273ee3994fbdd69
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Produktumfang"
- Original Wert: "Gerät, Hub oder Bundle unterscheiden"
- Original Konsequenz: "Vor dem Kauf muss geprüft werden, ob der Hub enthalten, separat vorhanden oder zusätzlich erforderlich ist."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 4

- Fingerabdruck: 8efc5bf670b324006489d58d25ba96e87c96be69d2e16b6e6cc4e7f30df3d698
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Richtungsrechte"
- Original Wert: "Individuell je Tier"
- Original Konsequenz: "Einzelne Katzen können unterschiedliche Ein- und Ausgangsrechte erhalten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 5

- Fingerabdruck: 6abbd9eabb870b86aceb91e6eb8de4a91add16d2151beb8dd5b115c445266287
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Durchgang"
- Original Wert: "142 × 120 mm"
- Original Konsequenz: "Der engste Durchgangspunkt sollte mit dem Körperbau der Katze abgeglichen werden."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 6

- Fingerabdruck: 26006546373175cd57f1388102fdd489e4b7f70dfe4bdd4fcd628b5e7c14bd0b
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Bewertungsstatus"
- Original Wert: "Herstellerdaten"
- Original Konsequenz: "Es liegt kein eigener Praxistest vor; Langzeitzuverlässigkeit wird nicht als eigene Erfahrung bewertet."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 7

- Fingerabdruck: 19e31d93583e2f52161a9c8095e1fe94302ecdb9b2cef87716928ebddd62f748
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Security-Support des Hubs"
- Original Wert: "Zwei Jahre ab Kaufdatum des Hubs dokumentiert"
- Original Konsequenz: "Der Zeitraum beschreibt Sicherheitsupdates für den Hub, nicht die Lebensdauer der Klappe, ein Funktionsende oder eine garantierte Cloud-Laufzeit."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

### sureflap-mikrochip-katzenklappe

Datei: src/content/products/sureflap-mikrochip-katzenklappe.md

SHA-256: 0950770c6c9ae3fd939453353580735ecb550d9e1c0e3de1f231e1a97a96969e

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: d0890622803d90bfc1bcc1828c493dcb29ae85e1e895a08c682cc95dc65e07e4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Zugangslogik"
- Original Wert: "Selektiver Eingang"
- Original Konsequenz: "Gespeicherte Tiere können hinein, fremde Tiere bleiben draußen. Der Ausgang wird nicht individuell über den Mikrochip geregelt."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 2

- Fingerabdruck: 21a85c9c935149ee2b647c2b546fd94b30aa03993aca71c5544dcfb69eadfc14
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Ausgangsrechte"
- Original Wert: "Keine individuellen Regeln"
- Original Konsequenz: "Der manuelle 4-Wege-Verschluss gilt für die Klappe insgesamt. Soll eine einzelne Katze im Haus bleiben, ist die DualScan-Variante die passendere Produktklasse."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 3

- Fingerabdruck: 54eb831d651e9ef6830e757150f3d0db2987e84bf414652416ba34a94695b24f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Systemabhängigkeit"
- Original Wert: "Vollständig lokal"
- Original Konsequenz: "Mikrochip-Erkennung und Verriegelung benötigen weder WLAN noch App, Konto oder Hub."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 4

- Fingerabdruck: 345b19a436820f1ef9b6c88c63ccd3a78330db845dd2446ff35e8c3463d3cc7e
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Durchgang"
- Original Wert: "142 × 120 mm"
- Original Konsequenz: "Das ist der engste Durchgangspunkt. Vor dem Kauf sollte nicht nur das Außenmaß, sondern die tatsächliche Passform an der Katze geprüft werden."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 5

- Fingerabdruck: 26330f751fb243f1e8410a0493f4d1cece916068511b171217c3ac764641bc73
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Batteriebetrieb"
- Original Wert: "4 AA, bis zu 12 Monate"
- Original Konsequenz: "Am Einbauort wird kein Stromanschluss benötigt. Batterien und regelmäßige Kontrolle bleiben Teil des Betriebs."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 6

- Fingerabdruck: 4bad551799924062dc51223c05875dbea7c5051fc2b7c9d63e04dd4ae2192a1d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Einbau"
- Original Wert: "Tür, Glas oder Wand"
- Original Konsequenz: "Tür-/Wandausschnitt, Glasausschnitt und Außenrahmen sind nicht austauschbar. Bei Glas und Wand können Adapter, Tunnelverlängerungen oder ein Fachbetrieb erforderlich sein."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

#### Hinweis 7

- Fingerabdruck: b47b0a6af6f15843170a47f4039110832b44661bf9e94823138bde96a8c90566
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Speicher"
- Original Wert: "Bis zu 32 Tiere"
- Original Konsequenz: "Die hohe Speicherkapazität erlaubt mehrere eigene Tiere, ändert aber nichts daran, dass der Ausgang nicht tierindividuell gesteuert wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- VALUE_REQUIRES_COMPARISON: Abweichender Originalwortlaut: redaktionell „Bis zu 32 Tiere“, technisch „Bis zu 32 Tiere beziehungsweise Mikrochipnummern“. Dies allein belegt keinen sachlichen Widerspruch.
  - Vorhandene Evidenz specs.5.value: "Bis zu 32 Tiere beziehungsweise Mikrochipnummern"

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Bis zu 32 Tiere beziehungsweise Mikrochipnummern"}]

#### Hinweis 8

- Fingerabdruck: 4ba622bf9b96ff28f8d73a4c887e398d11c347d16e89c2cf904edf5f63dc730e
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Verfügbarkeit"
- Original Wert: "Temporär nicht vorrätig"
- Original Konsequenz: "Der Hersteller führt das Modell weiterhin, hatte es zum letzten Prüfzeitpunkt im deutschen Shop aber nicht auf Lager."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: not-verifiable
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

### tractive-cat-6-mini

Datei: src/content/products/tractive-cat-6-mini.md

SHA-256: ca4ce884ae47a7cef0e843ce011d0918574cb44507b0d4cace745964a66bd55e

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 8cfdcb36581da2b4cccd55f156d4c6aa87a84703260d095b30f5a182baccc96e
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Abo"
- Original Wert: "Erforderlich; ein Abo pro Tracker"
- Original Konsequenz: "Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Erforderlich; ein Abo pro Tracker"}]

#### Hinweis 2

- Fingerabdruck: 3246759768118a69d88b30c92831c2accf23a1a404b66d61ddd0ee3c906faf68
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "Tractive GPS App; Android 10 oder neuer, iOS 17 oder neuer"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"Tractive GPS App; Android 10 oder neuer, iOS 17 oder neuer"}]

#### Hinweis 3

- Fingerabdruck: 07c7437b947822abf66501855dc899e74272ad7b13ec8c8a537795347833ff34
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Akkukapazität"
- Original Wert: "450 mAh"
- Original Konsequenz: "Die Kapazität allein bestimmt keine Laufzeit; Live-Ortung und Empfang beeinflussen den Verbrauch."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"450 mAh"}]

#### Hinweis 4

- Fingerabdruck: f86f38d732b68268743a641426565a316f0ca43351281dab625a802ba9d5bae0
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkulaufzeit"
- Original Wert: "Bis zu 7 Tage mit Energiesparzone; bis zu 4 Tage ohne Energiesparzone"
- Original Konsequenz: "Häufige Live-Ortung verkürzt die Laufzeit; vor längeren Ausflügen den Ladestand prüfen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Häufige Live-Ortung verkürzt die Laufzeit; vor längeren Ausflügen den Ladestand prüfen."

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"Bis zu 7 Tage mit Energiesparzone; bis zu 4 Tage ohne Energiesparzone"}]

#### Hinweis 5

- Fingerabdruck: 637503abb712c5f29f23162fa157a9ea5aaaf2a85b7c49300b22afeb61211795
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Integrierter Akku"
- Original Konsequenz: "Häufige Live-Ortung verkürzt die Laufzeit; vor längeren Ausflügen den Ladestand prüfen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Häufige Live-Ortung verkürzt die Laufzeit; vor längeren Ausflügen den Ladestand prüfen."

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"Integrierter Akku"}]

#### Hinweis 6

- Fingerabdruck: eb8ca1551457c18a01e8ceb3cbcdc51b2381f197a88873a0a91b3b45f6cd1a77
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Wasserschutz"
- Original Wert: "IP68"
- Original Konsequenz: "Die Schutzklasse ist bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Wasserschutz: IP68“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.12.value","value":"IP68"}]

### tractive-dog-6-xl

Datei: src/content/products/tractive-dog-6-xl.md

SHA-256: cea2259d08e24922e82bdfb68d120042b014dd7710ae24b177900f3899da75d9

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: f8e2337ed173049eeac88dbe286b86f3277af935f87d9675641c057d070b7880
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Abo"
- Original Wert: "Erforderlich; ein eigenes Abo pro Tracker"
- Original Konsequenz: "Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Erforderlich; ein eigenes Abo pro Tracker"}]

#### Hinweis 2

- Fingerabdruck: d168cf0fbdf3688e66e3fd95e593c1e38b32c15ec2cee373ffe28ba728803520
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "Tractive GPS App; Android 10 oder neuer, iOS/iPadOS 17 oder neuer"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"Tractive GPS App; Android 10 oder neuer, iOS/iPadOS 17 oder neuer"}]

#### Hinweis 3

- Fingerabdruck: d0f47791c37ef5be43f6a563b9031db6ee9d42d0e22d072090995e685af0d7f5
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkulaufzeit"
- Original Wert: "Bis zu 42 Tage mit Energiesparzonen; bis zu 20 Tage ohne"
- Original Konsequenz: "Häufige Live-Ortung verkürzt die Laufzeit; vor längeren Ausflügen den Ladestand prüfen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Häufige Live-Ortung verkürzt die Laufzeit; vor längeren Ausflügen den Ladestand prüfen."

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"Bis zu 42 Tage mit Energiesparzonen; bis zu 20 Tage ohne"}]

#### Hinweis 4

- Fingerabdruck: fa8277675f2755dd994e68fad6ec531203bcf7be3e1f460135068b39b6a93a5e
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Integrierter Akku; Laden über das mitgelieferte USB-C-Ladekabel"
- Original Konsequenz: "Häufige Live-Ortung verkürzt die Laufzeit; vor längeren Ausflügen den Ladestand prüfen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Häufige Live-Ortung verkürzt die Laufzeit; vor längeren Ausflügen den Ladestand prüfen."

Technische Vergleichsdaten: [{"path":"specs.12.value","value":"Integrierter Akku; Laden über das mitgelieferte USB-C-Ladekabel"}]

#### Hinweis 5

- Fingerabdruck: eb8ca1551457c18a01e8ceb3cbcdc51b2381f197a88873a0a91b3b45f6cd1a77
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Wasserschutz"
- Original Wert: "IP68"
- Original Konsequenz: "Die Schutzklasse ist bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Wasserschutz: IP68“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.14.value","value":"IP68"}]

#### Hinweis 6

- Fingerabdruck: 677a954ca0ae8628cc3a7bcc9f00218c5a787d1ab8c1a5a986a1146b55a55349
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Abmessungen"
- Original Wert: "83 × 47 × 20 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Abmessungen: 83 × 47 × 20 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.15.value","value":"83 × 47 × 20 mm"}]

### tractive-dog-6

Datei: src/content/products/tractive-dog-6.md

SHA-256: e3a1480462f7abda3701f77a5bcf7f0cd68e694a8e2b0911bb0805a04f47fce6

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: f8e2337ed173049eeac88dbe286b86f3277af935f87d9675641c057d070b7880
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Abo"
- Original Wert: "Erforderlich; ein eigenes Abo pro Tracker"
- Original Konsequenz: "Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"Erforderlich; ein eigenes Abo pro Tracker"}]

#### Hinweis 2

- Fingerabdruck: d168cf0fbdf3688e66e3fd95e593c1e38b32c15ec2cee373ffe28ba728803520
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App"
- Original Wert: "Tractive GPS App; Android 10 oder neuer, iOS/iPadOS 17 oder neuer"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Tractive GPS App; Android 10 oder neuer, iOS/iPadOS 17 oder neuer"}]

#### Hinweis 3

- Fingerabdruck: 5d1f91a86dc9b471672276b2766f3aa6c9f8ee443581ee2111092c6293ed6c8c
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkulaufzeit"
- Original Wert: "Bis zu 14 Tage mit Energiesparzonen"
- Original Konsequenz: "Häufige Live-Ortung verkürzt die Laufzeit; vor längeren Ausflügen den Ladestand prüfen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4, 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Häufige Live-Ortung verkürzt die Laufzeit; vor längeren Ausflügen den Ladestand prüfen."
  - Vorhandene Evidenz decisionFacts.4.consequence: "Häufige Live-Ortung verkürzt die Laufzeit; vor längeren Ausflügen den Ladestand prüfen."
- VALUE_REQUIRES_COMPARISON: Abweichender Originalwortlaut: redaktionell „Bis zu 14 Tage mit Energiesparzonen“, technisch „Laut Tractive bis zu 14 Tage mit Energiesparzonen; bis zu 6 Tage ohne“. Dies allein belegt keinen sachlichen Widerspruch.
  - Vorhandene Evidenz specs.10.value: "Laut Tractive bis zu 14 Tage mit Energiesparzonen; bis zu 6 Tage ohne"

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"Laut Tractive bis zu 14 Tage mit Energiesparzonen; bis zu 6 Tage ohne"}]

#### Hinweis 4

- Fingerabdruck: fa8277675f2755dd994e68fad6ec531203bcf7be3e1f460135068b39b6a93a5e
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Integrierter Akku; Laden über das mitgelieferte USB-C-Ladekabel"
- Original Konsequenz: "Häufige Live-Ortung verkürzt die Laufzeit; vor längeren Ausflügen den Ladestand prüfen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3, 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Häufige Live-Ortung verkürzt die Laufzeit; vor längeren Ausflügen den Ladestand prüfen."
  - Vorhandene Evidenz decisionFacts.4.consequence: "Häufige Live-Ortung verkürzt die Laufzeit; vor längeren Ausflügen den Ladestand prüfen."

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"Integrierter Akku; Laden über das mitgelieferte USB-C-Ladekabel"}]

#### Hinweis 5

- Fingerabdruck: 28e4efb9cbcb8b804ae0e07cb57d8aa57ab6c7a09add970b780da0cc8709cca4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akku"
- Original Wert: "Integrierter Akku, laut Support 930 mAh"
- Original Konsequenz: "Häufige Live-Ortung verkürzt die Laufzeit; vor längeren Ausflügen den Ladestand prüfen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3, 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Häufige Live-Ortung verkürzt die Laufzeit; vor längeren Ausflügen den Ladestand prüfen."
  - Vorhandene Evidenz decisionFacts.3.consequence: "Häufige Live-Ortung verkürzt die Laufzeit; vor längeren Ausflügen den Ladestand prüfen."

Technische Vergleichsdaten: [{"path":"specs.12.value","value":"Integrierter Akku, laut Support 930 mAh"}]

#### Hinweis 6

- Fingerabdruck: eb8ca1551457c18a01e8ceb3cbcdc51b2381f197a88873a0a91b3b45f6cd1a77
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Wasserschutz"
- Original Wert: "IP68"
- Original Konsequenz: "Die Schutzklasse ist bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Wasserschutz: IP68“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.15.value","value":"IP68"}]

### weenect-xs

Datei: src/content/products/weenect-xs.md

SHA-256: 2f025813ab7941d2ae6c343dfd350e207f01eba7737c7c176f89b2000895fc0e

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: e05175c35edd23b8384df53550bc830ec26caf6597875e28347b4a3f26a83d89
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Abo"
- Original Wert: "Erforderlich; eigenes Abonnement pro Tracker"
- Original Konsequenz: "Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 2 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.1.consequence: "Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre."

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Erforderlich; eigenes Abonnement pro Tracker"}]

#### Hinweis 2

- Fingerabdruck: 451a73094d1599a0656924c587af162620a3f16c44a270627abd707a7dcf854f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Abo-Modelle"
- Original Wert: "Monatlich sowie Prepaid-Laufzeiten über ein, zwei oder fünf Jahre"
- Original Konsequenz: "Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 1 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.0.consequence: "Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre."
- VALUE_REQUIRES_COMPARISON: Abweichender Originalwortlaut: redaktionell „Monatlich sowie Prepaid-Laufzeiten über ein, zwei oder fünf Jahre“, technisch „Aktuell 14 €/Monat, 90 €/Jahr, 120 €/2 Jahre oder 250 €/5 Jahre laut Weenect“. Dies allein belegt keinen sachlichen Widerspruch.
  - Vorhandene Evidenz specs.6.value: "Aktuell 14 €/Monat, 90 €/Jahr, 120 €/2 Jahre oder 250 €/5 Jahre laut Weenect"

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"Aktuell 14 €/Monat, 90 €/Jahr, 120 €/2 Jahre oder 250 €/5 Jahre laut Weenect"}]

#### Hinweis 3

- Fingerabdruck: 7a9b4a1e2d058605729a165679892fae4e9b549bba1ad2fe5b55d9475097b8c7
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "App"
- Original Wert: "Weenect App für iOS und Android sowie Web-App"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Weenect App für iOS und Android sowie Web-App"}]

#### Hinweis 4

- Fingerabdruck: 53ad6ca0b45b14cd925c53caee4aa2a862bf1208b557ff30beefb65a2ad409a2
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "WLAN"
- Original Wert: "WLAN-Energiesparzonen; WLAN ist kein eigenständiger Ortungsweg"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"WLAN-Energiesparzonen; WLAN ist kein eigenständiger Ortungsweg"}]

#### Hinweis 5

- Fingerabdruck: 0a5fc9623cf498832c832ee1ec6176ac74024852c0f9214083d7abbdc70a8fbf
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkukapazität"
- Original Wert: "500 mAh"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkukapazität: 500 mAh“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"500 mAh"}]

#### Hinweis 6

- Fingerabdruck: 3e264fac2b25f0e4142cc849937ef4e44cfe7646ebba6b5714fa30e51eb52a06
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkulaufzeit"
- Original Wert: "Bis zu 7 Tage mit WLAN-Energiesparzonen; etwa 2 Tage bei durchgehender Ortung"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkulaufzeit: Bis zu 7 Tage mit WLAN-Energiesparzonen; etwa 2 Tage bei durchgehender Ortung“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.12.value","value":"Bis zu 7 Tage mit WLAN-Energiesparzonen; etwa 2 Tage bei durchgehender Ortung"}]

### weenect-xt

Datei: src/content/products/weenect-xt.md

SHA-256: 0a58d5924a279a8b9eeebd2c4c74beff326c1eef041dff15f0cb429d5f3b1ff8

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: e05175c35edd23b8384df53550bc830ec26caf6597875e28347b4a3f26a83d89
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Abo"
- Original Wert: "Erforderlich; eigenes Abonnement pro Tracker"
- Original Konsequenz: "Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 2 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.1.consequence: "Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre."

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"Erforderlich; eigenes Abonnement pro Tracker"}]

#### Hinweis 2

- Fingerabdruck: 451a73094d1599a0656924c587af162620a3f16c44a270627abd707a7dcf854f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Abo-Modelle"
- Original Wert: "Monatlich sowie Prepaid-Laufzeiten über ein, zwei oder fünf Jahre"
- Original Konsequenz: "Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 1 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.0.consequence: "Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre."

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"Monatlich sowie Prepaid-Laufzeiten über ein, zwei oder fünf Jahre"}]

#### Hinweis 3

- Fingerabdruck: 7a9b4a1e2d058605729a165679892fae4e9b549bba1ad2fe5b55d9475097b8c7
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "App"
- Original Wert: "Weenect App für iOS und Android sowie Web-App"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"Weenect App für iOS und Android sowie Web-App"}]

#### Hinweis 4

- Fingerabdruck: 8187a65d489b637c173215c6dbe252f6334470d1cf9114e4d9cdc2da4f071881
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "WLAN"
- Original Wert: "WLAN-Energiesparzonen; kein eigenständiger Ortungsweg"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

Technische Vergleichsdaten: [{"path":"specs.13.value","value":"WLAN-Energiesparzonen; kein eigenständiger Ortungsweg"}]

#### Hinweis 5

- Fingerabdruck: 8e975188f1e8940b5cb095c1dfe175b16abf4c0b0bd0b6a0bf3edb3fa62a202a
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkukapazität"
- Original Wert: "1.250 mAh bei 3,8 V; 4,75 Wh"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkukapazität: 1.250 mAh bei 3,8 V; 4,75 Wh“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.15.value","value":"1.250 mAh bei 3,8 V; 4,75 Wh"}]

#### Hinweis 6

- Fingerabdruck: a44e66d27c688e74369caf529758a427b4189a50e3a707dbb98934c15bb7d441
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkulaufzeit"
- Original Wert: "Bis zu 3 Wochen mit Energiesparzone; ungefähr 1 Woche bei kontinuierlichem Tracking"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkulaufzeit: Bis zu 3 Wochen mit Energiesparzone; ungefähr 1 Woche bei kontinuierlichem Tracking“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.16.value","value":"Bis zu 3 Wochen mit Energiesparzone; ungefähr 1 Woche bei kontinuierlichem Tracking"}]

### wopet-cube-air-ca10

Datei: src/content/products/wopet-cube-air-ca10.md

SHA-256: 84ebfabffa4f9d93d6fe1b6837111de912efa3b2234178bfb9635064e4b471aa

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 5e19b109297049cd431c387c7081a8adc7dab16f795407f7fb17c626fddaa34d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App-Steuerung"
- Original Wert: "Ja, WOPET Life"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"Ja, WOPET Life"}]

#### Hinweis 2

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"Nein"}]

#### Hinweis 3

- Fingerabdruck: 2b28dd1893b5748936079f9a16a4f040a66e963e67f5520dc648f5320cf9272f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "4 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 4 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"4 Liter"}]

#### Hinweis 4

- Fingerabdruck: 93529883ed8d4df9134d01dff635408d7f4f91957ebd3e46e6c34b02f489a670
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "1 bis 8 Portionen pro Mahlzeit"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"1 bis 8 Portionen pro Mahlzeit"}]

#### Hinweis 5

- Fingerabdruck: 288a5667800f0e207d25690880241dca2d290ebe12cfee49db202449bbb17b16
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Portionsgröße"
- Original Wert: "Etwa 10 g pro Portion"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Portionsgröße: Etwa 10 g pro Portion“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"Etwa 10 g pro Portion"}]

#### Hinweis 6

- Fingerabdruck: 030ec9b081a3627521ab6a95a3f2cfac334196c1117af79a79d6992839c2cbe2
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "USB C Netzteil mit Batterie Backup"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: USB C Netzteil mit Batterie Backup“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"USB C Netzteil mit Batterie Backup"}]

### wopet-heritage-view-camera-feeder

Datei: src/content/products/wopet-heritage-view-camera-feeder.md

SHA-256: 714cca09c46d99ecc275984d9f1fe69541763d4131ffe00ab566bcc3eebadd23

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: ceabd4135da3493c315948ed4d69c382151b078d4dd161048d9f680f75cb7fd7
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "App-Steuerung"
- Original Wert: "Ja"
- Original Konsequenz: "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"Ja"}]

#### Hinweis 2

- Fingerabdruck: fe450172576081228b9f8c0d49250b17632e756649052efa9d5bd4aff9c41fc6
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Ja"
- Original Konsequenz: "Du kannst zusätzlich kontrollieren, was am Gerät oder beim Tier tatsächlich passiert."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"Ja"}]

#### Hinweis 3

- Fingerabdruck: dad0e69e7cc567fcfdac4fd919cb94f44ae5e9adaa85d879533c0d02ea026cd1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "6 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 6 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"6 Liter"}]

#### Hinweis 4

- Fingerabdruck: 4688dc5acb8b656ee80b10577573f2feb62dbe464cb0a5aa5ea41fb0bc259fa5
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzteil, modellabhängig Backup"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzteil, modellabhängig Backup“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"Netzteil, modellabhängig Backup"}]

#### Hinweis 5

- Fingerabdruck: 9a9456244e5208e4afd70d09e324900aed2dae711cd8e28beda50266ebc48dd1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "1 bis 6 Mahlzeiten pro Tag; 1 bis 20 Portionen à etwa 10 g pro Mahlzeit"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"1 bis 6 Mahlzeiten pro Tag; 1 bis 20 Portionen à etwa 10 g pro Mahlzeit"}]

#### Hinweis 6

- Fingerabdruck: 3d69852c43602c14abd8103169f61d6e0f06e9aa385c6b507eee24f0a28c1feb
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Batterie"
- Original Wert: "Nicht vom Hersteller ausgewiesen"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Batterie: Nicht vom Hersteller ausgewiesen“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"Nicht vom Hersteller ausgewiesen"}]

### wopet-patrol-f07-pro

Datei: src/content/products/wopet-patrol-f07-pro.md

SHA-256: e83a20081bde09547a576cc493a8c0ce670333beae54fd57d820e8dc42121ec8

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 479e326eabbc1fc86d690e9f27424907009371346d78377ee5563b2d7f25307f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Krokettengröße"
- Original Wert: "offiziell uneinheitlich mit 2 bis 15 oder 5 bis 15 mm angegeben"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."
- WRONG_DECISION_CONTEXT: Die Krokettengröße „offiziell uneinheitlich mit 2 bis 15 oder 5 bis 15 mm angegeben“ wird mit Stellplatz oder Körpergröße begründet; das sind andere Größen als die zulässigen Futterabmessungen.
  - Vorhandene Evidenz category: {"key":"futterautomaten","label":"Futterautomaten","path":"/smarte-futterautomaten/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Krokettengröße"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Krokettengröße: offiziell uneinheitlich mit 2 bis 15 oder 5 bis 15 mm angegeben“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"offiziell uneinheitlich mit 2 bis 15 oder 5 bis 15 mm angegeben"}]

#### Hinweis 2

- Fingerabdruck: dad0e69e7cc567fcfdac4fd919cb94f44ae5e9adaa85d879533c0d02ea026cd1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "6 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 6 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"6 Liter"}]

#### Hinweis 3

- Fingerabdruck: 505be18b950e478234e9b0e15abf68841b8c8c77cd4e3585298169393e699c6d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "1 bis 50 Portionen pro Mahlzeit"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"1 bis 50 Portionen pro Mahlzeit"}]

#### Hinweis 4

- Fingerabdruck: 4d3730bddc76e284cc58ae97f36866798afcc7bd1886bed30f022fc7e1ddfd4c
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Portionsgröße"
- Original Wert: "Herstellerangabe etwa 5 g"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 1 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.0.consequence: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Portionsgröße: Herstellerangabe etwa 5 g“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.6.value","value":"Herstellerangabe etwa 5 g"}]

#### Hinweis 5

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"Nein"}]

#### Hinweis 6

- Fingerabdruck: ae97cf80bc4b42d0d835a69dee30d2ecbe32cfa960c85c4b2b77552b855d904d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "5 V/1 A über USB-C und drei D-Batterien als Backup"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: 5 V/1 A über USB-C und drei D-Batterien als Backup“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"5 V/1 A über USB-C und drei D-Batterien als Backup"}]

### wopet-pioneer-f01-plus

Datei: src/content/products/wopet-pioneer-f01-plus.md

SHA-256: c7313856ecc05ede936220ebf6f07718ecabc4d4d6b62c28364c8c4ed7a7f1ea

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 825d257751b0858ec45f7310ee2c19d99ab105f50504c0c9bd8e89d675ef980a
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "App-Steuerung"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.5.consequence: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"Nein"}]

#### Hinweis 2

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"Nein"}]

#### Hinweis 3

- Fingerabdruck: ca30ee2fb26fb0f8cac99761d20e7667b541e0b0a6121285b9d84e7c1b17f64e
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "7 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 7 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"7 Liter"}]

#### Hinweis 4

- Fingerabdruck: d5dc79ab0efbc77c18eb72b7e8aae9fa0974efc2c3ce52a6413332355c2b4bf4
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "Bis zu 40 Portionen pro Mahlzeit"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Bis zu 40 Portionen pro Mahlzeit"}]

#### Hinweis 5

- Fingerabdruck: 17ae93863073ed7932fb49d4a42c9f5bbce40afdf34a059f92422a6343c4152c
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzteil und 3 D-Batterien als Backup"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzteil und 3 D-Batterien als Backup“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Netzteil und 3 D-Batterien als Backup"}]

#### Hinweis 6

- Fingerabdruck: 0dbe3dd9d9a460181f6088bf2c13b3e8a8002217786c502d96d822b1d59bb2ac
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "WLAN"
- Original Wert: "Nein"
- Original Konsequenz: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 1 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.0.consequence: "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN."

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"Nein"}]

### xiaomi-smart-pet-food-feeder-2

Datei: src/content/products/xiaomi-smart-pet-food-feeder-2.md

SHA-256: c3b808a7f74d4e616fa6e681648ba7b93605b11a990c792171c0b226bccfa59b

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: ad39ef05f6672ccbe067c54a8f29eaefa5dfe67b421ea3f5c4725a8d7e2e762a
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Krokettengröße"
- Original Wert: "bis 12 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Die Krokettengröße „bis 12 mm“ wird mit Stellplatz oder Körpergröße begründet; das sind andere Größen als die zulässigen Futterabmessungen.
  - Vorhandene Evidenz category: {"key":"futterautomaten","label":"Futterautomaten","path":"/smarte-futterautomaten/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Krokettengröße"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Krokettengröße: bis 12 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"bis 12 mm"}]

#### Hinweis 2

- Fingerabdruck: 3371b95afe08527b95939187d6a1300dc429396704de996e5f5d036d5522a42b
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "5 Liter, etwa 2,5 kg"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 5 Liter, etwa 2,5 kg“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"5 Liter, etwa 2,5 kg"}]

#### Hinweis 3

- Fingerabdruck: fc4075808e545bef79080013f55dbca45cfac551b7d42435a51dff0f4fdbee01
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Portionierung"
- Original Wert: "ab etwa 1 g über App steuerbar"
- Original Konsequenz: "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"ab etwa 1 g über App steuerbar"}]

#### Hinweis 4

- Fingerabdruck: 5c857f516bbe8073f7b4a8441a2121ec2a124432e5030c31f82d25d32533b57f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "Nein"
- Original Konsequenz: "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.7.value","value":"Nein"}]

#### Hinweis 5

- Fingerabdruck: cc8fb21e58717d0131b7d4f4b95d6d4e8e895d49a8bc5e12b771f12e4afa0a72
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Napfmaterial"
- Original Wert: "Edelstahl 304"
- Original Konsequenz: "Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.8.value","value":"Edelstahl 304"}]

#### Hinweis 6

- Fingerabdruck: 33db39352b737ee32c4bec0f6cbbebeef893127f70cdeb056fac023e1edb64e6
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "Netzbetrieb und vier AA-Batterien als Backup"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: Netzbetrieb und vier AA-Batterien als Backup“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"Netzbetrieb und vier AA-Batterien als Backup"}]

### xiaomi-smart-pet-fountain-2

Datei: src/content/products/xiaomi-smart-pet-fountain-2.md

SHA-256: de2267b4926bb95a27a4a52b0353e8eeec847910613f3eea2c7c8ba3b42e3bbc

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 0c4b956f94f22f3f7b5c77598c4e08b29ac38c0d8d95e5d1ff3b0d31f8568489
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Kapazität"
- Original Wert: "3 Liter"
- Original Konsequenz: "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: finding
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- WRONG_DECISION_CONTEXT: Der Wasserinhalt „3 Liter“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.
  - Vorhandene Evidenz category: {"key":"trinkbrunnen","label":"Trinkbrunnen","path":"/trinkbrunnen/"}
  - Vorhandene Evidenz decisionFacts.0.label: "Kapazität"
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Kapazität: 3 Liter“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"3 Liter"}]

#### Hinweis 2

- Fingerabdruck: 628cf0b6348922bdcb94eb30a3be5e90620f543609356ff17d907aa6bae9a321
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "integrierter Akku, Laden mit 5 V/2 A"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 3, 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: integrierter Akku, Laden mit 5 V/2 A“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"integrierter Akku, Laden mit 5 V/2 A"}]

#### Hinweis 3

- Fingerabdruck: 6b747c55be70468fb27a679b5faa2601b9d5795f5fef07a0baf1366a6ccc492f
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akku"
- Original Wert: "4000 mAh"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 2, 4 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.1.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.3.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akku: 4000 mAh“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.4.value","value":"4000 mAh"}]

#### Hinweis 4

- Fingerabdruck: d06aca567e72d1aeb0e136070e65b9dcaddd8d91106b9c3b29763cceadc2399a
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Akkulaufzeit"
- Original Wert: "Herstellerangabe bis 100 Tage"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 2, 3 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.1.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
  - Vorhandene Evidenz decisionFacts.2.consequence: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."
- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Akkulaufzeit: Herstellerangabe bis 100 Tage“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.5.value","value":"Herstellerangabe bis 100 Tage"}]

#### Hinweis 5

- Fingerabdruck: 6f6057842f6ff9729bf6e8c986db3f95e6806ad5d44b603c090d11a36c17a168
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Filter"
- Original Wert: "vierstufig mit PP-Filter, Aktivkohle, Ionenaustauschharz und bakteriostatischer Baumwolle"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 6 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.5.consequence: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

Technische Vergleichsdaten: [{"path":"specs.10.value","value":"vierstufig mit PP-Filter, Aktivkohle, Ionenaustauschharz und bakteriostatischer Baumwolle"}]

#### Hinweis 6

- Fingerabdruck: ed4a97d2efba56f2c39ae6f047ca07aaba1354cd85ad47f51c927159dc3299fa
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Filterwechsel"
- Original Wert: "Herstellerempfehlung monatlich"
- Original Konsequenz: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: finding
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

- DUPLICATE_CONSEQUENCE: Identische Konsequenz auch in Hinweis 5 dieses Produkts.
  - Vorhandene Evidenz decisionFacts.4.consequence: "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten."

Technische Vergleichsdaten: [{"path":"specs.11.value","value":"Herstellerempfehlung monatlich"}]

### zeromouse-2-0

Datei: src/content/products/zeromouse-2-0.md

SHA-256: 4754bd221192b64e3f8a9f542a7b96ec8aef865fce8ada76a23eb1da69d01766

Content-Speicher: preserved-exactly

#### Hinweis 1

- Fingerabdruck: 4b17366cbbcf6b2dbdf81d097443ec889bed5fc1b693bf784b7667ece4f5328d
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Abmessungen"
- Original Wert: "57,5 × 59,05 × 16,5 mm"
- Original Konsequenz: "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Abmessungen: 57,5 × 59,05 × 16,5 mm“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.1.value","value":"57,5 × 59,05 × 16,5 mm"}]

#### Hinweis 2

- Fingerabdruck: 4096848bf774fe94ab58e8c0d256ea66fbb852ba16d00c0166893ab4d6d9cf7b
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Gewicht"
- Original Wert: "25 g"
- Original Konsequenz: "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Gewicht: 25 g“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.2.value","value":"25 g"}]

#### Hinweis 3

- Fingerabdruck: c5f3c5e1fdd0e413aa98f1f204f34c44565b2f1f9363a64261891607e87385f1
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: no-rule-findings
- Original Label: "Kamera"
- Original Wert: "integriert"
- Original Konsequenz: "Du kannst zusätzlich kontrollieren, was am Gerät oder beim Tier tatsächlich passiert."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: no-rule-findings

Kein Befund durch die begrenzten Regeln; redaktionelle Prüfung weiterhin offen.

Technische Vergleichsdaten: [{"path":"specs.3.value","value":"integriert"},{"path":"comparisonFilters.camera","value":true}]

#### Hinweis 4

- Fingerabdruck: 8c49ebe2d2f2953fac5d50c7a899860b7c178844dfeadbbe21a39380f60ed8df
- Redaktionelle Prüfung: unreviewed
- Veröffentlichung: blocked-fallback-only
- Automatisches Ergebnis: needs-review
- Original Label: "Stromversorgung"
- Original Wert: "USB-C-Netzteil mit mindestens 2 A und geeignetes USB-C-Kabel erforderlich"
- Original Konsequenz: "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält."

- Prüfung completeness: no-rule-findings
- Prüfung duplicateConsequences: no-rule-findings
- Prüfung technicalConsistency: no-rule-findings
- Prüfung unknownProperties: no-rule-findings
- Prüfung decisionUsefulness: finding

- GENERIC_CONSEQUENCE: Pauschale Vorlage ohne konkrete Einordnung von „Stromversorgung: USB-C-Netzteil mit mindestens 2 A und geeignetes USB-C-Kabel erforderlich“; der Nutzen für die Auswahl muss redaktionell geprüft werden.

Technische Vergleichsdaten: [{"path":"specs.9.value","value":"USB-C-Netzteil mit mindestens 2 A und geeignetes USB-C-Kabel erforderlich"}]

