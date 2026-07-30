# Global Decision Journey – Repair 2.0.1

Dieser Patch repariert die fehlgeschlagene Teilinstallation von 2.0.0.

Behoben:

- Unterstützung für den tatsächlichen Vergleichs-Datenblock:
  `const [products, manufacturers, pages, comparisons] = await Promise.all(...)`
- Entfernung der versehentlich im 2.0.0-Payload enthaltenen Feeder-Altdateien
- idempotente Normalisierung bereits geänderter Ratgeber- und Produkt-Templates
- exakt ein Import, ein Datensatz und eine Journey-Komponente pro Template
- Umstellung der Package-Scripts auf die globalen Audit-Namen
- Backup vor allen Änderungen

Installation:

```bash
node 2/install-pfotentechnik-global-decision-journey-repair-2.0.1.mjs
```

Validierung:

```bash
npm --workspace apps/pfotentechnik run test:decision-journeys
npm --workspace apps/pfotentechnik run audit:decision-journeys
npm --workspace apps/pfotentechnik run audit:decision-journeys:strict
npm --workspace apps/pfotentechnik run build
```
