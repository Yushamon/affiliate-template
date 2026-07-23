# PfotenTechnik SEO Copilot – Produkt- und Themenplattform

## Zweck

Der SEO Copilot verbindet vorhandene Search-Daten, Astro Content Collections, Content Graph, Produktdaten und einen lokalen Admin-Service. Kandidaten, Entwürfe und Jobs werden außerhalb der veröffentlichten Collections gespeichert. Eine Produktdatei darf erst nach aktuellem Preflight und expliziter Freigabe entstehen.

## Architektur

### Statische Analyse und Oberfläche

- `src/pages/admin/seo/advisor.astro` rendert Product Health, Produktentdeckung, Content Gaps, Nischenchancen, Entwürfe und Jobs.
- `src/lib/seo/advisor/productIntelligence.ts` liest ausschließlich validierte Astro Collections und berechnet Product Health.
- Jede fehlende Product-Health-Eigenschaft und jedes strukturelle Product Gap besitzt einen konkreten ChatGPT- und Codex-Prompt.

### SEO-Copilot-Kern

- `src/lib/seo-copilot/types.ts`: Datenmodelle für Kandidaten, Quellen, Marktsignale, Preflight, Entwürfe, Jobs und Audit.
- `config.ts`: Kategorien, Bildrollen und zentrale Gewichte für Quellen, Content Gap und Niche Fit.
- `scoring.ts`: Validation Score, Content Gap Score, Niche Fit Score und geschätztes kommerzielles Potenzial.
- `identity.ts`: Normalisierung sowie Erkennung von Duplikaten, Aliasen, Varianten und Nachfolgern.
- `prompts.ts` und `templates.ts`: reproduzierbare Prompt-Bibliothek mit Repository-, Schema-, Quellen-, Bild- und Validierungskontext.
- `preflight.ts`: dynamischer Schema-Fingerprint, Pflichtfelder, aktuelle Produkte, Hersteller, Vergleiche, Bilder, Zielpfade und mögliche Duplikate.
- `workflow.mjs`: validierte Kandidaten, Entwürfe, Freigabe und kontrollierte Produktanlage.
- `store.mjs`: persistierte Jobs, Workspace und redigiertes Audit Log.
- `discovery-provider.mjs`: serverseitige Produktentdeckung über genau einen fest konfigurierten HTTPS-Provider.

### Lokaler Admin-Service

Der bestehende lokale Service auf `127.0.0.1:4178` bleibt die einzige mutierende Schnittstelle. Er akzeptiert ausschließlich feste Action-Namen und strukturierte Payloads. Es gibt keinen Shell-Endpunkt und keine Übergabe von Dateipfaden oder npm-Befehlen aus dem Browser.

Längere Transport-Aktionen besitzen Queue-/Running-/Success-/Failed-/Cancelled-Status. Fachliche Copilot-Jobs verwenden:

- `pending`
- `running`
- `awaiting-review`
- `blocked`
- `completed`
- `failed`
- `cancelled`

Abbruch und Wiederholung erfolgen nur für bekannte Job-IDs. Interne Handler erhalten ein Abort-Signal.

## Datenpfade

Lokale, unveröffentlichte Daten:

```text
apps/pfotentechnik/.search/seo-copilot/
  workspace.json
  audit-log.jsonl
  product-drafts/
```

Diese Pfade sind durch `.gitignore` ausgeschlossen. Produktkandidaten gelangen niemals allein durch Entdeckung oder Draft-Generierung nach `src/content/products`.

Veröffentlichte Reports:

```text
apps/pfotentechnik/reports/seo-copilot-report.json
apps/pfotentechnik/reports/seo-copilot-report.md
```

## Product Health

Product Health prüft lokal fünf Gruppen:

1. Grunddaten
2. technische Daten
3. redaktionelle Daten
4. SEO
5. Visuals

Technische Werte werden aus strukturierten Feldern und der vorhandenen `specs`-Terminologie gelesen. Aussagen wie „Nicht vom Hersteller ausgewiesen“ gelten nicht als bestätigter Wert. Schweregrade:

- `kritisch`
- `wichtig`
- `optimierung`
- Gesamtstatus `vollständig`

Der Score ist eine interne Arbeitspriorisierung und kein Google-, Qualitäts- oder Testergebnis.

## Quellenvalidierung

Priorisierte Quellenklassen:

1. Hersteller, Bedienungsanleitung, Datenblatt, Pressemitteilung, App Store
2. etablierte Händler
3. unabhängige Tests und ergänzende Community-Erfahrungen

Ein Produktkandidat benötigt mindestens eine Primärquelle und mehrere Quellenbelege. Unter 60 Punkten wird keine Anlage empfohlen; unter 40 Punkten wird die Datenlage als unzureichend behandelt.

