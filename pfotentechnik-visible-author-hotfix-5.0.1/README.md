# Pfotentechnik Visible-Author Hotfix 5.0.1

Behebt den Buildfehler:

```text
ReferenceError: Cannot access 'visibleAuthor' before initialization
```

## Anwendung

Im Root von `Yushamon/affiliate-template`:

```bash
python3 apply-pfotentechnik-visible-author-hotfix-5.0.1.py
npm run build:pfotentechnik
```

Der Installer:

- verändert ausschließlich `packages/affiliate-core/src/layouts/AffiliateLayout.astro`
- verschiebt `visibleAuthor` vor die Berechnung von `authorUrl`
- entfernt den unnötigen zweiten Fallback auf `siteMeta.defaultAuthor.url`
- erstellt vor der Änderung automatisch ein Backup
- bricht ab, falls der erwartete Dateistand nicht exakt gefunden wird
