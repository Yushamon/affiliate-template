# Technische Änderungen

## Dark Mode

Der neue Produktbereich hatte eigene Light-Mode-Variablen, während die ältere globale Theme-Korrektur im Dark Mode nur die Textfarben überschrieben hat. Dadurch entstanden helle Karten mit nahezu weißem Text.

Der Hotfix bindet sämtliche `--px2-*`-Variablen an die zentralen `--pt-theme-*`-Tokens. Damit wechseln Oberflächen, Text, Rahmen, Akzent-, Warn- und Fehlerfarben gemeinsam.

## Kaufentscheidung

Die Engine unterscheidet jetzt:

- `positive`: grüner Haken
- `neutral`: amberfarbener Punkt
- `negative`: rotes X

GPS-Tracker, Trinkbrunnen und andere Nicht-Futterautomaten erhalten fünf Fragen. Trocken- und Nassfutter werden dort weder gerendert noch in Score oder Vollständigkeit einbezogen.

Alternativen enthalten nun ein eigenes Decision Profile. Dieselben Nutzerantworten werden live gegen jede Alternative gerechnet. Angezeigt wird nur eine Alternative mit mindestens fünf Punkten höherem persönlichen Fit. Fehlt ein alternatives Decision Profile, dient ein mindestens fünf Punkte höherer redaktioneller Score als Fallback.

## Manuelle Preise

Der Price Source Type wurde um `manual` erweitert. Das SEO Cockpit schreibt über eine lokale Admin-Route atomar in das Produkt-Frontmatter:

```yaml
price:
  current: 119
  currency: "EUR"
  status: "unknown"
  checkedAt: "..."
  affiliateUrl: "https://..."
  source:
    id: "manual"
    label: "Hersteller-Shop"
    type: "manual"
```

Die Kategorie-Range und die Preisbewertung bleiben abgeleitet und werden nicht manuell dupliziert.
