# Homepage UI & Information Architecture Audit

Stand: 26. August 2026  
Scope: PfotenTechnik-Startseite `/` in `apps/pfotentechnik`  
Methode: Read-only Source Audit plus lokale, screenshotfreie DOM-/Computed-Style-Prüfung bei 375, 414, 1280 und 1440 px. Es wurden keine Produktionsdateien verändert.

## A. Executive Summary

- **Gesamturteil: targeted-cleanup.** Die Startseite braucht keinen Full Redesign; Grundstruktur, Hero, Kartenmuster und responsives Verhalten sind tragfähig.
- Die Seite ist technisch die Projektion eines gemeinsamen Homepage-Systems: Route und Datenmodell sind projektspezifisch, Rendering und ein großer Teil des CSS kommen aus `affiliate-core`.
- Die Informationsarchitektur ist **nur teilweise** aus Nutzersicht aufgebaut: Früh dominieren Publisher-Formate und kuratierte Vergleiche; konkrete Alltagssituationen erscheinen erst nach Produkten, Ratgebern und Methodik.
- Der Auftritt verspricht breite „smarte Haustiertechnik“, die frühen Einstiege konzentrieren sich aber auf Futterautomaten, Trinkbrunnen und GPS. Kameras, Katzenklappen und Katzentoiletten sind im Header vorhanden, auf der Homepage jedoch nicht gleichwertig orientierend abgebildet.
- Die drei dynamisch gewählten Produktempfehlungen können vollständig aus einer Produktwelt stammen. Damit entsteht leicht eine zufällige statt strategische Homepage-Gewichtung.
- Es gibt einen reproduzierbaren Desktop-Fehler: Eine nicht definierte CSS-Variable setzt durch eine `!important`-Regel die Radien wichtiger Vergleichs-, Produkt- und Ratgeberkarten effektiv auf `0px`; mobil sind dieselben Karten `20px` gerundet.
- Die Hero-Abrundung ist für sich genommen nicht zu stark. Sie wirkt vor allem deshalb isoliert und „kartenartig“, weil zentrale nachfolgende Karten auf Desktop durch den Radiusfehler eckig werden. Mobil ist der Hero sinnvoll full-bleed und ohne Radius.
- Trust ist substanziell, aber überrepräsentiert: Hero-Signale, Methodik, Kennzahlen, Transparenz-FAQ, Brand Statement und Footer wiederholen ähnliche Begründungen. Das verlängert die Seite und schiebt handlungsnahe Orientierung nach hinten.
- Die Vergleichs-Icons sind technisch kohärent; die Use-Case-Icons aus CSS-Zeichen sind dagegen optisch uneinheitlich. Das bestätigt die vermutete Icon-Inkonsistenz, nicht aber ein generelles Zentrierungsproblem.
- Dark Mode und Focus-Grundlagen sind vorhanden. Die größten Risiken liegen nicht bei Barrierefreiheit oder Farbmodus, sondern bei CSS-Ownership, Erwartungsklarheit und der Reihenfolge der Nutzerführung.

## B. Reconstructed Homepage Architecture

### Tatsächliche Render-Kette

```text
src/pages/index.astro
└─ ProjectLayout.astro
   └─ @affiliate-core/AffiliateLayout.astro
      ├─ Header.astro
      ├─ <main class="container container--home">
      │  ├─ @affiliate-core/home/HomePage.astro
      │  │  ├─ HomeHero.astro
      │  │  ├─ HomeNavigation.astro: comparison-decision
      │  │  ├─ HomeSection.astro: products
      │  │  ├─ HomeSection.astro: guides
      │  │  ├─ HomeNavigation.astro: method
      │  │  ├─ HomeUseCases.astro
      │  │  ├─ HomeStats.astro
      │  │  ├─ HomeSection.astro: recently-updated
      │  │  ├─ HomeFaq.astro
      │  │  ├─ HomeNavigation.astro: topics
      │  │  └─ HomeBrandStatement.astro
      │  └─ AdvisorCta.astro                 ← außerhalb von .home3
      └─ Footer.astro
```

