# PfotenTechnik Editorial Structural Hard Fix 6.1.3

Dieser Patch korrigiert die Fehler direkt an ihrer Quelle.

## Warum 6.1.2 auf der Live-Seite nicht vollständig sichtbar war

Im Repository steht der CTA bereits auf „Produkt ansehen“. Zeigt Production weiterhin „Produktdetails ansehen“, läuft dort noch ein älterer Build oder ein gecachter Deploy.

6.1.3 setzt die wichtigen Layoutregeln direkt in `PremiumRenderer.astro`, statt sie nur an eine globale CSS-Datei anzuhängen.

## Änderungen

- Komponenten-CSS direkt im Renderer
- Hero-Bild statt Thumbnail für redaktionelle Produktkarten
- quadratischer, vollständig sichtbarer Produktbildbereich
- CTA „Produkt ansehen“ als stabiler Button
- keine gemeinsame Hintergrundfläche für aufeinanderfolgende Blöcke
- mobile Blocküberschriften über die volle Breite
- Produktkarten und Highlights strukturell stabil
- konkrete Doppelempfehlungen auf `futterautomat-hund.md` entfernt
- Szenarien dort in neutrale Anforderungen umgebaut
- konkrete Modelle erscheinen nur noch im Produktmodul

## Installation

```bash
node pfotentechnik-editorial-structural-hard-fix-6.1.3/install-editorial-structural-hard-fix-6.1.3.mjs
npm run build:pfotentechnik
```

Danach muss der neue Build tatsächlich deployed werden. Ein lokaler Installer ändert nicht automatisch die bereits veröffentlichte Website.

Bei CDN-/Browser-Cache anschließend hart neu laden.

## Prüfen

```text
/futterautomat-hund/
/futterautomat-bei-uebergewicht/
```

## Hinweis zum rosa Screenshot-/Teilen-Widget

Das sichtbare rosa Widget mit Screenshot-Vorschau und Stift-/Teilen-Schaltflächen stammt vom Smartphone beziehungsweise Browser. Es ist kein Element von PfotenTechnik und kann nicht zuverlässig durch Website-CSS entfernt werden.

## Rollback

```bash
node pfotentechnik-editorial-structural-hard-fix-6.1.3/rollback-editorial-structural-hard-fix-6.1.3.mjs
```
