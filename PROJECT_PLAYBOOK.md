# PLAYBOOK.md

## Universal Affiliate Content Playbook

**Version:** 1.0

Dieses Dokument definiert den verbindlichen Standard für alle Affiliate-Projekte.

Das Playbook ist **projektunabhängig** und kann für beliebige Themen verwendet werden, beispielsweise Balkonkraftwerke, Balkonspeicher, Wärmepumpen, Wallboxen, Haushaltsgeräte, Software oder Finanzprodukte.

Die projektspezifischen Besonderheiten werden **nicht** hier definiert, sondern in einer separaten `PROJECT.md`.

---

# Grundprinzip

Unser Ziel ist nicht, möglichst viel Text zu schreiben.

Unser Ziel ist, die hilfreichste Seite im deutschsprachigen Internet zu erstellen.

Jede Seite muss:

* die Suchintention vollständig beantworten
* dem Nutzer eine Entscheidung erleichtern
* echten Mehrwert bieten
* besser sein als die aktuellen Top-Ergebnisse

SEO dient dem Nutzer und niemals umgekehrt.

---

# Arbeitsweise

Vor jeder neuen Seite oder jeder Überarbeitung gilt derselbe Ablauf.

## 1. Aktuelle Recherche

Vor jeder Markdown-Datei wird recherchiert.

Mindestens geprüft werden:

* Herstellerinformationen
* aktuelle Produktdaten
* neue Modelle
* Firmware- oder Softwareänderungen
* gesetzliche Änderungen
* aktuelle Tests
* seriöse Nutzererfahrungen
* häufige Fragen der Nutzer
* Konkurrenzseiten

Es wird niemals eine Markdown-Datei ohne vorherige Recherche erstellt oder aktualisiert.

---

## 2. Suchintention verstehen

Vor dem Schreiben beantworten wir folgende Fragen:

* Was möchte der Nutzer wirklich wissen?
* Welche Entscheidung möchte er treffen?
* Welche Unsicherheit hat er?
* Welche Folgefragen entstehen anschließend?

Die Seite beantwortet diese Fragen vollständig.

---

## 3. Konkurrenz analysieren

Vor jeder wichtigen Seite wird geprüft:

* Welche Inhalte bieten die Top-Ergebnisse?
* Was fehlt dort?
* Welche Fragen bleiben offen?
* Wie können wir hilfreicher werden?

Unser Ziel ist nicht ähnlich gut zu sein.

Unser Ziel ist besser zu sein.

---

## 4. Erst danach schreiben

Die eigentliche Markdown-Datei entsteht erst nach:

* Recherche
* Suchintention
* Konkurrenzanalyse

---

# Seitenprinzip

Jede Seite beantwortet möglichst früh die wichtigste Frage.

Nicht:

lange Einleitung

Dann irgendwann die Antwort.

Sondern:

Antwort

↓

Einordnung

↓

Details

↓

Kaufberatung

---

# Einleitung

Die Einleitung beantwortet innerhalb weniger Sekunden:

* Worum geht es?
* Für wen ist die Seite?
* Was bekommt der Nutzer?

Maximal drei bis vier kurze Absätze.

Keine langen Geschichten.

---

# Quick Answer

Nach der Einleitung folgt möglichst schnell eine schnelle Antwort.

Geeignet sind:

* Tabelle
* Infobox
* Rechner
* Entscheidungshilfe
* kurze Empfehlung

Der Nutzer soll bereits nach wenigen Sekunden eine erste Entscheidung treffen können.

---

# Tabellen

Tabellen gehören möglichst weit nach oben.

Sie helfen dem Nutzer schneller als Fließtext.

Tabellen beantworten konkrete Fragen.

Beispiele:

* Welche Größe passt?
* Welches Produkt ist besser?
* Welche Leistung wird benötigt?
* Welche Variante lohnt sich?

---

# Rechner

Rechner gehören möglichst weit nach oben.

Rechner werden niemals direkt in Markdown eingebunden.

Sie werden ausschließlich über das Astro-Template anhand des Slugs oder Seitentyps gerendert.

Ein Rechner soll:

* einfach sein
* schnell Ergebnisse liefern
* verständliche Empfehlungen geben

---

# Markdown-Regeln

Markdown enthält ausschließlich den eigentlichen Inhalt.

Markdown enthält keine:

* Astro Imports
* Komponenten
* H1
* FAQ-Blöcke
* manuelle Inhaltsverzeichnisse
* Rechner

Diese Elemente werden vom Template erzeugt.

---

# Textstil

Der Stil ist:

* hilfreich
* verständlich
* präzise
* ruhig
* professionell

Vermeiden:

* Fülltexte
* Marketingfloskeln
* künstliche Verlängerungen
* Keyword-Stuffing
* unnötige Wiederholungen

Jeder Absatz beantwortet eine konkrete Frage.

---

# Designprinzipien

