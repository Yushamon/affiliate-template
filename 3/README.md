# PfotenTechnik Comparison Premium UI Fix 15.3.3

Dieser Patch setzt auf dem installierten Editorial-Cover-Release 15.2.3 auf.

## Behoben

- Slug-spezifische Hero-Bilder aus `apps/pfotentechnik/src/assets/images/project/pfotentechnik/comparison/` haben immer Vorrang.
- `data.heroImage` kann den Comparison-Asset-Resolver nicht mehr übergehen.
- Kontextabhängige Standardfilter:
  - Hunde-Vergleich → Hund
  - Katzen-Vergleich → Katze
  - ohne WLAN → passender Offline-/Manuell-Wert
  - mit App, Kamera, Akku, Nassfutter und ohne Abo entsprechend
- Filterzustand wird in der URL gehalten.
- Reset stellt den sinnvollen Seitenstandard wieder her.
- Dark Mode, Filterkarten, Top-Empfehlung, Sticky CTA und mobiles Menü werden konsolidiert.
- Safe-Area-Abstand auf Mobilgeräten wird berücksichtigt.

## Ausführung

```bash
node pfotentechnik-comparison-premium-ui-fix-15.3.3/apply-pfotentechnik-comparison-premium-ui-fix-15.3.3.mjs
```

Optional ohne Prüfungen:

```bash
node pfotentechnik-comparison-premium-ui-fix-15.3.3/apply-pfotentechnik-comparison-premium-ui-fix-15.3.3.mjs --skip-checks
```

## Validierung

Der Installer führt standardmäßig `design-system:check`, Comparison-Audits, Design-System-Audits, Visual-QA und den Astro-Build aus. Ein nicht vorhandenes generisches `check`-Script wird nicht mehr vorausgesetzt.


## CSS-Budget-Recovery

15.3.3 entfernt automatisch mögliche Altdateien aus den Teilausführungen 15.3.0 und 15.3.1 sowie deren Imports. Der verbleibende Fix wird kompakt in `comparison-editorial-cover.css` integriert. Die CSS-Baseline wird ausdrücklich nicht angehoben.


## Budget-Validierung 15.3.3

Der Installer erfasst das CSS-Budget vor und nach dem Patch. Er bricht ab, wenn sich ein Messwert durch den Patch verschlechtert.

Eine bereits vor dem Patch bestehende Überschreitung der globalen Repository-Baseline wird weiterhin vollständig ausgegeben, blockiert aber nicht mehr fälschlich den Comparison-Release. Die Baseline wird nicht verändert.
