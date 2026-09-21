# PFOTENTECHNIK 35.1 — IFA 2026 PETTECH / EMERGING PRODUCTS
## FINAL IMPLEMENTATION TASK

Die Recherche wurde außerhalb von Codex durchgeführt. **Keine breite erneute Webrecherche durchführen.**
Nutze die vorbereiteten Research-/Draft-Dateien als primäre Arbeitsgrundlage und prüfe nur:
1. aktuelle Repo-Schemata/Architektur,
2. physisch vorhandene Bilddateien,
3. unmittelbar dynamische Preis-/Verfügbarkeitsangaben, wenn für Go-Live zwingend nötig.

## ZIEL

In einem Batch fertigstellen:
1. IFA-2026-PetTech-Ratgeber
2. Neakasa Riko Produktseite
3. Neakasa M9 Preview-/Produktseite
4. interne Verlinkung und Hub-Integration
5. Evidence-/SEO-/Schema-Integration
6. relevante Tests + ein Production Build

Nicht Teil dieses Batches:
- keine neue Litter-Robot-5-Seite
- kein LR4-vs-LR5-Vergleich
- keine neue Parallelarchitektur
- keine Bildgenerierung
- keine Bildbeschaffung
- kein unnötiger Screenshot-Zyklus

## VORHANDENE INPUTS

Research:
- `neakasa-riko.json`
- `neakasa-m9.json`
- `ifa-pettech-products.json`
- `litter-robot-5.json`
- `source-conflicts.json`
- `image-manifest.json`

Drafts:
- `ifa-2026-haustiertechnik-draft.md`
- `neakasa-riko-product-draft.md`
- `neakasa-m9-product-draft.md`

Asset-Check:
- `asset-checklist.md`

Wenn diese Dateien außerhalb des Repos bereitgestellt werden, behandle ihren Inhalt als redaktionelle Arbeitsgrundlage und übertrage ihn in die bestehende PfotenTechnik-Struktur. Nicht als Runtime-Dateien publizieren, wenn dies nicht zum bestehenden Projektmuster gehört.

# 1. ASSET GATE

Vor Content-Implementierung prüfen:

### Riko
`apps/pfotentechnik/src/assets/images/products/neakasa-riko/`
muss enthalten:
- hero.webp
- thumbnail.webp
- comparison.webp
- gallery-1.webp
- gallery-2.webp
- gallery-3.webp

### M9
`apps/pfotentechnik/src/assets/images/products/neakasa-m9/`
muss enthalten:
- hero.webp
- thumbnail.webp
- comparison.webp
- gallery-1.webp
- gallery-2.webp
- gallery-3.webp

Produkt-Schema verlangt `images.hero`. Keine kaputten Bildreferenzen erzeugen.

### IFA-Guide
Prüfe:
`apps/pfotentechnik/src/assets/images/guides/ifa-2026-haustiertechnik/`

Nur tatsächlich vorhandene Bilder referenzieren.
Ein Hero plus 3–5 gute Inline-Bilder reicht. Nicht wegen fehlender Randprodukte künstlich blockieren.

Wenn Riko oder M9 den Asset-Gate nicht erfüllen:
- betreffende Produktseite nicht halb implementieren
- fehlende Dateien exakt melden
- übrige vollständig mögliche Arbeit durchführen

# 2. IFA-GUIDE

Ziel:
`apps/pfotentechnik/src/content/pages/ifa-2026-haustiertechnik.md`

Intent:
IFA-2026-PetTech-Neuheiten kritisch einordnen, keine Ausstellerliste.

Kernaussage:
Nicht das AI-Label ist entscheidend, sondern reale neue Produktlogik, Safety-by-design und passive Datenerfassung.

Hauptprodukte:
- Neakasa Riko
- Neakasa M9
- Litter-Robot 5 / 5 Pro sauber unterscheiden
- LavvieTAG 2
- PetSuper
- WePaws
- PawSwing Neo
- PETGUGU nur als Beispiel „ausgestellt ≠ zwingend neu“