Jede Quelle speichert:

- URL und Domain
- Quellenklasse
- Beobachtungsdatum
- unterstützte Aussagen
- Confidence

Vollständige externe Response-Bodies und Secrets werden nicht gespeichert.

## Marktsignale statt Verkaufszahlen

Exakte Verkaufszahlen sind bei Haustiertechnik meist nicht öffentlich oder nicht unabhängig überprüfbar. Deshalb verwendet der Copilot getrennte Signale wie Händlerabdeckung, verifizierte Bewertungsanzahl, Suchinteresse, Sichtbarkeit, unabhängige Erwähnungen oder öffentlich belegte App-Downloads.

Jedes Signal braucht Quelle, Datum, Aussagekraft, Einschränkung und Confidence. Nur explizit belegte Herstellerangaben dürfen als verkaufte Einheiten klassifiziert werden. Der Copilot bezeichnet andere Werte niemals pauschal als Verkaufszahlen.

## Scores

### Validation Score

Der Score berücksichtigt Quellenklasse, Quellen-Confidence, mehrere etablierte Händler und aktuelle Deutschland-/Verfügbarkeitsbelege.

### Content Gap Score

Zentrale Gewichtung:

- 25 % Search- und Sichtbarkeitssignale
- 20 % Produktrelevanz
- 15 % kommerzielles Potenzial
- 15 % fehlende Abdeckung
- 10 % interne Verlinkbarkeit
- 10 % Quellenqualität
- 5 % Aktualität

### Niche Fit Score

- 25 % Zielgruppenüberschneidung
- 20 % interne Verlinkbarkeit
- 15 % Produktverfügbarkeit
- 15 % Suchpotenzial
- 15 % kommerzielles Potenzial
- 10 % redaktionelle Glaubwürdigkeit

Der Standard-Mindestscore beträgt 65 und ist zentral konfigurierbar.

### Kommerzielles Potenzial

`niedrig`, `mittel` oder `hoch` ist immer eine redaktionelle Schätzung. Berücksichtigt werden Kaufintention, Händlerabdeckung, Vergleichstauglichkeit, mögliche Folgekäufe und Wettbewerb. Der Copilot erzeugt keine fiktiven Einnahmen oder Conversion Rates.

## Produktentdeckung

Vor jeder externen Suche werden aktuelle Produktdateien geladen. Produktentdeckung außerhalb bestehender Herstellerlisten benötigt:

```dotenv
SEO_COPILOT_DISCOVERY_ENDPOINT=https://fester-vertrauenswuerdiger-provider.example/api/discover
SEO_COPILOT_DISCOVERY_API_KEY=serverseitiges-secret
```

Der Endpoint muss HTTPS verwenden, darf keine URL-Zugangsdaten, lokale Hosts oder IP-Adressen enthalten und wird ausschließlich serverseitig angesprochen. Redirects sind deaktiviert, Antwortgrößen begrenzt und Secrets werden weder in HTML noch in Prompts oder Reports ausgegeben.

Ohne Provider wechselt die UI kontrolliert in den Modus `research-prompt-only`: Sie erzeugt einen konkreten Rechercheprompt, aber keine Kandidaten oder Marktbehauptungen.

## Preflight

Vor jeder Entwurfs- und Produktanlage wird erneut geprüft:

- aktuelles `product.ts` und `base.ts`
- Schema-Fingerprint und tatsächlich erforderliche Top-Level-Felder
- vorhandene Produktdateien und Slugs
- normalisierte Namen, Modellnummern, Aliase, Varianten und Nachfolger
- Herstellerdatei
- vorhandene Vergleiche
- Standard-Bildrollen
- Primärquellen und Quellenanzahl
- ausschließlich erlaubte Zielpfade

Blocker sind unter anderem bestehende Produktdatei, wahrscheinliches Duplikat/Alias, fehlende Primärquelle, weniger als zwei Belege, fehlende Herstellerdatei, nicht erkanntes Schema, Pflichtfeldlücken oder fehlendes Hero-Bild.

## Produktentwurf und Anlage

Workflow:

1. Kandidat auswählen
2. Repository neu lesen
3. Quellen und Identität erneut validieren
4. Preflight ausführen
5. Entwurf außerhalb der Collection erzeugen
6. fehlende Daten und Bildrollen anzeigen
7. finalen Markdown-Entwurf redaktionell prüfen
8. mit `approve-reviewed-product-draft` freigeben
9. unmittelbar vor Anlage Preflight wiederholen
10. mit `create-approved-product` freigeben
11. neue Datei mit exklusivem Schreibmodus anlegen; bestehende Dateien werden nie überschrieben
12. Produkt-Audit und Astro-Build ausführen
13. bei Fehler die neu angelegte Datei zurückrollen

