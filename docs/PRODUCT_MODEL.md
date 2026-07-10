# Content Architecture

Version: 1.0

Dieses Dokument definiert die inhaltliche Architektur aller Affiliate-Projekte innerhalb des Monorepos.

Neue Projekte sollen dieselbe Architektur verwenden. Unterschiede entstehen ausschließlich durch Inhalte, Produkte und Konfigurationen – nicht durch die technische Struktur.

---

# Grundprinzipien

## 1. Convention over Configuration

Alle Projekte folgen denselben Konventionen.

Je weniger Sonderfälle existieren, desto einfacher werden Wartung, Weiterentwicklung und Automatisierung.

---

## 2. Daten statt Logik

Produkte, Hersteller und Seiten beschreiben ausschließlich ihre Eigenschaften.

Renderer, Engines und Komponenten treffen Entscheidungen anhand dieser Daten.

Nicht umgekehrt.

---

## 3. Core First

Alles, was mindestens zwei Projekte verwenden können, gehört in den `affiliate-core`.

Projektlogik bleibt innerhalb der jeweiligen App.

---

# Seitentypen

Jede Inhaltsseite gehört genau einem Seitentyp an.

| Typ | Beschreibung |
| --- | --- |
| hub | Themenübersicht |
| knowledge | Wissensartikel |
| decision | Kaufentscheidung |
| product | Produktdetailseite |
| manufacturer | Herstellerseite |
| legal | Impressum, Datenschutz usw. |

---

# Cluster

Cluster beschreiben Themenbereiche innerhalb eines Projekts.

Beispiel PfotenTechnik:

* Ernährung
* Gesundheit
* Alltag
* Kaufberatung
* Hersteller

Jedes Projekt definiert seine eigenen Cluster.

---

# Produkte

Alle Produktinformationen werden ausschließlich in

```
products.ts
```

gepflegt.

Produkte enthalten unter anderem:

* Hersteller
* Bilder
* Affiliate Links
* Bewertungen
* Rankings
* Spezifikationen
* Use Cases
* Highlights
* Vorteile
* Nachteile

Produktseiten greifen ausschließlich auf diese Daten zu.

---

# Hersteller

Alle Herstellerinformationen werden ausschließlich in

```
manufacturers.ts
```

verwaltet.

Herstellerseiten erzeugen Produktlisten automatisch.

Produktinformationen werden niemals doppelt gepflegt.

---

# Decision Engine

Decision Pages definieren lediglich:

```
decisionKey
```

Die Engine erzeugt automatisch:

* Produktempfehlungen
* Vergleich
* Top-Empfehlung
* Kauf-Checkliste
* Geeignet für
* Nicht geeignet
* Typische Fehler
* Alternativen
* Entscheidungsbaum
* Fachquellen

Markdown enthält ausschließlich den redaktionellen Teil.

---

# Premium Renderer

Markdown enthält keine Komponenten.

PremiumRenderer rendert automatisch:

* Kurzantwort
* Quick Facts
* Hero-Bereiche
* Entscheidungshilfen
* Premium-Blöcke

Der Renderer entscheidet ausschließlich anhand der Frontmatter.

---

# Link Engine

Interne Links werden grundsätzlich automatisch erzeugt.

Quellen:

* Produkte
* Hersteller
* Decision Pages
* Wissensseiten
* manuelle Hub-Links

Markdown enthält im Fließtext keine internen Links.

Ausnahmen:

* CTA-Blöcke
* Tabellen
* Navigation
* Footer
* "Weitere passende Ratgeber"

---

# Context-System

Links können optional einen Kontext besitzen.

Beispiel:

```yaml
contexts:
  - futterautomaten
```

Dadurch kann derselbe Begriff in unterschiedlichen Themenbereichen auf unterschiedliche Zielseiten verweisen.

Beispiel:

```
Welpen
```

innerhalb

```
Futterautomaten
```

↓

Decision Page

innerhalb

```
GPS Tracker
```

↓

GPS Decision Page

---

# Bilder

Projektbilder

```
projectImages
```

Produktbilder

```
public/images/products/<product-key>/
```

Seitenbilder

```
public/images/pages/<slug>/
```

Standard:

```
hero.webp
```

---

# Wissens-Hub

Der Wissens-Hub gruppiert Inhalte ausschließlich anhand strukturierter Daten.

Nicht anhand von Slugs.

Nicht anhand von Dateinamen.

Nicht anhand von regulären Ausdrücken.

Langfristig erfolgt die Gruppierung über:

```yaml
hub:
  cluster:
  type:
  featured:
  priority:
```

---

# Affiliate Links

Affiliate Links stammen ausschließlich aus der Affiliate Engine.

Markdown enthält niemals direkte Affiliate Links.

---

# Produktmodell

Jedes Produkt besitzt mindestens:

* Hersteller
* Produktname
* Bilder
* Affiliate Links
* Bewertungen
* Rankings
* Spezifikationen
* Highlights
* Vorteile
* Nachteile
* Empfehlung
* Use Cases

Geplant:

* Preis
* Lifecycle
* Verfügbarkeit

---

# Preis

Produkte erhalten künftig:

```ts
price
```

mit:

* aktueller Preis
* Währung
* Quelle
* Prüfdatum
* Preisniveau

Preis beeinflusst nicht die Qualitätsbewertung.

Preis beeinflusst ausschließlich den Value Score.

---

# Lifecycle

Produkte erhalten künftig:

```ts
lifecycle
```

mit:

* Veröffentlichungsdatum
* Modelljahr
* Generation
* Status
* Nachfolger
* Vorgänger

Dadurch können veraltete Produkte automatisch erkannt und eingeordnet werden.

---

# SEO

Jede Seite beantwortet die Suchintention möglichst früh.

Interne Verlinkung erfolgt automatisch.

Produktdaten werden niemals doppelt gepflegt.

Jede Seite gehört genau einem Cluster und einem Seitentyp an.

---

# Mobile First

Alle Komponenten werden zuerst für Smartphones entwickelt.

Desktop erweitert lediglich das Layout.

---

# Qualitätsstandards

Alle Inhalte erfüllen folgende Regeln:

* kurze Einleitung
* klare Suchintention
* keine Fülltexte
* keine doppelten Inhalte
* strukturierte Überschriften
* automatische interne Verlinkung
* Wiederverwendung vorhandener Daten
* hochwertige Bilder
* E-E-A-T als Standard

---

# Zielbild

Ein neues Projekt benötigt lediglich:

* Projektkonfiguration
* Produkte
* Hersteller
* Inhalte

Alle anderen Funktionen werden automatisch durch den `affiliate-core` bereitgestellt.