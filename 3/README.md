# PfotenTechnik Responsive Image Breakpoints 1.0.0

Dieser Installer reduziert die automatisch generierten Responsive-Image-Stufen auf:

- 480 px
- 768 px
- 960 px
- 1200 px

Ziel:
- weniger WebP-Derivate bei Markdown-Visuals
- kleinerer Build-Output
- schnellerer Astro-Bildprozess
- weiterhin scharfe mobile, Tablet- und Desktopdarstellung
- keine Änderung an Komponenten mit expliziten `widths`

Ausführen im Repository-Root:

```bash
node 3/apply-pfotentechnik-responsive-image-breakpoints-1.0.0.mjs
```

Der Installer führt anschließend aus:

```bash
node --check apps/pfotentechnik/astro.config.mjs
npm run build:pfotentechnik
npm --workspace apps/pfotentechnik run audit:performance:strict
```

Bei einem Fehler wird `astro.config.mjs` automatisch wiederhergestellt.
