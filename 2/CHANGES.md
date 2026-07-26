# Technische Änderungen

## Breadcrumbs

`apps/pfotentechnik/src/pages/produkt/[product].astro` rendert die sichtbare `Breadcrumbs.astro`-Komponente nicht mehr. Das bestehende `breadcrumbs`-Property wird weiterhin an `ProjectLayout` übergeben. `AffiliateLayout` erzeugt daraus unverändert das strukturierte `BreadcrumbList`-Schema.

Damit bleibt die SEO-Hierarchie vollständig erhalten, ohne oberhalb der Galerie auf kleinen Displays mehrere Zeilen Navigation zu verbrauchen.

## Deduplizierte Produktlisten

Das neue Modul

```text
src/domain/productExperience/contentLists.ts
```

normalisiert redaktionelle Listenwerte. Es entfernt führende Symbole, vereinheitlicht Leerzeichen und erkennt Duplikate unabhängig von Großschreibung, Bindestrichen, Satzzeichen und Umlauten.

Das Produkt-View-Model verwendet diese Logik für:

- Vorteile
- Nachteile
- Ideal-für-Angaben
- Nicht-geeignet-für-Angaben

Ein Eintrag, der bereits als Einschränkung geführt wird, wird nicht zusätzlich als Vorteil ausgegeben.

## Semantische Symbole

`ProductDetails2.astro` rendert Symbole als eigene, für Screenreader ausgeblendete Elemente. Dadurch kann keine globale Listenformatierung Nachteile versehentlich mit grünen Haken versehen.

## CTA-System

Die finale Theme-Schicht führt folgende semantische Variablen ein:

```css
--pt-cta-primary-bg
--pt-cta-primary-bg-hover
--pt-cta-primary-text
--pt-cta-secondary-bg
--pt-cta-secondary-bg-hover
--pt-cta-secondary-text
```

Primäre CTAs, Kaufberatungs-CTAs und die Preis-CTA verwenden damit dieselbe Theme-Akzentfarbe. Sekundäre CTAs bleiben visuell nachgeordnet, nutzen aber denselben Akzent für Rahmen und Text.
