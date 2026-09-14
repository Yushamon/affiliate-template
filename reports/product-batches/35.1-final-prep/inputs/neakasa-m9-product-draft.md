---
DRAFT_ONLY: true
targetPath: apps/pfotentechnik/src/content/products/neakasa-m9.md
note: "Noch NICHT direkt in products/ schreiben: Product-Schema verlangt images.hero. Außerdem productStatus kennt kein 'upcoming'; bis Launch bestehende Semantik bewusst wählen."
---

# Neakasa M9 — Product/Preview Draft

## Vorgesehenes Frontmatter

```yaml
title: "Neakasa M9"
slug: "neakasa-m9"
type: "product"
layout: "product"
testStatus: "manufacturer-data"

# Das Schema erlaubt nur active/discontinued/legacy/unknown.
# Vor offiziellem Launch deshalb:
productStatus: "unknown"

description: "Angekündigte offene selbstreinigende Katzentoilette mit 96-Liter-Open-View-Cabin, rund 26-cm-Einstieg, TILT-SAFE-Rotation und PureTower-Geruchskontrolle."
recommendation: "Als Preview vor allem für Halter interessant, denen die offene M1-Bauform gefällt, der hohe Einstieg oder das Sicherheitskonzept aber bisher nicht zugesagt hat. Kaufempfehlung erst nach finalen Daten und unabhängiger Praxisevidenz."

manufacturer:
  key: "neakasa"
  name: "Neakasa"
  slug: "neakasa"

category:
  key: "automatische-katzentoiletten"
  label: "Automatische Katzentoiletten"
  path: "/automatische-katzentoiletten/"

productUrl: "/produkt/neakasa-m9/"

seo:
  title: "Neakasa M9: Neue offene Katzentoilette als Preview"
  description: "Neakasa M9 mit rund 26-cm-Einstieg, 96-Liter-Kabine, TILT-SAFE und PureTower. Was schon bekannt ist und welche Daten noch fehlen."
  canonical: "/produkt/neakasa-m9/"
  sitemap: true
  priority: 0.7

hub:
  sections: ["produkte", "automatische-katzentoiletten"]

tags:
  - "automatische-katzentoilette"
  - "neakasa"
  - "offenes-katzenklo"
  - "app"
  - "preview"

# MEDIA GATE:
# images.hero ist Pflicht.
# Zielordner:
# ../../assets/images/products/neakasa-m9/
#
# Erst nach real vorhandenen Assets eintragen.

price:
  current: null
  currency: "EUR"
  status: "unknown"

priceAutomation: "editorial"
priceState: "unknown"
priceAvailable: false
affiliateAvailable: false
availability: "unknown"
availabilityReason: "Marktstart laut Hersteller für 09.10.2026 angekündigt; Deutschlandpreis und konkrete Verfügbarkeit am 14.09.2026 noch nicht veröffentlicht."
availabilityUpdated: "2026-09-14"

editorialStatus: "complete"
recommendationStatus: "limited"
maintenanceStatus: "required"

rating: 3.5
ratings: {}

decision:
  bestFor:
    - "Interessenten an einer offenen selbstreinigenden Katzentoilette"
    - "Haushalte, denen der Einstieg des M1 Plus zu hoch ist"
    - "Nutzer, die konstruktive Sicherheitsmechanismen neben Sensorik interessant finden"
  attention:
    - "Noch kein regulärer Deutschland-Marktstart"
    - "Zulässiges Katzengewicht und Automatik-Mindestgewicht noch unbekannt"
    - "Streukompatibilität noch nicht vollständig dokumentiert"
    - "TILT-SAFE ist noch nicht unabhängig als Sicherheitsvorteil validiert"

review:
  summary: "M9 entwickelt Neakasas offene M1-Idee mit niedrigerem Einstieg, 96-Liter-Open-View-Cabin, TILT-SAFE-Rotation und PureTower-Geruchskontrolle weiter."
  verdict: "Technisch interessante Preview, aber vor Launch fehlen zu viele kaufentscheidende Daten für eine belastbare Empfehlung."

strengths:
  - "Offene Bauform"
  - "Rund 26 cm Einstieg laut Hersteller"
  - "TILT-SAFE-Rotation als konstruktiver Sicherheitsansatz"
  - "PureTower mit Aktivkohle und Trockenmittel"

weaknesses:
  - "Noch keine belastbare unabhängige Praxisevidenz"
  - "Viele technische Eckdaten noch offen"
  - "Deutschlandpreis unbekannt"
  - "Streu- und Gewichtsgrenzen noch nicht ausreichend dokumentiert"

specs:
  - { label: "Bauform", value: "Offene selbstreinigende Katzentoilette" }
  - { label: "Open-View Cabin", value: "96 Liter laut Hersteller" }
  - { label: "Einstieg", value: "Rund 26 cm" }
  - { label: "Reinigung", value: "TILT-SAFE-Rotation; Toilettenraum bleibt laut Hersteller während des Reinigungsvorgangs offen" }
  - { label: "Geruchskontrolle", value: "PureTower mit Aktivkohle und Trockenmittelschicht" }
  - { label: "App", value: "Fernsteuerung, Nutzungsverfolgung und Gerätestatus angekündigt" }
  - { label: "Marktstart", value: "9. Oktober 2026 angekündigt" }
  - { label: "Außenmaße", value: "Noch nicht belastbar veröffentlicht" }
  - { label: "Katzengewicht", value: "Noch nicht belastbar veröffentlicht" }
  - { label: "Streu", value: "Noch nicht belastbar veröffentlicht" }

features:
  - "Open-Top-Design"
  - "Selbstreinigung"
  - "TILT-SAFE"
  - "PureTower"
  - "App"
  - "Streuschutzring"
  - "Abnehmbare Komponenten"

comparisonFilters:
  animal: ["cat"]
  petSize: ["small", "medium", "large"]
  foodType: []
  app: true
  camera: false
  access: "open"

alternatives:
  - "neakasa-m1-plus"
  - "neakasa-m1-lite"
  - "litter-robot-4"

comparisons:
  - "beste-automatische-katzentoiletten"

editorial:
  assessmentType: "data-review"
  evidence:
    - "manufacturer-documentation"
    - "technical-specifications"
    - "comparative-analysis"
  testedHandsOn: false
  lastVerifiedAt: "2026-09-14"
  note: "Preview auf Basis offizieller Neakasa-IFA-Kommunikation; kein eigener PfotenTechnik-Praxistest."

evidenceSources:
  - source: "Neakasa Deutschland – IFA 2026"
    url: "https://neakasa.de/blogs/news/ifa-2026-neakasa"
    accessedAt: "2026-09-14"
    assertion: "TILT-SAFE, offene 96-L-Kabine, Einstieg, PureTower, App und Marktstart."
    fields: ["specs", "review", "decision", "features"]
```