Die Homepage-Daten entstehen in `src/domain/home/buildHomepageModel.ts`. Sie werden aus den Content Collections `products`, `comparisons` und `pages` aufgebaut. Das Projekt rendert also keine zweite Homepage-Engine, sondern liefert ein projektspezifisches Modell an gemeinsame Komponenten.

### Wirksame Style-Ebenen

1. Design Tokens: `pfotentechnik-design-tokens.css`
2. Grundprimitive und Resilience-Regeln
3. Projektbasis: `pfotentechnik.css`
4. Gemeinsames Homepage-CSS: `packages/affiliate-core/src/styles/home/home.css`
5. Projektweite Design-System- und UI-System-Overrides
6. Lokaler Inline-Style für `.advisor-home-entry` in `index.astro`

Diese Kaskade ist funktional, besitzt aber zu viele Stellen mit Homepage-Verantwortung. Besonders kritisch sind spätere `!important`-Overrides, die valide Component-Defaults ungültig machen.

### Aktuelle Modulreihenfolge

| # | Modul | Primäre Aufgabe | Perspektive |
|---:|---|---|---|
| 1 | Header | Globale Produktwelten und Bereiche | gemischt |
| 2 | Hero | Positionierung, zwei Hauptwege, Trust-Signale | Publisher-Angebot |
| 3 | Direkt zum passenden Vergleich | Sieben kuratierte Vergleiche | Produkt-/Formatlogik |
| 4 | Aktuelle Produktempfehlungen | Drei dynamische Produkte | Produktlogik |
| 5 | Neu im Ratgeber | Vier priorisierte Beiträge | Contentlogik |
| 6 | So arbeiten wir | Vier Methodenschritte | Trust |
| 7 | Nach Alltag auswählen | Sechs Use Cases | Nutzerlogik, überwiegend Futterautomaten |
| 8 | Kennzahlen/Proof | Umfang des Angebots | Trust |
| 9 | Zuletzt aktualisiert | Drei aktuelle Inhalte | Aktualität |
| 10 | Transparenz-FAQ | Methodische Einordnung | Trust |
| 11 | Themen-Navigation | Drei Linkgruppen | Content-/Taxonomielogik |
| 12 | Brand Statement | Drei Vertrauenslinks | Trust |
| 13 | Futterautomaten-Berater | Geführte Auswahl | Nutzerlogik, einzelne Produktwelt |
| 14 | Footer | Wiederholung globaler Wege | Sitemap/Service |

## C. Visual System Audit

### Spacing und vertikaler Rhythmus

Die Hauptsequenz `.home3` verwendet einen fluiden Abschnittsabstand von etwa 56 px mobil bis 89,6 px bei 1280 und 100,8 px bei 1440. Innerhalb der Module sind Abstände überwiegend konsistent. Das Problem ist weniger ein lokaler Margin-Fehler als die Kombination aus:

- sehr vielen eigenständigen Modulen,
- sechs Trust-/Proof-Berührungspunkten,
- wachsendem Desktop-Section-Gap,
- langen mobilen Kartenstapeln.

Die gemessene Seite ist etwa 16.004 px hoch bei 375 px und 10.612 px bei 1280 px. Bei 1440 px wächst sie trotz zusätzlicher Breite auf rund 11.049 px; Fluid Spacing und Text-/Kartenproportionen nutzen den größeren Viewport damit nicht durchgehend effizient.

### Container und Ausrichtung

- Mobile Kernachse: `.home3` liegt bei 375 px auf `x=12`, Breite `351`; der Hero bricht korrekt auf volle `375px` aus.
- Methodik, Stats und Brand Statement liegen leicht eingerückt (`x=16`, Breite `343`). Das ist sichtbar, aber kein Bruch der Bedienbarkeit.
- Der Advisor liegt mobil bei `x=28` und ist dadurch deutlich stärker eingerückt als die Homepage-Achse.
- Desktop nutzt die Homepage fast über die volle verfügbare Breite (`x=28`, Breite `1224` bei 1280; `1384` bei 1440).
- Der Advisor ist auf `1180px` begrenzt. Bei 1440 liegt er bei `x=130` und wechselt dadurch kurz vor dem Footer sichtbar auf eine andere Inhaltsachse.

