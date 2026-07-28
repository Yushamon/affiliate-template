# SEO Co-Pilot Work Packages 2.0.0

## Ziel

Der SEO Co-Pilot führt fachlich zusammengehörige Befunde nicht mehr nur als isolierte Einzelkarten, sondern als begrenzte Codex-Arbeitspakete. Ein Paket bleibt vom ersten Vorschlag bis zur technischen Prüfung, Search-Nachmessung oder begründeten Zurückstellung nachvollziehbar.

## Paketbildung

Die Paketbildung startet mit Advisor-Aufgaben und lokal auditierbaren Product-Health-Befunden. Bei Product Health werden nur Befunde aufgenommen, die in einer vorhandenen Produktdatei ohne reine Herstellerrecherche, Providerzugriff oder Bildgenerierung bearbeitet und mit dem vorhandenen Produkt-Audit geprüft werden können. Produktentdeckung, neue Produktkandidaten, Produktanlage, Bildgenerierung, unvalidierte Herstellerdaten und Provider-Blocker bleiben außerhalb dieses Workflows.

Die Reihenfolge der Gruppierung ist bewusst konservativ:

1. semantisch gleichwertige Aufgaben werden dedupliziert,
2. Aufgaben derselben Quelldatei werden bevorzugt zusammengeführt,
3. anschließend wird nur innerhalb derselben Paketfamilie und desselben Prüfmodus gebündelt,
4. Low-Confidence-Aufgaben bleiben von eindeutig belegten Arbeiten getrennt,
5. ein Paket enthält höchstens vier Aufgaben und höchstens fünf Dateien.

Paketfamilien:

- `technical-structure`
- `eeat-content-quality`
- `ranking-snippet`
- `search-intent-content-gap`
- `product-health`

Prüfmodi:

- `immediate`: Build und feste Audits können direkt prüfen.
- `search-window`: technische Umsetzung wird sofort geprüft, die Search-Wirkung erst später.
- `manual`: für Befunde ohne seriös automatisierbare Entscheidung.

## Impact-Formel

Der Paket-Impact ist auf 0 bis 100 begrenzt. Er verwendet nicht die bloße Summe aller Einzel-Scores. Berücksichtigt werden:

- höchster Einzel-Score: 35 Prozent
- durchschnittlicher Einzel-Score: 12 Prozent
- expliziter Impact: 16 Prozent
- Confidence: 12 Prozent
- strategischer Seitentyp: 10 Prozent
- Anteil der High-Priority-Aufgaben: 20 Prozent
- Aufwand: moderater Malus von 1,25 Punkten je durchschnittlicher Aufwandseinheit

Die Sortierung aktiver Pakete erfolgt deterministisch nach:

1. `needs-work`
2. `review-due`
3. höchste Paketpriorität
4. Paket-Impact
5. Confidence
6. geringerem Aufwand
7. stabiler Paket-ID

Damit verdrängen mehrere kleine Low-Priority-Aufgaben kein einzelnes wichtiges High-Priority-Paket. Der bestehende Ranking- und CTR-Bonus bleibt nur für den separaten Traffic-Fokus relevant.

## Codex-Prompt

Jedes Paket erzeugt einen vollständigen Prompt mit:

- Paket-ID, Zeitraum, Familie, Priorität, Impact, Confidence und Prüfmodus
- festem Dateiscope
- jeder Task-ID mit URL oder Query, Quelldatei, Problem, Datenbasis, nächster Aktion, Einzelschritten und Akzeptanzkriterien
- gemeinsamen Validierungsbefehlen nur am Ende
- Grenzen gegen unnötige Architekturänderungen, neue Dependencies, unbegründete URL-Änderungen und pauschale Inhaltsneufassungen
- separater Kennzeichnung unsicherer oder blockierter Teilaufgaben
- abschließendem JSON-Manifest

Das Manifest ist nicht vertrauenswürdig genug, um einen Paketstatus allein zu ändern. Es wird höchstens als Zusatzinformation gespeichert. Die Entscheidung trifft der Co-Pilot aus festen Audits und aktuellen Befunden.

Secret-ähnliche Werte werden vor Ausgabe redigiert.

## Statusautomat

Unterstützte Zustände:

- `open`
- `sent-to-codex`
- `verification-pending`
- `waiting-window`
- `review-due`
- `needs-work`
- `verified`
- `snoozed`

### Übergabe an Codex

Beim Kopieren oder expliziten Übergeben wird `sent-to-codex` gespeichert. Die Task-IDs des Pakets werden aus Top 5, Chancen, Quick Wins, Forecast-Dubletten und der Einzelprompt-Liste unterdrückt. Gleiches gilt für fällige Nachmessung, laufende Prüfung, Wartefenster, Nacharbeit, verifizierte und zurückgestellte Pakete. Das Paket selbst bleibt sichtbar. Verändert sich die übrige Befundmenge, bleiben bereits beanspruchte Task-IDs beim gespeicherten Paket und erzeugen kein zweites offenes Paket.

### Sofortige Prüfung

Nur fest erlaubte Kommandos können ausgeführt werden:

- `npm --workspace apps/pfotentechnik run lint:content`
- `npm --workspace apps/pfotentechnik run build:content-graph`
- `npm --workspace apps/pfotentechnik run audit:products:strict`
- `npm --workspace apps/pfotentechnik run seo:release:check:no-build`
- `npm run build:pfotentechnik`

