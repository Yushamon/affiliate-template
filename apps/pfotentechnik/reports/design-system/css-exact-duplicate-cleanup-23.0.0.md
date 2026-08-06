# Exact Duplicate CSS Cleanup 23.0.0

- Modus: write
- geprüfte CSS-/Astro-Dateien: 181
- betroffene Dateien: 4
- entfernte exakt identische Deklarationen: 15
- eingesparte Bytes: 538

## Sicherheitsgrenze

Entfernt werden ausschließlich Wiederholungen innerhalb desselben
Deklarationsblocks, wenn Property und normalisierter Wert exakt identisch sind.

Nicht verändert werden:

- Custom Properties
- Vendor-Prefix-Deklarationen
- gleiche Properties mit unterschiedlichen Werten
- Deklarationen in verschiedenen Selektoren
- Reihenfolge unterschiedlicher Deklarationen

## Dateien

- `apps\pfotentechnik\src\components\product-experience-2\product-gallery-29.css`: 7 Deklarationen, 211 Bytes
- `apps\pfotentechnik\src\styles\pfotentechnik-design-system.css`: 1 Deklarationen, 37 Bytes
- `apps\pfotentechnik\src\styles\pfotentechnik.css`: 3 Deklarationen, 110 Bytes
- `packages\affiliate-core\src\components\Header.astro`: 4 Deklarationen, 180 Bytes