### Kartenradien und Oberflächenhierarchie

Das Tokensystem selbst ist nachvollziehbar: 6/8/12/16/20/24/32 px plus Pill. Die aktuelle Homepage-Ausgabe verletzt es jedoch auf Desktop:

```css
:where(.home41-decision__card, .home3-product-card, .home3-editorial-card) {
  border-radius: var(--pt-polish-radius-card) !important;
}
```

`--pt-polish-radius-card` wird nur innerhalb `@media (max-width: 760px)` definiert. Außerhalb ist die Deklaration ungültig; durch `!important` verdrängt sie dennoch die niedrigere valide Radiusregel. Gemessen:

| Oberfläche | 375 px | 1280 px | 1440 px |
|---|---:|---:|---:|
| Hero | 0 px | 28,16 px | 31,68 px |
| Vergleichskarte | 20 px | **0 px** | **0 px** |
| Produktkarte | 20 px | **0 px** | **0 px** |
| Use-Case-Karte | 17,6 px | 17,6 px | 17,6 px |
| Methodik/Stats/Brand | 21,6 px | 24 px | 24 px |
| Advisor | 24 px | 24 px | 24 px |

**Bewertung der Hero-Hypothese:** Nein, die Hero-Box ist nicht grundsätzlich zu stark gerundet. Desktop ist sie eine bewusst größere Fläche und darf eine Stufe über Standardkarten liegen; mobil wird sie korrekt eckig/full-bleed. Die visuelle Isolation entsteht durch die fehlerhaft eckigen Hauptkarten. Erst nach deren Korrektur sollte der Hero-Radius neu beurteilt werden.

### Card Patterns

Es existieren mindestens sechs Kartenfamilien: Decision, Product, Editorial, Method, Use Case und Trust/Brand; dazu Advisor und FAQ-Details. Inhaltlich sind diese unterscheidbar, visuell entstehen aber zwei Probleme:

1. Radius und Oberfläche werden über mehrere CSS-Schichten unterschiedlich kontrolliert.
2. Full-card Links, textbasierte CTA-Zeilen und eigenständige Button-Pills sehen handlungsähnlich aus, besitzen aber keine klar dokumentierte Hierarchie.

Die Full-card-Link-Lösung ist für große Touch-Ziele positiv. Der Advisor-Pill ist ebenfalls ausreichend groß. Eine neue universelle Card-Komponente ist nicht nötig; nötig ist die Konsolidierung der vorhandenen Regeln.

### Icon-System

Die sieben Decision-Icons sind inline SVGs mit einheitlichem `24×24`-ViewBox, `stroke-width: 1.8`, runden Linienenden und identischem Container. Sie sind technisch und optisch grundsätzlich konsistent.

Die Use-Case-Icons bestehen dagegen aus CSS-Pseudozeichen (`◷`, `● ●`, `◒`, `●`, `◆`, `↗`). Obwohl ihre 48×48-Container zentriert sind, unterscheiden sich optische Masse, Grundlinie, Semantik und Formsprache stark. Besonders Einzelpunkt, Doppelpunkte, Raute und Pfeil wirken nicht wie Mitglieder desselben Iconsets. **Icon-Inkonsistenz: ja; belastbarer Zentrierungsfehler: nein.**

### Desktop und Mobile

- 375/414 px: kein horizontaler Overflow; der Hero bricht sauber aus; Decision Cards wechseln in ein gut scannbares Listenformat.
- Bei 375 px stapeln sich die Hero-CTAs, bei 414 px stehen sie nebeneinander. Das ist plausibel und ohne Überlauf.
- Mobile Kartenstapel werden sehr lang: sieben Decision Cards, drei hohe Produktkarten und sechs Use Cases erzeugen schon vor den späteren Trust-Modulen große Scrollstrecken.
- 1280/1440 px: Drei-Spalten-Grids funktionieren. Bei 1440 werden Karten jedoch sehr breit, während der Section-Gap weiter wächst; die Seite gewinnt nicht proportional an Informationsdichte.
- Es gibt keine Anzeichen, dass die Homepage künstlich in einem schmalen „Blog-Container“ eingeschlossen ist. Die Breitenhypothese trifft nicht zu; inkonsistent ist nur der spätere Advisor-Container.