Nutze bestehenden `knowledge`/Page-v2-Aufbau. Keine Sonderkomponente nur für diesen Artikel bauen.

## Redaktionelle Grenzen
- Herstellerclaims als solche kennzeichnen.
- Keine Gesundheitsdiagnosen aus PetTech-Daten ableiten.
- WePaws-Emotionserkennung nicht als validiert darstellen.
- PawSwing-90%-Claim nicht als eigene Feststellung übernehmen.
- PETGUGU nicht pauschal als IFA-2026-Premiere bezeichnen.

# 3. NEAKASA RIKO

Datei:
`apps/pfotentechnik/src/content/products/neakasa-riko.md`

Bestehende Product-v2-Struktur wiederverwenden.

Hersteller:
- key: neakasa
- name: Neakasa
- slug: neakasa

Kategorie:
- futterautomaten

Status:
- `testStatus: manufacturer-data`
- kein Hands-on-Test behaupten
- Product-/Commerce-Status entsprechend aktuellem Schema sauber abbilden

## Zentrale Information-Gain-Aussage

Riko ist **kein klassischer Nassfutterautomat**.

Er lagert geeignetes trockenes/gefriergetrocknetes Futter und Wasser getrennt und mischt beides erst unmittelbar vor der Mahlzeit.

Nicht kompatibel als normale Nutzung:
- Dosenfutter
- Portionsbeutel
- bereits feuchtes Futter
- Rohfutter
- selbst gekochtes Futter

## DE Source of Truth
Bei Spezifikationskonflikten für den deutschen Markt primär:
`https://neakasa.de/products/neakasa-riko-smart-wet-food-feeder`

Bekannte DE-Daten Stand 14.09.2026:
- 3 L Futterbehälter
- 2,4 L Wassertank
- 1–15 g je Ausgabe
- ±1 g Herstellerangabe
- bis zu 20 Mahlzeiten/Tag
- Wasser:Futter 1:1 bis 5:1
- Bluetooth + 2,4-GHz-WLAN
- optional 10,8 V / 2.500 mAh
- Akku-Herstellerclaim bis zu 7 Tage
- primär für gefriergetrocknetes Katzenfutter
- max. Stückgröße 15 × 15 × 25 mm

### Source Conflict
EU-Seite nennt teilweise andere Werte.
Nicht vermischen.
DE-Werte für deutsche Produktseite verwenden.
Konflikt im Evidence-/Redaktionshinweis dokumentieren.

## Multi-Pet
Gemeinsame Nutzung möglich, aber:
- keine individuelle Zugangserkennung
- keine sichere Portion-Zuordnung
- keine individuelle Fütterungssteuerung pro Katze

## Empfehlung
Keine pauschale Top-Empfehlung aussprechen.
Speziallösung für passende Fütterungsweise.
Langzeitpraxis von Mahlwerk, Portionierung, Mischweg und Reinigung noch offen.

# 4. NEAKASA M9

Datei:
`apps/pfotentechnik/src/content/products/neakasa-m9.md`

Kategorie:
- automatische-katzentoiletten

Hersteller:
- bestehender Neakasa-Key

Status:
- `testStatus: manufacturer-data`
- kein Test behaupten
- bis Marktstart klar als Preview/Datencheck formulieren
- Schema nicht nur wegen fehlendem `upcoming`-Status erweitern

Bekannt:
- offenes selbstreinigendes Design
- 96-L „Open-View Cabin“ laut Hersteller
- Einstieg ca. 26 cm
- TILT-SAFE
- Toilettenraum bleibt laut Hersteller während der Rotation offen
- PureTower mit Aktivkohle + Trockenmittelschicht
- abnehmbare Komponenten
- Streuschutzring
- App
- Nutzungs-/Gerätestatusdaten
- Launch angekündigt: 09.10.2026

