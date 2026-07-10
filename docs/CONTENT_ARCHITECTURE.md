

# Content Architecture

## Ziel

Alle Affiliate-Projekte verwenden dieselbe Content-Architektur. Projekte unterscheiden sich nur durch Inhalte, Produkte und Konfigurationen – nicht durch die Struktur.

---

# Seitentypen

Jede Inhaltsseite gehört genau einem Typ an.

| Typ | Zweck |
| --- | --- |
| hub | Themenübersicht |
| knowledge | Wissensartikel |
| decision | Kaufentscheidung |
| product | Produktdetailseite |
| manufacturer | Herstellerseite |
| legal | Impressum, Datenschutz usw. |

---

# Cluster

Cluster beschreiben das übergeordnete Thema einer Seite.

PfotenTechnik:

- ernaehrung
- gesundheit
- alltag
- kaufberatung
- hersteller

Weitere Projekte definieren eigene Cluster.

---

# Frontmatter

Jede Seite darf optional besitzen:

```yaml
hub:
  cluster: ernaehrung
  type: knowledge
  featured: false
  priority: 50
```

Bedeutung:

- cluster
  Ordnet die Seite einem Wissensbereich zu.

- type
  Bestimmt den Seitentyp.

- featured
  Seite erscheint im Hero oder im Empfehlungsbereich.

- priority
  Sortierung innerhalb eines Clusters.

---

# Decision Pages

Decision Pages enthalten ausschließlich redaktionellen Inhalt.

Automatisch gerendert werden:

- Top-Empfehlung
- Vergleich
- Zusammenfassung
- Geeignet für
- Nicht geeignet für
- Kauf-Checkliste
- Typische Fehler
- Alternativen
- Entscheidungsbaum
- Fachquellen

Markdown enthält nur:

- Einleitung
- PremiumRenderer-Blöcke
- Besonderheiten
- Hinweise
- Interne Links
- Fazit

---

# Produktseiten

Produktseiten verwenden ausschließlich Produktdaten aus `products.ts` und die Affiliate Engine.

Produktbilder folgen der Standardstruktur:

```
public/images/products/<product-key>/
```

---

# Herstellerseiten

Herstellerseiten beziehen ihre Informationen ausschließlich aus `manufacturers.ts`.

Produktlisten werden automatisch erzeugt.

---

# Wissens-Hub

Der Wissens-Hub verwendet ausschließlich `hub.cluster`, `hub.type`, `hub.featured` und `hub.priority`.

Keine Heuristiken anhand von Slugs oder Tags.

---

# Designprinzipien

- Convention over Configuration
- Inhalte vor Logik
- Wiederverwendbare Core-Komponenten
- Automatische Produktempfehlungen
- Automatische interne Verlinkung
- Mobile First
- Kurze Ladezeiten
- SEO und E-E-A-T als Standard

---

# Zielbild

Neue Projekte sollen mit minimalem Aufwand entstehen:

1. Projekt konfigurieren
2. Produkte anlegen
3. Hersteller anlegen
4. Inhalte schreiben

Alle anderen Funktionen werden vom Core bereitgestellt.