### Dark Mode

Semantische Dark-Mode-Tokens und explizite Homepage-Overrides sind vorhanden. Text und Karten erhalten dunkle Oberflächen und abgesetzte Linien. Zwei technische Schulden bleiben:

- Decision/Product-Flächen verwenden zusätzlich hart codiertes `#101f32` und mehrere `!important`-Regeln statt nur semantischer Surface-Tokens.
- Der Desktop-Radiusfehler gilt unabhängig vom Farbmodus und schwächt dort ebenfalls die Oberflächenhierarchie.

Es wurde kein fundamentaler Dark-Mode-Kontrastbruch im geprüften CSS gefunden; eine formale WCAG-Farbmessung war nicht Teil dieses Audits.

## D. Information Architecture Audit

### Neue Nutzer: Produktkategorien und Einstieg

Die Produktwelten sind im Desktop-Header vollständig sichtbar: Futterautomaten, Trinkbrunnen, GPS-Tracker, Katzenklappen, Kameras und Katzentoiletten. In der Homepage-Hauptfläche entsteht diese Landkarte jedoch nicht früh und nicht vollständig:

- Der Hero nennt keine Produktwelten.
- Die erste Sektion zeigt nur Futterautomaten, Trinkbrunnen und GPS.
- Die drei Produkte werden global priorisiert und können aus nur einer Kategorie kommen.
- Die Use Cases sind fast vollständig Futterautomaten-orientiert.
- Die späte Themen-Navigation bildet ebenfalls nicht alle Produktwelten ab.

**Produktkategorien verständlich auffindbar: nur teilweise.** Der Header rettet die Orientierung, die Startseitenfolge selbst bildet das Sortiment nicht ausgewogen ab.

### Aus Nutzerproblemen oder interner Contentlogik?

Die ersten drei Inhaltsmodule heißen sinngemäß Vergleich, Produktempfehlung und Ratgeber. Das sind Publisher- und Contentformate. Das erste explizit problemorientierte Modul „Nach Alltag auswählen“ kommt erst danach und nach der Methodik. Auf Mobile beginnt es in der geprüften Ausgabe erst nach mehreren tausend Scrollpixeln.

Zusätzlich sind seine sechs Fälle nicht repräsentativ für das Gesamtangebot: lange Arbeitstage, mehrere Katzen, Nassfutter, Hunde, Katzen und Reisen routen überwiegend zu Futterautomaten-Vergleichen. Damit ist das Modul zwar nutzerzentriert formuliert, aber taxonomisch eng.

**IA aus Nutzerproblemen aufgebaut: teilweise.** Die Komponente ist vorhanden und gut verständlich, steht aber zu spät und deckt den versprochenen Raum nicht breit genug ab.

### User-Intent-Einstieg

Der sinnvollste vorhandene Intent-Einstieg ist `HomeUseCases`. Er sollte direkt nach dem Hero oder nach einer kompakten Kategorie-/Vergleichsorientierung erscheinen. Ein neuer großer Block ist dafür nicht erforderlich: Reordering plus breitere Auswahl bestehender Ziele reicht zunächst.

Der Futterautomaten-Berater ist ein stärker geführter Intent-Einstieg, erscheint jedoch als letztes Homepage-Modul, außerhalb des gemeinsamen Homepage-Grids und ohne klaren Bezug zum früheren Futterautomaten-Schwerpunkt. Er gehört näher an den passenden Kontext, nicht zwingend prominent für alle Nutzer direkt unter den Hero.

### Trust, Brand und SEO-Navigation

Trust-Bausteine erfüllen unterschiedliche Detailaufgaben, wiederholen aber dieselbe Kernbotschaft:

- Hero: unabhängig, transparent, aktuell
- Methodik: vier Arbeitsschritte
- Stats: Umfang/Proof
- FAQ: Test- und Finanzierungsmodell
- Brand Statement: Mission plus drei Trust-Links
- Footer: Methodik/Service erneut

Methodik plus Transparenz-FAQ sind substanziell. Stats können als kompakter Proof funktionieren. Brand Statement und die Hero-Signale wiederholen danach überwiegend bereits etablierte Aussagen. Der größte Straffungskandidat ist daher nicht die Methodik, sondern die Kombination aus Brand Statement, Stats und wiederholten Trust-Links.

Die Themen-Navigation wirkt spät als SEO-/Sitemap-Modul und ist weniger vollständig als der Header. Sie sollte entweder einen klaren „weiter stöbern“-Zweck mit vollständiger Produktwelt-Abdeckung erfüllen oder reduziert werden. In der aktuellen Form ist sie halb Navigation, halb interne Linkfläche.

### Zielarchitektur als Korrektur, nicht als Redesign

```text
Header
Hero: Positionierung + 1 primärer Entscheidungsweg + 1 alternativer Weg
Nutzer-/Alltagseinstiege (breiter als nur Futterautomaten)
Vergleichs- bzw. Produktwelt-Orientierung
Kuratierte Produktempfehlungen (kategorie-divers)
Aktuelle Ratgeber / Updates
Methodik + kompakter Proof
Transparenz-FAQ
Kontextueller Berater bei Futterautomaten
Vollständige Weiter-navigation
Footer
```

Dies ist eine Prioritäts- und Auswahlkorrektur. Bestehende Module können wiederverwendet werden.

## E. CTA / Navigation Inventory

| Bereich | Aktion/Ziel | Muster | Befund |
|---|---|---|---|
| Header | Produktwelten | Dropdown/Links | vollständig; wichtigster Kategorieanker |
| Header | Vergleiche | Nav-Link | deckt Hero-Primärziel teilweise doppelt ab |
| Header | Kaufberatung | hervorgehobener Nav-Link | Rolle gegenüber Vergleichen und Berater unklar |
| Header | Wissen, Hersteller | Nav-Links | plausibel |
| Hero | „Vergleiche entdecken“ → `/vergleiche/` | Primary Button | verständlich, direkt danach redundant verstärkt |
| Hero | „Ratgeber lesen“ → `/wissen/` | Secondary Button | verständliche Alternative |
| Decision | 7 Vergleichsziele | Full-card Links | gut scannbar, aber nur 3 Produktwelten |
| Products | 3 Produktziele | Full-card Links + „Produkttest lesen“ | Label kann Evidenzstatus überbehaupten |
| Guides | 4 Ratgeberziele | Full-card Links | plausibel |
| Method | Bewertungsmethode | Textlink | sinnvoller Trust-Drilldown |
| Use Cases | 6 Ziele | Full-card Links | gute Form, zu spät und thematisch eng |
| Recently updated | 3 Inhalte | Full-card Links | sinnvoll, Überschneidung mit Guides möglich |
| FAQ | 5 Details | Disclosure | keine unnötige Navigation |
| Topics | mehrere Wissens-/Serviceziele | Textlinks | spät, unvollständige Sortimentsabbildung |
| Brand | 3 Trust-Ziele | Textlinks | starke Wiederholung der Methodik/FAQ |
| Advisor | `/berater/futterautomat/` | eigener CTA-Pill | wertvoll, aber sehr spät und anders ausgerichtet |
| Footer | Produkt, Entscheidung, Wissen, Service | Linkgruppen | erwartbar, teilweise dritte Wiederholung |

### Handlungshierarchie

Die Hero-Hierarchie Primary/Secondary ist klar. Unklar ist die Gesamtsemantik der drei Entscheidungswege:

1. „Vergleiche entdecken“
2. „Kaufberatung“
3. „Futterautomaten-Berater starten“

