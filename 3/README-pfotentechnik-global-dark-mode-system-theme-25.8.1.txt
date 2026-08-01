PfotenTechnik Global Dark Mode System Theme 25.8.1

Warum 25.8.0 wirkungslos blieb:
Die dunklen Tokens waren nur unter `[data-theme="dark"]` und `.dark`
definiert. Das aktuelle AffiliateLayout setzt weder Attribut noch Klasse.
Diese Selektoren konnten deshalb nie greifen.

25.8.1 löst das zentral:
- Dark Tokens reagieren auf `prefers-color-scheme: dark`
- gilt projektweit über die zentrale Token-Datei
- keine zusätzlichen Regeln in Produktkomponenten
- keine `!important`-Regeln
- `data-theme="light"` bleibt als expliziter Opt-out erhalten
- bestehende `--color-*`- und `--px2-*`-Bridges erben automatisch die
  richtige Palette

Installation:
  node 3/apply-pfotentechnik-global-dark-mode-system-theme-25.8.1.mjs

Danach:
  npm --workspace apps/pfotentechnik run build

Im Browser anschließend hart neu laden.
