# PfotenTechnik Content-Playbook

## Grundregel

Ein neuer Inhalt wird durch genau eine Markdown-Datei veröffentlicht. Zusätzliche TypeScript-Listen werden nicht gepflegt. Nach jeder größeren Änderung muss `npm run build:pfotentechnik` erfolgreich sein.

## Produktseite erstellen

1. Datei unter `apps/pfotentechnik/src/content/products/<slug>.md` anlegen.
2. Pflichtdaten gemäß Produktschema ausfüllen: Titel, Slug, Typ, Layout, Beschreibung, Hersteller, Kategorie, Datum, Autor, SEO, Hub, Tags, Bilder, Affiliate-Daten, Bewertung und Review-Daten.
3. Bilder unter `src/assets/images/products/<slug>/` ablegen und relativ referenzieren.
4. Hero und Galerie nach den Regeln in `PRODUCT_IMAGES.md` unterscheiden.
5. Belegbare technische Daten, Stärken, Schwächen, Entscheidungshinweise, Alternativen und FAQ ergänzen.

## Herstellerseite erstellen

1. Datei unter `apps/pfotentechnik/src/content/manufacturers/<slug>.md` anlegen.
2. `hub.sections` enthält `hersteller`.
3. Name, Beschreibung, SEO, Bild, Bewertung, Produktschwerpunkte, Zielgruppen, Stärken, Schwächen, Serien, Produkt-Slugs, Erfahrungen, Alternativen, Quellen und FAQ pflegen.
4. Bilder unter `src/assets/images/manufacturers/<slug>/` ablegen.

## Vergleichsseite erstellen

1. Datei unter `apps/pfotentechnik/src/content/comparisons/<slug>.md` anlegen.
2. `hub.sections` enthält `vergleiche`.
3. Vergleichsfrage, Kriterien, Kandidaten, belegbare Produkt-Slugs, Gewinner beziehungsweise Top-Empfehlung, Grenzen, Quellen und FAQ pflegen.
4. Kandidaten werden über Collection-Beziehungen geladen; keine zweite Vergleichsliste anlegen.

## Wissensseite erstellen

1. Datei unter `apps/pfotentechnik/src/content/pages/<slug>.md` anlegen.
2. `hub.sections` enthält `wissen`.
3. Die Nutzerfrage zuerst direkt und neutral beantworten.
4. Quellen bevorzugt aus Tierarztportalen, Fachgesellschaften, Behörden oder belastbaren Primärquellen verwenden.
5. Ein Produkt nur empfehlen, wenn es die beantwortete Aufgabe nachvollziehbar unterstützt.

## Frontmatter und SEO

Für alle Inhaltstypen gelten mindestens die Pflichtfelder ihres Collection-Schemas. Datumswerte werden immer als Strings geschrieben:

```yaml
publishedAt: "2026-07-13"
updatedAt: "2026-07-13"
```

SEO-Titel und Beschreibung beantworten die Suchintention präzise. Canonicals enden mit `/`. `seo.sitemap`, `priority`, `changefreq` und gegebenenfalls `noindex` steuern die Sitemap und Indexierung.

## Tags, Hubs und Navigation

Tags werden sparsam und konsistent für Related Content und fachliche Beziehungen eingesetzt. Hub-Zuordnungen entscheiden über Übersichten. Navigation wird nur gesetzt, wenn ein Inhalt als Navigationsziel erscheinen soll:

```yaml
navigation:
  show: true
  label: "Wissen"
  section: "wissen"
  order: 60
```

## Bilder

Content-Bilder liegen unter `src/assets/images`, nicht unter `public/images`. Frontmatter nutzt relative Pfade. Alttexte beschreiben das konkrete Motiv; Tiere und Nutzungssituation müssen zum Inhalt passen. Für Produkte gelten die eigenständigen Hero- und Galerie-Motive aus `PRODUCT_IMAGES.md`.

## Build-Prüfung

```bash
npm run build:pfotentechnik
```

Der Schritt ist erst abgeschlossen, wenn Collection-Validierung, statische Routen, Bildoptimierung und Sitemap ohne Fehler erzeugt wurden.