Sie unterscheiden sich technisch, aber nicht früh genug konzeptionell: Sammlung, redaktionelle Beratung und interaktiver Auswahlprozess werden nicht sauber voneinander abgegrenzt. Die unmittelbare Wiederholung des Hero-Primärziels durch sieben Vergleichskarten ist als progressive Vertiefung vertretbar; problematischer ist die dritte, sehr späte Beraterlogik.

## F. Accessibility & Interaction Audit

### Positive Befunde

- Ein einzelnes `h1`; nachfolgende Module verwenden überwiegend `h2`/`h3` logisch.
- Hauptaktionen sind echte Links; FAQ verwendet native `details`/`summary`.
- Ganze Karten sind anklickbar und bieten große Touch-Flächen.
- Decorative SVGs und Use-Case-Icons sind `aria-hidden`.
- Projektweite `:focus-visible`-Regeln und zusätzliche Decision-Card-Focus-Regeln sind vorhanden.
- Mobile Navigation besitzt einen ausreichend großen Toggle; in den geprüften Viewports trat kein horizontaler Overflow auf.
- Der Hero-Hintergrund ist als dekorativ verborgen; Text liegt als echtes HTML vor.

### Risiken

- `HomeSection` setzt `aria-labelledby` nur dann sinnvoll, wenn eine Section-ID geliefert wird; die gerenderten Überschriften erhalten jedoch keine korrespondierende `id`. Dadurch sind mehrere Section-Landmarks nicht wie beabsichtigt benannt. Entweder echte ID-Verknüpfung herstellen oder das wirkungslose Attribut entfernen.
- Die sichtbare CTA-Zeile „Produkttest lesen“ suggeriert Hands-on-Teststatus. Die eigene FAQ erklärt zugleich, dass nicht jedes Produkt selbst getestet wurde. Für Produkte mit Hersteller-/Recherche-Evidenz ist dies ein Vertrauens- und Erwartungsrisiko.
- Full-card Links sind gut bedienbar, aber ihre zahlreichen textlichen CTA-Enden erzeugen visuell viele gleichrangige Handlungsaufforderungen. Das erschwert Scanning mehr als die eigentliche Fokusnavigation.
- Die rein symbolischen Use-Case-Pseudoicons sind dekorativ korrekt verborgen, liefern aber visuell nicht für jede Bedeutung eine gleich klare Unterstützung.
- Die mobile Seite ist ohne technische Blockade bedienbar, verlangt aber aufgrund der Reihenfolge sehr langes Scrollen, bevor problemorientierte Auswahl und Advisor erscheinen.

## G. Systemic Findings

Maximalzahl eingehalten: **8 Findings**.

| ID | Severity | Type | Finding | Impact | Confidence |
|---|---|---|---|---|---|
| S1 | high | visual-consistency | Nicht definierte Desktop-Variable setzt Radien zentraler Karten effektiv auf 0 px. | Vertrauen, Scannability | high |
| S2 | high | IA | Frühe Homepage-Wege bilden nur einen Teil des behaupteten Sortiments ab. | Orientation, Conversion | high |
| S3 | high | trust | „Produkttest lesen“ kann nicht-hands-on Produkte als eigene Tests erscheinen lassen. | Vertrauen, Conversion | high |
| S4 | medium | IA | Problemorientierte Auswahl steht nach Publisher-Formaten und Methodik und ist selbst überwiegend Futterautomaten-zentriert. | Orientation, Conversion | high |
| S5 | medium | redundancy | Sechs Trust-/Proof-Berührungspunkte wiederholen Kernargumente und verlängern den Weg zu Entscheidungen. | Scannability, Performance | high |
| S6 | medium | maintainability | Homepage-CSS ist über Core-Basis, V5-Regeln, Projekt-Overrides, Duplikate und `!important` verteilt. | Performance, Vertrauen | high |
| S7 | medium | CTA-hierarchy | Vergleiche, Kaufberatung und interaktiver Berater sind als drei Entscheidungswege nicht klar differenziert. | Orientation, Conversion | medium |
| S8 | medium | visual-consistency | Zwei inkompatible Iconsprachen: kohärente SVG-Line-Icons versus typografische Pseudozeichen. | Scannability, Vertrauen | high |

