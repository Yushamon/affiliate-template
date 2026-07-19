# SEO Platform 3.0 – Metadatenstandard

Die Felder werden schrittweise ergänzt und sind zunächst optional.

## Ratgeber

```yaml
reviewCycle: 180
lastReviewedAt: 2026-07-18
reviewPriority: high

searchIntent:
  primary: informational
  secondary:
    - commercial-investigation
  funnelStage: awareness

cluster:
  key: smarte-futterautomaten
  role: supporting-guide

queryOwnership:
  primary:
    - futterautomat reinigen
  supporting:
    - futterautomat hygiene

sources:
  - title: WSAVA Nutritional Assessment Guidelines
    publisher: WSAVA
    type: guideline
    accessedAt: 2026-07-18
```

## Produkte

```yaml
testStatus: editorial-review
productStatus: active
modelYear: 2026

testScores:
  portioning: 4.4
  reliability: 4.6
  cleaning: 4.1
  app: 3.9
  safety: 4.5
  noise: 4.0
  value: 4.2
```

Zulässige Teststatus:

- `hands-on`
- `editorial-review`
- `manufacturer-data`
- `long-term-test`
- `not-tested`

`hands-on` und `long-term-test` dürfen nur bei einem tatsächlich durchgeführten eigenen Test verwendet werden.
