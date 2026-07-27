# Component Adoption Recovery 11.5.1

## Ergebnis

- Geänderte Dateien: **4**
- Ergänzte `pt-button`-Klassen: **13**
- Ergänzte `pt-chip`-Klassen: **0**
- Ergänzte `pt-control`-Klassen: **0**

## Geänderte Dateien

- `apps/pfotentechnik/src/components/admin/SearchIntegrations.astro`
- `apps/pfotentechnik/src/pages/[slug].astro`
- `apps/pfotentechnik/src/pages/admin/seo/prices.astro`
- `apps/pfotentechnik/src/pages/kaufberatung.astro`

## Korrektur

Der ursprüngliche Installer hat bestimmte mehrzeilige statische Klassenattribute nicht vollständig verarbeitet. Der Recovery-Lauf verwendet deshalb eine mehrzeilige, attributspezifische Erkennung und dedupliziert gleichzeitig die Audit-Ausgabe.
