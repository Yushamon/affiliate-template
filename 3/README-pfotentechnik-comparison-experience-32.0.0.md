# PfotenTechnik Comparison Experience 32.0.0

Kompletter visueller Neuaufbau der Vergleichsseiten, mobile first.

## Architektur

Einziger aktiver CSS-Owner:

`packages/affiliate-core/src/components/comparison/comparison-experience.css`

Aus dem Importpfad entfernt:

- `comparison-system.css`
- `comparison-explorer-v2.css`
- `comparison-tokens.css`

Die alten Dateien bleiben als kleine Tombstones bestehen. Dadurch brechen historische Dateireferenzen nicht, sie erzeugen aber keine CSS-Regeln mehr.

## Dark Mode

Es gibt keine `.dark`, `.theme-dark` oder `[data-theme]`-Regeln.

Alle Flächen, Texte, Borders und Aktionen verwenden ausschließlich globale `--pt-*`-Tokens. Light und Dark werden damit zentral vom bestehenden Theme gelöst.

## Mobile first

- Grundlayout ab 375 px
- 16 px Innenabstand
- keine Mobile-Overrides per `max-width`
- Erweiterung erst ab `min-width: 48rem`
- horizontale semantische Vergleichsmatrix
- sticky Kriterien- und Produktköpfe
- Safe-Area-fähige Sticky CTA
- Filter als Drawer

## Cleanup

- keine Vergleichs-Farbpalette
- keine grünen Vollflächen
- keine festen Grüntöne
- keine eigene Dark-Mode-Kaskade
- kein zweiter Explorer-CSS-Owner
- keine neuen `!important`-Regeln außer `.sr-only`

## Ausführung

```bash
node 3/apply-pfotentechnik-comparison-experience-32.0.0.mjs
```

Der Installer erstellt ein Backup, rollt bei Fehlern zurück und führt aus:

- `node --check`
- neue Architekturtests
- `lint:content`
- Produktions-Build
- Prüfung des gebauten Vergleichs-HTML
