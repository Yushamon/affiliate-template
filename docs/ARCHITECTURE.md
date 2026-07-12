# Affiliate Platform Architecture

## Vision
# Architekturprinzipien

## 1. Single Source of Truth

Jede Content-Datei beschreibt sich vollständig selbst.

Es darf niemals notwendig sein, eine zweite Datei anzupassen, damit eine neue Seite im Portal erscheint.

---

## 2. Content First

Navigation, Hubseiten, Related Articles, Breadcrumbs, Sitemap und interne Verlinkungen werden aus den Metadaten der Content-Datei generiert.

Nicht umgekehrt.

---

## 3. Core bleibt generisch

Der Core kennt keine Projekte, Produkte oder Kategorien.

Er enthält ausschließlich wiederverwendbare Komponenten und Logik.

---

## 4. Domainwissen gehört ins Projekt

Fachliche Regeln werden ausschließlich innerhalb des jeweiligen Projekts definiert.

Beispiel:

apps/pfotentechnik/src/domain/

apps/balkonspeicher/src/domain/

---

## 5. Komponenten rendern

Komponenten treffen keine fachlichen Entscheidungen.

Sie stellen ausschließlich Daten dar.

---

## 6. Daten beschreiben

Daten enthalten Informationen.

Keine Logik.

---

## 7. Domain entscheidet

Die Domain verbindet Daten mit Komponenten.

Sie enthält sämtliche fachlichen Regeln.
Die Plattform ist ein wiederverwendbares Affiliate-Framework für beliebig viele Projekte und Produktkategorien.

Beispiele:

* Balkonspeicher
* PfotenTechnik
* Smart Home
* Camping
* Werkzeug

Die Plattform besteht aus einem generischen Core und projektspezifischen Domains.

---

# Architektur

Affiliate Platform

↓

Core

↓

Projekt

↓

Domain

↓

Content

↓

Daten

---

# Core

Der Core enthält ausschließlich wiederverwendbare Funktionen und UI-Komponenten.

Er kennt keine Produkte, Marken oder Kategorien.

Beispiele:

* Hero-Komponenten
* Produktkarten
* Tabellen
* FAQ
* Vergleichskomponenten
* CTA-Komponenten
* Bewertungskomponenten

Nicht erlaubt:

* Hund
* Katze
* Balkonspeicher
* PV
* RFID
* Nassfutter

Der Core kennt ausschließlich Datenstrukturen.

---

# Projekte

Jedes Projekt besitzt:

* project.config.ts
* eigene Daten
* eigene Bilder
* eigene SEO
* eigene Domains
* eigene Regeln

Beispiel:

apps/
    pfotentechnik/

apps/
    balkonspeicher/

---

# Domains

Fachliche Logik gehört niemals in den Core.

Sie wird innerhalb eines Projekts in Domains organisiert.

Beispiel:

domain/

    manufacturerHero/

    productHero/

    productRecommendations/

    productAlternatives/

    seo/

    calculators/

---

# Kategorien

Jede Produktkategorie besitzt eigene Regeln.

Beispiel:

productAlternatives/

    categories/

        futterautomaten.ts

        trinkbrunnen.ts

        katzentoiletten.ts

        gpsTracker.ts

Später:

balkonspeicher/

    categories/

        speicher.ts

        wechselrichter.ts

        balkonkraftwerke.ts

---

# Daten
Jede Seite beschreibt sich selbst vollständig im Frontmatter. Navigation, Hubseiten, interne Verlinkung und SEO werden daraus automatisch generiert. Das reduziert Pflegeaufwand erheblich und sorgt dafür, dass neue Inhalte nur an einer Stelle angelegt werden müssen
Daten enthalten ausschließlich Informationen.

Keine Logik.

Beispiele:

products.ts

manufacturers.ts

productReviews.ts

faq.ts

images.ts

---

# Regeln

Der Core rendert.

Die Domain entscheidet.

Die Daten beschreiben.

Content erklärt.

---

# Komponenten

Eine Komponente besitzt genau eine Verantwortung.

Beispiele:

ProductHero

ProductDecisionSection

ProductRatingGrid

ProductExperienceSection

AlternativeRecommendationCard

ProductSpecificationTable

ManufacturerHero

ManufacturerRecommendationSection

---

# Wiederverwendung

Neue Projekte sollen möglichst ohne Änderungen am Core entstehen.

Neue Produktkategorien sollen ausschließlich durch neue Domain-Regeln ergänzt werden.

---

# Entscheidungsprinzip

Jeder Abschnitt beantwortet genau eine Nutzerfrage.

Beispiele:

Hero

→ Ist das Produkt gut?

Passt zu mir?

→ Ist das Produkt für meinen Anwendungsfall geeignet?

Bewertung

→ Wie gut ist das Produkt?

Stärken und Schwächen

→ Wo liegen die größten Vor- und Nachteile?

Erfahrungen

→ Wie schlägt sich das Produkt im Alltag?

Alternativen

→ Wann würden wir stattdessen ein anderes Produkt empfehlen?

Technische Daten

→ Welche Details sollte ich kennen?

FAQ

→ Welche Fragen bleiben noch offen?

---

# Entwicklung

Vor jeder neuen Funktion wird entschieden:

1. Gehört sie in den Core?
2. Gehört sie in ein Projekt?
3. Gehört sie in eine Domain?
4. Gehört sie in die Daten?
5. Gehört sie in den Content?

Nur wenn diese Reihenfolge eingehalten wird, bleibt die Plattform langfristig wartbar und erweiterbar.