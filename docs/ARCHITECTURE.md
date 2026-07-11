# Affiliate Platform Architecture

## Vision

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