Nicht schätzen:
- Außenmaße
- Gewicht
- Waste-Drawer-Volumen
- Katzengewicht
- Mindestgewicht Automatik
- Sensoranzahl/-typen
- Streukompatibilität
- Lautstärke
- Deutschlandpreis
- DE-Liefertermin
- Verbrauchsmaterialkosten
- Offline-Verhalten
- finale M9-Garantie

## Sicherheitsformulierung
Erlaubt:
„Neakasa verlagert beim M9 einen Teil der Sicherheitslogik in die mechanische Konstruktion.“

Nicht:
„M9 ist sicherer als andere automatische Katzentoiletten.“

## Vergleich zu M1 Plus
Kontextuell einordnen:
- niedrigerer Einstieg ca. 26 cm vs. ca. 35,2 cm im bestehenden M1-Plus-Datensatz
- neuer TILT-SAFE-Ansatz
- PureTower
- 96-L-Kabinenangabe

Keine Behauptung, dass M9 objektiv besser ist.

# 5. LITTER-ROBOT

Keine neue Datei erzeugen.

Bekannter Research-Befund:
- Litter-Robot 5 und Litter-Robot 5 Pro sind getrennte Modelle.
- Bestehenden `litter-robot-5-pro.md` nicht duplizieren.
- Im IFA-Artikel Modellunterschied transparent formulieren.
- Eigene LR5-DE-Seite separat später entscheiden.

# 6. INTERNAL LINKING

Intent sauber trennen:
- IFA-Seite besitzt IFA/PetTech-Neuheiten-Intent
- Riko-Seite besitzt Riko-Produktintent
- M9-Seite besitzt M9-Produktintent

Sinnvolle Links:
- IFA → Riko
- IFA → M9
- Riko/M9 → relevante Kategorie-/Hubseiten
- M9 → M1 Plus nur dort, wo der Vergleich wirklich hilft
- bestehende Hubs → neue Produkte, wenn Architektur/Qualitätsregeln dies vorsehen

Keine Link-Spam-Schleife erzeugen.
Keine bestehenden Produkt-URLs umleiten.

# 7. SEO / EVIDENCE

Prüfen:
- Canonical
- Sitemap
- eindeutige Slugs
- Title/H1
- Meta Description
- Product-/Article-Schema über bestehende Architektur
- keine Test-Claims ohne Test
- Evidence-Provenance
- keine unbelegten Herstellerclaims als Redaktionstatsache
- keine Cannibalization mit bestehenden Ratgebern/Produkten

# 8. COMMERCE

Keine Affiliate-URL erfinden.

Riko:
Dynamischen Preis/Preorder-Status unmittelbar vor finaler Implementierung kurz verifizieren, falls Commerce-Felder veröffentlicht werden.

M9:
Bei fehlendem Deutschlandpreis `unknown` lassen.

# 9. VALIDATION

Nur sinnvolle vorhandene Tests ausführen:
- Content/schema validation
- interne Links
- SEO/indexability
- relevante Product-v2-/Comparison-/Evidence-Tests
- Production Build

Keine redundanten Testschleifen.

## Visual QA
Wenn ausschließlich bestehende Komponenten verwendet werden und kein Layout-Code geändert wird:
- keine umfangreiche Screenshot-Serie nötig.

Falls Layout/Komponenten geändert werden:
maximal vier finale Fullpage-Screenshots:
- 375 Light
- 375 Dark
- 1600 Light
- 1600 Dark

Andere Breakpoints per automatisierter Overflow-/Geometry-Prüfung.

# 10. FINAL REPORT

Kompakt melden:

CONTENT
- IFA guide
- Riko
- M9

MEDIA
- vorhandene Assets
- referenzierte Assets
- fehlende Assets

EVIDENCE
- Source conflicts
- unknown fields preserved
- unsupported claims avoided

SEO
- canonicals
- sitemap/indexability
- internal links
- cannibalization

VALIDATION
- tests
- production build

GO-LIVE
- READY / NOT READY
- konkrete Blocker

Keine weitere „Ideenrunde“ am Ende.