Hersteller- und Vergleichsaktionen erzeugen zunächst nur Recherche- beziehungsweise Vorschauprompts. Sie schreiben nicht automatisch in Collections.

## Bildworkflow

Standardrollen:

- `hero.webp`
- `thumbnail.webp`
- `comparison.webp`
- `gallery-1.webp`
- `gallery-2.webp`
- `gallery-3.webp`

Bildprompts dürfen nur bestätigte Produktmerkmale verwenden. Fehlen belastbare Angaben zu Form, Farbe, Bedienoberfläche, Behälter, Auslass, Napf, Kamera, Anschlüssen oder Proportionen, bleibt die Produktanlage blockiert. Generierte Bilder enthalten keine Logos oder Texte und kopieren keine Herstellerbilder.

Bildgenerierung ist ein separater, protokollierter Schritt. Vorhandene Importbilder werden lokal validiert, zugeschnitten, nach WebP konvertiert und als Paket bereitgestellt.

## Allow-listed Admin Actions

Zusätzlich zu den Search-Aktionen:

- `product.health.refresh`
- `product.discovery.run`
- `product.discovery.validate`
- `product.discovery.ignore`
- `product.research.refresh`
- `product.preflight.run`
- `product.draft.generate`
- `product.draft.approve`
- `product.images.prepare`
- `product.create`
- `product.update`
- `product.add-to-comparison`
- `manufacturer.create`
- `content-gap.refresh`
- `niche-opportunities.refresh`
- `prompt.chatgpt.generate`
- `prompt.codex.generate`

Legacy-Aktionen für sichere interne Hersteller-Drafts und Bildpakete bleiben kompatibel.

## Prompt-Bibliothek

Die zentrale Bibliothek enthält:

- Product Health vollständig beheben
- fehlende Produktdaten recherchieren
- Produktdaten aktualisieren
- neues Produkt validieren
- neuen Hersteller recherchieren
- Produktentwurf erzeugen
- Produktseite vollständig anlegen
- Produktbilder erzeugen
- Vergleichszuordnung prüfen
- Content Gap schließen
- neue Produkte einer Kategorie finden
- neue Hersteller einer Kategorie finden
- Nischenchance validieren
- neues Themencluster planen
- interne Verlinkung ergänzen
- Quellen aktualisieren
- Produktnachfolger prüfen
- eingestellte Produkte erkennen

Jeder Prompt enthält Projektpfad, betroffene Datei, Slug, Hersteller, Kategorie, konkrete vorhandene und fehlende Daten, Vergleiche, Ratgeber, Bildrollen, Schema, Validierungsbefehle und Akzeptanzkriterien.

## Scripts

```bash
npm --workspace apps/pfotentechnik run seo-copilot:health
npm --workspace apps/pfotentechnik run seo-copilot:report
npm --workspace apps/pfotentechnik run seo-copilot:discover -- --category=smart-feeders
npm --workspace apps/pfotentechnik run seo-copilot:validate -- --candidate=<id>
npm --workspace apps/pfotentechnik run seo-copilot:preflight -- --candidate=<id>
npm --workspace apps/pfotentechnik run product:draft -- --candidate=<id>
npm --workspace apps/pfotentechnik run seo-copilot:gaps
npm --workspace apps/pfotentechnik run seo-copilot:niches -- --input=<belegte-chancen.json>
npm --workspace apps/pfotentechnik run test:seo-copilot
```

## Automatisch versus freigabepflichtig

Automatisch erlaubt:

- Collections und Schema lesen
- Scores berechnen
- Prompts und Reports erzeugen
- Quellen und Marktsignale validieren
- Duplikate und Varianten vorschlagen
- Entwürfe außerhalb der Content Collections speichern

Explizite Freigabe erforderlich:

- finalen Produktentwurf genehmigen
- neue Produktdatei anlegen
- neue Herstellerdatei anlegen
- Vergleichszuordnung ändern
- freigegebene Bilder in veröffentlichte Pfade übernehmen

## Fehlerbehebung

- `Provider nicht konfiguriert`: Discovery-Endpoint serverseitig konfigurieren oder den erzeugten Rechercheprompt verwenden.
- `Preflight blockiert`: Blocker in der Detailansicht beheben; keine Anlage erzwingen.
- `Schema nicht erkannt`: `src/content/schema/product.ts` und `base.ts` auf gültige Collection-Struktur prüfen.
- `Produkt bereits vorhanden`: Alias-/Variantenbefund prüfen; bestehende Datei aktualisieren statt neue URL anzulegen.
- `Admin-Service nicht erreichbar`: `npm run seo:admin` im Repository starten.
- `EADDRINUSE 4178`: vorhandenen lokalen Admin-Prozess beenden oder dessen Status prüfen, bevor ein zweiter gestartet wird.
