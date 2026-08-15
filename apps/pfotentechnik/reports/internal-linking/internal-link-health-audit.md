# Internal-Link Health Audit 4.0.1

Erstellt: 2026-08-15T20:33:11.854Z

## Zusammenfassung

- Dokumente: 221
- Legacy-Fehler: 0
- Build-verifizierte Laufzeitfehler: 0
- Effektive Strict-Fehler: 0
- Effektive Warnungen: 6
- Erkannte False Positives: 0

## Bewertungslogik

- Der gebaute HTML-Linkziel-Audit ist für 404-Ziele und Selflinks maßgeblich.
- Astro-Seiten und Hub-Routen werden über den tatsächlichen `dist`-Bestand validiert.
- Alias-Konflikte bleiben Governance-Warnungen, bis ein falscher gerenderter Link nachgewiesen ist.
- Strict scheitert nur bei verifizierten Laufzeitfehlern oder deterministischen Architekturfehlern.

## Verifizierte Laufzeitfehler

Keine Befunde.

## Architekturfehler

Keine Befunde.

## False Positives des Quellmodells

Keine Befunde.

## Anchor-Governance

Keine Befunde.

## Weitere Prüfhinweise

- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /hund-hat-durchfall/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /katzentrinkbrunnen-dauerbetrieb-urlaub/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /katzentrinkbrunnen-ohne-filter/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /seniorenhunde-richtig-versorgen/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /trinkbrunnen-fuer-kitten-sicher/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **WARNING · NO_INCOMING_INTERNAL_LINK · advisory:** /wie-kann-technik-gegen-langeweile-helfen/ besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link. — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **INFO · ANCHOR_CONFLICT_RESOLVED_BY_OWNER · advisory:** „automatischer futterspender“ besitzt den eindeutigen Eigentümer /smarte-futterautomaten/ (taxonomy-owner). — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **INFO · ANCHOR_CONFLICT_RESOLVED_BY_OWNER · advisory:** „futterautomat fur grosse hunde“ besitzt den eindeutigen Eigentümer /vergleiche/futterautomat-fuer-grosse-hunde/ (exact-title-owner). — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **INFO · ANCHOR_CONFLICT_RESOLVED_BY_OWNER · advisory:** „futtermenge katze“ besitzt den eindeutigen Eigentümer /futtermenge-katze/ (configured-owner). — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **INFO · ANCHOR_CONFLICT_RESOLVED_BY_OWNER · advisory:** „hundetrinkbrunnen“ besitzt den eindeutigen Eigentümer /trinkbrunnen-hund/ (configured-owner). — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **INFO · ANCHOR_CONFLICT_RESOLVED_BY_OWNER · advisory:** „katze trinkt viel“ besitzt den eindeutigen Eigentümer /katze-trinkt-viel/ (configured-owner). — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **INFO · ANCHOR_CONFLICT_RESOLVED_BY_OWNER · advisory:** „katze trinkt zu wenig“ besitzt den eindeutigen Eigentümer /wie-viel-wasser-braucht-eine-katze/ (configured-owner). — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **INFO · ANCHOR_CONFLICT_RESOLVED_BY_OWNER · advisory:** „trinkbrunnen fur hunde“ besitzt den eindeutigen Eigentümer /trinkbrunnen-hund/ (taxonomy-owner). — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **INFO · ANCHOR_CONFLICT_RESOLVED_BY_OWNER · advisory:** „trinkbrunnen fur katzen“ besitzt den eindeutigen Eigentümer /trinkbrunnen-fuer-katzen-sinnvoll/ (taxonomy-owner). — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **INFO · ANCHOR_CONFLICT_RESOLVED_BY_OWNER · advisory:** „trinkbrunnen reinigen“ besitzt den eindeutigen Eigentümer /katzentrinkbrunnen-richtig-reinigen/ (configured-owner). — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **INFO · ANCHOR_CONFLICT_RESOLVED_BY_OWNER · advisory:** „wasserbedarf hund“ besitzt den eindeutigen Eigentümer /wie-viel-wasser-braucht-ein-hund/ (configured-owner). — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
- **INFO · ANCHOR_CONFLICT_RESOLVED_BY_OWNER · advisory:** „wie oft hund futtern“ besitzt den eindeutigen Eigentümer /fuetterungszeiten-nach-alter/ (configured-owner). — Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.
