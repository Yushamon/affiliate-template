# Content Architecture

Version: 1.0

Dieses Dokument beschreibt die Architektur aller Affiliate-Projekte.

Neue Projekte sollen dieselbe Struktur verwenden.

---
## Grundprinzip

Jede Seite beantwortet genau eine Hauptfrage des Nutzers.

Die Informationsarchitektur orientiert sich an Entscheidungen, nicht an Themen.
PfotenTechnik ist ein Entscheidungsportal für smarte Haustiertechnik. Jede Seite hilft dem Besucher, genau eine Entscheidung sicher und nachvollziehbar zu treffen.
Beispiele:

• Herstellerseite → Welcher Hersteller passt zu mir?
• Produktseite → Soll ich dieses Produkt kaufen?
• Vergleich → Welches Produkt ist besser?
• Decision Page → Welche Lösung passt zu meinem Anwendungsfall?
• Wissensseite → Wie funktioniert das?
# Grundprinzipien

Das Framework folgt drei Regeln.

## 1. Convention over Configuration

Inhalte folgen festen Konventionen.

Je weniger individuelle Sonderfälle existieren, desto einfacher wird die Pflege.

---

## 2. Daten statt Logik

Produkte, Hersteller und Seiten beschreiben ihre Eigenschaften.

Renderer, Engines und Komponenten entscheiden anhand dieser Daten.

Nicht umgekehrt.

---

## 3. Wiederverwendbarkeit

Alles, was mindestens zwei Projekte nutzen können, gehört in den affiliate-core.

Projektlogik bleibt innerhalb der jeweiligen App.

---

# Content-Typen

Jede Seite besitzt genau einen Content-Typ.

| Typ | Beschreibung |
|------|--------------|
| hub | Themenübersicht |
| knowledge | Wissensartikel |
| decision | Entscheidungshilfe |
| product | Produktdetailseite |
| manufacturer | Herstellerseite |
| legal | Impressum, Datenschutz usw. |

---

# Cluster

Cluster gruppieren Inhalte.

PfotenTechnik

* Ernährung
* Gesundheit
* Alltag
* Kaufberatung
* Hersteller

Weitere Projekte definieren eigene Cluster.

---

# Produktdaten

Alle Produktinformationen liegen ausschließlich in

```
products.ts
```

Dort befinden sich

* Bewertungen
* Spezifikationen
* Bilder
* Hersteller
* Affiliate Links
* Rankings
* Use Cases

Produktseiten greifen ausschließlich auf diese Daten zu.

---

# Hersteller

Alle Herstellerdaten liegen ausschließlich in

```
manufacturers.ts
```

Herstellerseiten enthalten keine doppelten Produktinformationen.

Produktlisten werden automatisch erzeugt.

---

# Decision Engine

Decision Pages definieren lediglich

```
decisionKey
```

Die Engine erzeugt automatisch

* Produktempfehlungen
* Vergleich
* Kauf-Checkliste
* Geeignet für
* Nicht geeignet
* Typische Fehler
* Alternativen
* Entscheidungsbaum
* Quellen

Markdown enthält ausschließlich redaktionellen Inhalt.

---

# Link Engine

Interne Links werden nicht manuell gepflegt.

Der Renderer erzeugt sie automatisch.

Quellen

* Produkte
* Hersteller
* Decision Pages
* manuelle Hub Links

Später zusätzlich

* Wissensseiten

---

# Context-System

Interne Links besitzen optional

```
contexts
```

Beispiel

```
contexts:

- futterautomaten
```

Dadurch kann derselbe Begriff in unterschiedlichen Themen auf verschiedene Ziele zeigen.

Beispiel

Welpen

↓

Futterautomaten

↓

Decision Page

oder

GPS Tracker

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
public/images/products/<product>
```

Seitenbilder

```
public/images/pages/<slug>
```

Hero

```
hero.webp
```

---

# Wissens-Hub

Der Wissens-Hub gruppiert Seiten nach

* Cluster
* Typ

Nicht anhand von Slugs.

Nicht anhand von Tags.

---

# PremiumRenderer

Markdown enthält keine Komponenten.

PremiumRenderer rendert

* Hero
* QuickFacts
* Answer
* Decision Box
* usw.

automatisch.

---

# Produktmodell

Jedes Produkt besitzt

* Ranking
* Bewertungen
* Spezifikationen
* Bilder
* Hersteller
* Use Cases

Geplant

* Preis
* Lifecycle

---

# Preis

Produkte erhalten künftig

```
price
```

mit

* Preis
* Quelle
* Datum
* Preisniveau

Preis beeinflusst später

nicht

die Qualität,

sondern

den

Value Score.

---

# Lifecycle

Produkte erhalten künftig

```
lifecycle
```

mit

* Veröffentlichungsdatum
* Generation
* Status
* Nachfolger

Dadurch können veraltete Produkte später automatisch erkannt werden.

---

# SEO

Alle Seiten beantworten die Suchintention möglichst früh.

Interne Verlinkung erfolgt automatisch.

Produktdaten werden nicht mehrfach gepflegt.

---

# Mobile First

Alle Komponenten werden zuerst für Smartphones entwickelt.

Desktop ist lediglich eine Erweiterung.

---

# Affiliate

Affiliate Links stammen ausschließlich aus

Affiliate Engine

Nicht aus Markdown.

---

# Zielbild

Ein neues Projekt benötigt lediglich

* Produkte
* Hersteller
* Seiten

Alle anderen Funktionen stellt der Core bereit.