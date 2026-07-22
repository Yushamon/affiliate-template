# PfotenTechnik Mobile Editorial Polish 6.1.4

Dieser Patch wurde gegen den aktuellen Stand von `Yushamon/affiliate-template` abgeglichen.

## Abgeglichene Dateien

- `packages/affiliate-core/src/renderer/PremiumRenderer.astro`
- `packages/affiliate-core/src/styles/ui.css`
- `apps/pfotentechnik/src/styles/pfotentechnik-design-system.css`

## Was konkret geändert wird

### PremiumRenderer

Der Patch nutzt die tatsächlich vorhandenen Klassen:

- `.premium-v3-header`
- `.premium-v3-header-icon`
- `.premium-v3-eyebrow`
- `.premium-v3-mistakes`
- `.premium-v3-checklist`
- `.premium-v3-list`
- `.premium-v3-image`

Dadurch werden Abschnittsmarker kleiner, Fehlerlisten kompakter und die Hunde-Checkliste von neun Einzelkarten zu einer ruhigen Liste innerhalb einer gemeinsamen Fläche.

### FAQ

Die FAQ läuft im Repo über:

- `FAQ.astro`
- `Accordion.astro`
- `.ui-accordion`
- `.ui-accordion-item`

Der Patch entfernt optisch die dunkle Innenleiste, verschiebt den Pfeil nach rechts und reduziert die Höhe der mobilen FAQ-Karten.

### Artikelbilder

Für Markdown- und redaktionelle Bilder wird der vorhandene `.article`-Wrapper genutzt. Bilder erhalten mehr Abstand zum Text und einen konsistenten Radius.

## Installation

Im Root von `affiliate-template`:

```bash
node pfotentechnik-mobile-editorial-polish-6.1.4/install-mobile-editorial-polish-6.1.4.mjs
npm run build:pfotentechnik
```

Der Installer:

1. prüft die erwarteten Repo-Klassen,
2. erstellt Backups der drei Dateien,
3. fügt nur klar markierte Override-Blöcke ein,
4. schreibt ein Installationsmanifest.

## Rückbau

Die Originaldateien liegen nach der Installation unter:

```text
.mobile-editorial-polish-6.1.4-backup-<timestamp>/
```