Alle Seiten werden Mobile First gedacht.

Wichtige Regeln:

* kurze Absätze
* große Weißräume
* viele Zwischenüberschriften
* Tabellen früh einsetzen
* Rechner möglichst weit oben
* Infoboxen nutzen
* keine Textwüsten

---

# Komponenten

Komponenten werden ausschließlich über das Template eingebunden.

Beispiele:

* Hero
* Breadcrumbs
* Inhaltsverzeichnis
* FAQ
* Rechner
* Produktboxen
* Vergleichstabellen
* CTA
* Related Articles
* interne Links

Markdown liefert ausschließlich den Inhalt.

---

# FAQ

FAQ stehen ausschließlich im Frontmatter.

Sie werden automatisch gerendert.

Es gibt niemals einen zweiten FAQ-Bereich im Fließtext.

---

# Produktempfehlungen

Produkte werden niemals ohne Begründung empfohlen.

Reihenfolge:

1. Problem erklären
2. Entscheidungskriterien zeigen
3. passende Lösung empfehlen
4. Alternative nennen

Keine aggressive Verkaufssprache.

---

# Seitentypen

## Ratgeber

Standardaufbau:

1. Einleitung
2. Quick Answer
3. Tabelle
4. Erklärung
5. Beispiele
6. Häufige Fehler
7. Kaufberatung
8. Fazit

---

## Rechnerseite

Standardaufbau:

1. Einleitung
2. Rechner
3. Quick Answer
4. Tabelle
5. Erklärung
6. Praxisbeispiele
7. Kaufberatung
8. Fazit

---

## Vergleich

Standardaufbau:

1. kurze Einleitung
2. Gewinner auf einen Blick
3. Vergleichstabelle
4. Gemeinsamkeiten
5. Unterschiede
6. Für wen geeignet?
7. Alternativen
8. Fazit

---

## Produktseite

Standardaufbau:

1. Kurzfazit
2. Für wen geeignet?
3. Vorteile
4. Nachteile
5. technische Daten
6. Praxiseinschätzung
7. Alternativen
8. Fazit

---

## Bestenliste

Standardaufbau:

1. Empfehlung
2. Top-Auswahl
3. Vergleichstabelle
4. Einzelbewertungen
5. Kaufberatung
6. FAQ
7. Fazit

---

# Bilder

Jede wichtige Seite erhält mindestens:

* Hero-Bild
* zwei weitere Bilder

Bilder sollen:

* realistisch wirken
* modern aussehen
* zur Suchintention passen
* keine unnötigen Texte enthalten

---

# Interne Verlinkung

Jede Seite verlinkt sinnvoll auf:

* passende Ratgeber
* Vergleichsseiten
* Produktseiten
* Rechner
* weiterführende Inhalte

Interne Links müssen dem Nutzer helfen.

---

# SEO

Jede Seite muss:

* die Suchintention direkt beantworten
* hilfreicher sein als die Konkurrenz
* strukturierte Tabellen enthalten
* natürliche Sprache verwenden
* FAQ im Frontmatter besitzen
* interne Links enthalten

SEO ist niemals wichtiger als Nutzerhilfe.

---

# Qualitätscheck

Vor jeder Veröffentlichung prüfen:

- Aktuelle Recherche durchgeführt?
- Suchintention beantwortet?
- Konkurrenz analysiert?
- Quick Answer vorhanden?
- Tabelle vorhanden?
- Rechner eingebunden (falls vorhanden)?
- Keine doppelte H1?
- Keine doppelte FAQ?
- Keine Komponenten in Markdown?
- Interne Links vorhanden?
- CTA vorhanden?
- Produktempfehlung sinnvoll?
- Keine Wiederholungen?
- Mobil gut lesbar?
- Mehrwert gegenüber den Top-Ergebnissen vorhanden?

Wenn einer dieser Punkte nicht erfüllt ist, gilt die Seite nicht als fertig.

---

# Projektdateien

Dieses Dokument bleibt für alle Projekte identisch.

Jedes Projekt erhält zusätzlich eine eigene Datei:

```text
PROJECT_BALKONKRAFTWERK.md
PROJECT_WAERMEPUMPE.md
PROJECT_VPN.md
PROJECT_KAFFEE.md
```

Diese Datei beschreibt ausschließlich die projektspezifischen Besonderheiten:

* Zielgruppe
* Kategorien
* Komponenten
* Rechner
* Datenquellen
* interne Linklogik
* Designbesonderheiten
* Tonalität
* Produkttypen

Alle allgemeinen Regeln kommen ausschließlich aus diesem Playbook.

---

# Leitfrage

Vor jeder Veröffentlichung stellen wir uns genau eine Frage:

> **Hilft diese Seite dem Nutzer schneller, verständlicher und besser als die aktuellen Top-Ergebnisse bei Google?**

Wenn die Antwort nicht eindeutig **Ja** lautet, wird die Seite weiter verbessert.