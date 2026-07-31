# CSS Card System 22.5.0

- Migrierte Regeln: 3
- Doppelte Deklarationen entfernt: 0
- Legacy-Datei vorher: 128851 Bytes
- Legacy-Datei nachher: 128147 Bytes
- Card Layer: 824 Bytes
- Aus Legacy entfernt: 704 Bytes

## Umfang

Migriert werden ausschließlich die drei bestehenden gemeinsamen Kartenregeln:

1. Oberfläche
2. Transition
3. Hover

Unterelemente, Produktspezifika, Vergleichsspezifika und redaktionelle
Sonderkarten bleiben unverändert.

## Interaktionsschutz

`.result-card`, `.premium-block` und `.faq-item` behalten nur die
gemeinsame Oberfläche. Sie werden nicht in den gemeinsamen Hover-Effekt
aufgenommen.
