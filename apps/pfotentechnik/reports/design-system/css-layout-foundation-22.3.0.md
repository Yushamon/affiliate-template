# CSS Layout Foundation 22.3.0

- Migrierte Regeln: 2
- Migrierte Selektoren: .container, .header-container-v2, .footer-inner-v2
- Leere Media Queries entfernt: 1
- Legacy-Datei vorher: 129958 Bytes
- Legacy-Datei nachher: 129548 Bytes
- Layout Layer: 437 Bytes
- Aus Legacy entfernt: 410 Bytes

## Umfang

Dieser Patch migriert bewusst nur die eindeutig identifizierbare gemeinsame
Container-Basis und deren mobile 430-px-Abweichung. Header- und Footer-spezifische
Layoutregeln bleiben an ihrer bisherigen Kaskadenposition.

## Cleanup

- gemeinsame Containerbasis über `:where(...)` mit niedriger Spezifität
- mobile Containerabweichung an unveränderter Breakpoint-Schwelle
- leere Media Queries entfernt
- keine `!important`
- keine Komponenten-, Farb- oder Typografieregeln im Layout Layer
