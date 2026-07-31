# PfotenTechnik Performance Stylesheet Inline 1.0.0

Ziel:
- reduziert die betroffenen Vergleichs- und Produktseiten von 6 auf maximal 5 externe Stylesheets
- setzt ausschließlich kleine CSS-Chunks bis 5,5 KB inline
- EditorialScore (~4,98 KB) wird integriert
- adapters (~6,47 KB) und imageOptimization (~10 KB) bleiben externe Shared-Chunks
- erhöht keine Performance-Budgets

Ausführen im Repository-Root:

```bash
node 3/apply-pfotentechnik-performance-stylesheet-inline-1.0.0.mjs
```

Validierung:
- Syntaxprüfung der Astro-Konfiguration
- vollständiger Astro-Build
- striktes Performance-Audit
- explizite Prüfung auf verbleibende PERF_RENDER_BLOCKING_STYLESHEET-Befunde

Bei einem Fehler wird astro.config.mjs automatisch wiederhergestellt.