Die Auswahl hängt von Paketfamilie und Scope ab. Es gibt keine generische Shell-Aktion. Nach den Prüfungen wird die Advisor-Datenquelle über die bestehende feste Rebuild-Funktion neu aufgebaut. Auch dieser interne Schritt ist verpflichtend und wird als bestandene oder nicht bestandene Prüfung gespeichert. Danach wird das Paket zunächst `verification-pending`. Nach dem Reload übermittelt die neu gerenderte Admin-Seite die aktuellen Task-IDs des gewählten Zeitraums. `reconcile` vergleicht sie serverseitig mit dem gespeicherten Paketsnapshot. Das Codex-Manifest ändert diese Entscheidung nicht:

- Immediate-Paket, Prüfungen bestanden und Task-IDs verschwunden: `verified`
- Immediate-Paket mit verbliebenem Befund oder fehlgeschlagener Prüfung: `needs-work`
- Search-Paket mit bestandenen technischen Prüfungen vor dem Prüffenster: `waiting-window`, auch wenn der alte Search-Befund noch sichtbar ist
- Search-Fenster erreicht, aber kein neuer Sync: weiterhin `waiting-window`
- Search-Fenster erreicht, neuer Sync vorhanden und Befund weiterhin aktiv: `needs-work`
- Search-Fenster erreicht, neuer Sync vorhanden und Befund verschwunden: `verified`

## Search-Nachmessung

Standardfristen:

- Ranking und CTR: 14 Tage
- Intent oder Content Gap mit geringer Datenbasis: 28 Tage
- externer Provider- oder Datenblocker: 30 Tage

Nach Ablauf wird ein wartendes Paket automatisch `review-due`. Eine Search-Wirkung darf erst bewertet werden, wenn ein neuer Search-Snapshot nach der Übergabe vorliegt. Der Co-Pilot beschreibt Veränderungen nur als zeitliche Assoziation und behauptet keine Kausalität.

## Snooze-Regeln

Manuelles Zurückstellen ist für 7, 14, 30 oder 60 Tage möglich. Grund und Enddatum werden gespeichert. Zurückgestellte Pakete bleiben in einer eingeklappten Übersicht sichtbar. Nach Ablauf erscheinen sie automatisch wieder als `open`. Eine manuelle Reaktivierung ist jederzeit möglich.

## Speicherort und Migration

Der kanonische Paketstatus liegt in:

`.search/seo-copilot/workspace.json`

Das Workspace-Schema wurde von Version 1 auf Version 2 erweitert. Die Migration übernimmt bestehende:

- Produktkandidaten
- Content Gaps
- Nischenchancen
- Produktentwürfe
- Jobs
- ignorierte Kandidaten

und ergänzt `workPackages`. Für laufende Pakete wird außerdem ein begrenzter Paketsnapshot mit Task-IDs, Teilaufgaben, Dateiscope und Validierungsbefehlen gespeichert. Dadurch bleibt ein Paket prüfbar, wenn sein ursprünglicher Befund nach der Codex-Änderung bereits verschwunden ist. Atomare JSON-Schreibvorgänge und das vorhandene Audit-Log bleiben erhalten.

Browser-LocalStorage wird nur noch für persönliche Paketnotizen genutzt. Es ist keine kanonische Statusquelle.

## Recovery

Bei beschädigtem oder altem Workspace erzeugt die Migration eine normalisierte Version 2 und erhält alle lesbaren bestehenden Arrays. Paketaktionen werden zusätzlich im Audit-Log protokolliert. Ein Paket kann über `copilot.package.reopen` wieder geöffnet werden. Fehlgeschlagene technische Prüfungen bleiben als `needs-work` mit den fehlgeschlagenen Checks sichtbar.

## Admin-Oberflächen

### Advisor

Direkt nach dem Traffic-Fokus erscheint die Sektion „Codex-Arbeitspakete“ mit Kennzahlen, Filtern, Rang, Familie, Priorität, Impact, Confidence, Aufwand, Status, Prüfmodus, Prüfdatum, Teilaufgaben und zustandsabhängigen Aktionen.

### Prompt-Bibliothek

Die Prompt-Seite zeigt zuerst fällige Nacharbeit, High-Priority- und High-Impact-Pakete und danach übrige Pakete. Einzelaufgaben stehen nur noch in einem eingeklappten Bereich. Die Zeitraumwahl gilt für die Pakete.

### Aufgaben

Die Aufgaben-Seite liest Paketstatus aus dem lokalen Admin-Workspace. Sie zeigt Snooze-Datum, Prüfdatum, ungelöste Aufgaben, letzte Prüfung und Reaktivierung. Der Export entfernt Prompts, Prüfausgaben und Manifestdaten. Persönliche Notizen bleiben optional im Browser.

## Grenzen

- Ein Build oder Audit beweist keine Ranking-Wirkung.
- Search-Signale können durch Saisonalität, SERP-Änderungen, Konkurrenz, Crawling und Datenlatenz beeinflusst sein.
- Low-Confidence- und geringe Datenbasis werden getrennt behandelt.
- Ein Codex-Manifest ersetzt weder Repository-Prüfung noch Audit noch neuen Search-Sync.
- Product-Health-Pakete enthalten nur lokal zuordenbare und auditierbare Bestandsprodukte.