### Details und Ursachen

**S1 — Kartenradius bricht auf Desktop**  
Root cause ist die Kombination aus `var(--pt-polish-radius-card)` ohne Desktop-Fallback und `!important`. Betroffen sind Decision-, Product- und Editorial-Cards. Dies erklärt einen großen Teil des Eindrucks, der Hero sei als einzige große gerundete Fläche überbetont.

**S2 — Sortimentsversprechen und Homepage-Auswahl driften auseinander**  
Das Header-Menü kennt sechs Produktwelten. Die sieben fixen Decision Cards kennen nur drei; die Use Cases routen überwiegend zu einer; Topic-Gruppen ergänzen die fehlenden Welten nicht zuverlässig. Nutzer müssen die vollständige Taxonomie selbst im Header entdecken.

**S3 — Evidenzstatus und CTA-Sprache widersprechen sich**  
Die FAQ differenziert eigene Tests und recherchierte Bewertungen. Die Produktkarte tut dies nicht. Eine systemische CTA-Logik muss den tatsächlichen Evidenztyp abbilden, statt jeden Eintrag als Produkttest zu bezeichnen.

**S4 — Nutzerproblem kommt zu spät**  
Die Komponente existiert bereits; die Ursache ist Reihenfolge plus Auswahlmodell, nicht fehlendes UI. Eine frühere Position und breitere Ziele würden die IA ohne neue Oberfläche verbessern.

**S5 — Trust verdrängt Entscheidungshilfe**  
Wiederholung ist nicht vollständig nutzlos: Ein kurzer Hero-Proof, Methodik und Transparenz-FAQ haben unterschiedliche Tiefen. Stats, Brand Statement und wiederholte Trust-Links liefern danach aber abnehmenden Zusatznutzen.

**S6 — CSS-Ownership ist nicht eindeutig**  
Der reale Defekt S1 ist Symptom der Kaskade. Gemeinsames `home.css` setzt valide Defaults, die in projektspezifischen Blöcken mehrfach neu definiert werden. Doppelte Mobile-Regeln für Decision Cards erhöhen Breakpoint-Risiko.

**S7 — Drei Begriffe für Entscheidungshilfe**  
Die Oberfläche erklärt nicht, ob „Kaufberatung“ ein Wissensbereich, „Vergleiche“ Ergebnislisten und „Berater“ ein interaktives Tool sind. Weil der Berater erst ganz unten erscheint, kann er diese Hierarchie nicht selbst erklären.

**S8 — Icon-System zerfällt nach Modulgrenze**  
Die Decision-Icons sind kein Problem. Ausschließlich die Use-Case-Pseudoicons sollten auf dieselbe technische und optische Grammatik umgestellt werden.

## H. Local Findings

Maximalzahl eingehalten: **9 Findings**.

| ID | Severity | Type | Finding | Impact | Confidence |
|---|---|---|---|---|---|
| L1 | medium | visual-consistency | Advisor nutzt außerhalb von `.home3` eine andere Breiten- und Gutterlogik. | Scannability | high |
| L2 | medium | responsive | Bei 1440 px wächst der Abschnittsabstand auf rund 101 px; die zusätzliche Fläche erhöht Dichte und Orientierung nicht. | Scannability | high |
| L3 | medium | visual-consistency | Use-Case-Symbole sind zwar zentriert, aber Punkt, Doppelpunkte, Raute und Pfeil besitzen stark verschiedene optische Gewichte. | Scannability | high |
| L4 | medium | accessibility | Mehrere `section`-Elemente erhalten kein wirksam verknüpftes Accessible Name. | Orientierung | high |
| L5 | low | IA | „Neu im Ratgeber“ wird aus Priorität/Aktualität gebaut und ist nicht strikt chronologisch. | Vertrauen | medium |
| L6 | low | redundancy | „Neu im Ratgeber“ und „Zuletzt aktualisiert“ können semantisch und bei Inhalten nahe zusammenrücken. | Scannability | medium |
| L7 | low | visual-consistency | Methodik, Stats und Brand liegen mobil etwa 4 px weiter innen als die Hauptachse. | Scannability | high |
| L8 | low | dark-mode | Homepage-Dark-Flächen mischen semantische Tokens mit hart codiertem `#101f32`. | Maintainability | high |
| L9 | low | performance | Große Hero- und Produktmedien dominieren die mobile Scrollfläche; kein Layoutbruch, aber hohe wahrgenommene Seitenlänge. | Performance, Scannability | medium |