## Redaktioneller Kerntext

### Was ist der M9?

M9 ist Neakasas nächste offene selbstreinigende Katzentoilette. Das Produkt übernimmt damit nicht einfach das geschlossene Trommelkonzept vieler Wettbewerber, sondern entwickelt die offene M1-Linie weiter.

Der offizielle Marktstart ist für den 9. Oktober 2026 angekündigt. Vorher sollte die Seite klar als Preview erkennbar bleiben.

### TILT-SAFE: interessanter Ansatz, aber noch kein Sicherheitsbeweis

Neakasa beschreibt TILT-SAFE als Rotationsmechanismus, bei dem der Toilettenraum während des gesamten Reinigungsvorgangs offen bleibt. Dadurch sollen Bereiche reduziert werden, in denen eine Katze eingeklemmt werden könnte.

Das ist konstruktiv interessant. PfotenTechnik sollte daraus aber keine Aussage wie „sicherer als Litter-Robot“ oder „besonders sicher“ ableiten. Dafür fehlt bislang unabhängige Validierung des finalen Seriengeräts.

### Niedrigerer Einstieg als beim M1 Plus

Neakasa nennt für M9 rund 26 cm Einstiegshöhe. Der im bestehenden PfotenTechnik-Datensatz dokumentierte M1 Plus liegt bei etwa 35,2 cm.

Damit adressiert M9 einen konkreten Schwachpunkt des M1 Plus. Ob der niedrigere Einstieg älteren oder bewegungseingeschränkten Katzen tatsächlich ausreichend hilft, muss aber praktisch geprüft werden.

### 96-Liter-Kabine

Neakasa spricht von einer 96 Liter großen „Open-View Cabin“. Bis genauere technische Zeichnungen oder ein Manual vorliegen, sollte diese Zahl nicht automatisch als nutzbares Streu- oder Innenvolumen interpretiert werden. Sie ist zunächst die Herstellerangabe zur Kabinengröße.

### PureTower-Geruchskontrolle

Das PureTower-System kombiniert laut Neakasa Aktivkohle mit einer Trockenmittelschicht. Damit sollen Gerüche reduziert und Feuchtigkeit gebunden werden.

Noch offen sind Wechselintervalle und Folgekosten. Diese gehören nach Marktstart in die bestehende Consumables-/Folgekostenlogik, sobald belastbare Daten vorliegen.

### Was wir vor einer Kaufempfehlung noch brauchen

Für M9 fehlen derzeit noch mehrere kaufentscheidende Angaben:

- Außenmaße und Leergewicht
- zulässiger Gewichtsbereich der Katze
- Mindestgewicht für Automatikbetrieb
- genaue Sensorik
- Streukompatibilität
- Lautstärke
- Abfallbehältervolumen
- Deutschlandpreis
- Verbrauchsmaterialpreise
- Offline-Verhalten
- finale Garantie-/Supportdetails

Bis diese Informationen verfügbar sind, ist M9 eine interessante Neuheit, aber keine belastbare Kaufempfehlung.