## I. Prioritized Recommendations

Maximalzahl eingehalten: **8 Empfehlungen**.

### P0 — echte Vertrauens-/Logikprobleme

1. **Produkt-CTA an den Evidenzstatus koppeln.** „Produkttest lesen“ nur bei tatsächlich als eigener Test qualifizierten Produkten verwenden; für recherchierte Einordnungen einen evidenzneutralen vorhandenen Begriff einsetzen. Die Source-of-Truth muss das bestehende Test-/Evidence-Feld sein, keine manuelle Homepage-Ausnahme.

### P1 — sichtbare UX- und IA-Korrekturen

2. **Den Radiusdefekt an der Quelle beheben.** `--pt-polish-radius-card` global mit Token-Fallback definieren oder die überschreibende Regel entfernen. Danach Decision-, Product- und Editorial-Cards bei Desktop und Mobile gegen dieselbe Radius-Hierarchie prüfen. Hero-Radius zunächst nicht ändern.

3. **`HomeUseCases` nach vorn verschieben und thematisch verbreitern.** Direkt nach Hero oder kompakter Vergleichsorientierung platzieren. Vorhandene Ziele so auswählen, dass neben Futter auch Ortung, Zugang, Beobachtung und Hygiene als Nutzerprobleme vorkommen; keine neue Komponente nötig.

4. **Dynamische Produktempfehlungen diversifizieren.** Das bestehende Auswahlmodell um eine Kategorie-Diversitätsregel ergänzen, damit drei Homepage-Slots nicht zufällig dieselbe Produktwelt besetzen. Prioritäts- und Evidenzregeln bleiben bestehen.

5. **Entscheidungswege begrifflich und räumlich ordnen.** Vergleiche als Übersicht, Kaufberatung als redaktionelle Orientierung und Berater als interaktiven geführten Flow klar unterscheiden. Den Futterautomaten-Berater näher an den passenden Futter-Kontext setzen und auf die gemeinsame Homepage-Achse bringen.

6. **Trust-Sequenz kürzen.** Hero-Signale kompakt behalten, Methodik als Hauptnachweis und FAQ für Transparenz verwenden. Stats mit Methodik zusammenführen oder verkürzen; Brand Statement nur behalten, wenn es zusätzliche Information statt derselben drei Trust-Links liefert.

### P2 — Polish und technische Konsolidierung

7. **Use-Case-Icons auf das bestehende SVG-Line-System migrieren.** Gleiche ViewBox, Stroke, Containergröße und optische Masse wie Decision Icons; keine neue Iconbibliothek einführen.

8. **Homepage-Style-Ownership konsolidieren.** Für jede Kartenfamilie eine zuständige CSS-Ebene festlegen, doppelte Mobile-Decision-Regeln entfernen, `!important` reduzieren und Dark Surfaces auf semantische Tokens umstellen. Als Regression mindestens 375, 414, 1280, 1440 sowie hell/dunkel prüfen; zusätzlich die Section-Heading-ID-Verknüpfung korrigieren.

## Abschlussentscheidungen

- **Full Redesign erforderlich:** nein.
- **Urteil:** `targeted-cleanup`.
- **Hero-Abrundung reduzieren:** nein, nicht vor Behebung der Desktop-Kartenradien.
- **Icon-System inkonsistent:** ja, lokal zwischen Decision- und Use-Case-Modulen.
- **Informationsarchitektur aus Nutzersicht aufgebaut:** teilweise.
- **Größter Hebel:** vorhandene Nutzerorientierung früher und breiter ausspielen, statt neue Module hinzuzufügen.
- **Produktionsänderungen in diesem Durchlauf:** keine.
