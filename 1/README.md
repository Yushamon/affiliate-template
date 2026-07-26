# PfotenTechnik Platform 2.0

Modularer Installer für `Yushamon/affiliate-template`, Projekt `apps/pfotentechnik`.

Ausgangsbasis der Repository-Analyse: `main` bei Commit `89a5194a3f96e200c9a30a753934cc80283d26f4`.

## Enthaltene Module

### 01 Product Experience 2.0

Der bisher aktive, rund 1.700 Zeilen große `ProductRenderer.astro` wird zu einer dünnen Fassade. Datenaufbereitung und Darstellung sind getrennt.

Neue Bausteine:

- neuer Product Hero mit Galerie, Empfehlung, Eignungswert, Ideal-für, Nicht-ideal-für, Vorteilen, Haupteinschränkung, Preisbox und Vergleichs-CTA
- interaktive Kaufentscheidung mit sieben Eingaben und Live-Auswertung ohne Seitenwechsel
- Alltagstimeline statt wiederholtem Datenblatt
- klare Nicht-kaufen-wenn-Einordnung
- zweckbezogene Alternativen statt rein ähnlicher Produkte
- Transparenzkarten zu Empfehlung, Datengrundlage, offenen Prüfungen und redaktioneller Einschätzung
- mobile-first, Light Mode, Dark Mode, feste Bilddimensionen und priorisiertes LCP-Bild

Der vorhandene Produktseitenpfad, das Content-Modell, die bestehende Alternative-Engine und das bestehende Layout bleiben die Integrationspunkte. Der alte doppelte Alltagstest und die dazugehörigen CSS-Hotfix-Blöcke werden entfernt.

### 02 Price Intelligence 1.0

Zentrale Preisdomäne mit Adapter-Schnittstelle. Die erste Quelle ist das vorhandene Produkt-Frontmatter. Neue Händleradapter können ergänzt werden, ohne die Produktseite zu ändern.

Preisfelder:

```yaml
price:
  current: 119
  currency: "EUR"
  status: "unknown"
  comparisonText: "Optionaler redaktioneller Kontext"
  checkedAt: "2026-07-26T12:00:00.000Z"
  affiliateUrl: "https://…"
  source:
    id: "amazon.de"
    label: "amazon.de"
    type: "merchant"
    url: "https://…"
```

`range` ist im Schema vorgesehen, wird in der Anzeige aber bewusst aus den aktuell hinterlegten Preisen derselben Kategorie berechnet. Es gibt keine zweite manuelle Range-Wahrheit.

Die automatische Preisprüfung liest nur standardisierte Händlerdaten:

- JSON-LD `Offer` und `AggregateOffer`
- `product:price:*` und vergleichbare Metadaten
- `itemprop="price"`

Es gibt keine auf einen einzelnen Händler fest codierten CSS-Selektoren. Händler können automatisierte Abrufe blockieren. In diesem Fall wird kein Preis erfunden oder aus sichtbarem Fließtext geraten.

Neue SEO-Cockpit-Seite: `/admin/seo/prices/`

### 03 Media Factory 2.0

Die bisherige CLI-orientierte Bildlogik wird als wiederverwendbarer Service in `src/lib/media-center` abgebildet.

Filtert bereits vor dem Download:

- Amazon Fresh
- Prime Video und Amazon Video
- Audible
- Kindle
- Amazon Music
- Werbung und Sponsoring
- Logos, Banner und UI-Assets

Jedes geladene Bild erhält einen nachvollziehbaren Score aus:

- Auflösung und Kantenlänge
- Bildformat
- sichtbarer Vordergrund
- Kontrast im Bildzentrum
- neutralem Hintergrund
- erkannter Bildrolle: Produkt, Detail, Lifestyle oder Größe
- Dateigröße
- Duplikatprüfung über perceptual hash

Jeder Job enthält `gefunden`, `heruntergeladen`, `übernommen`, `verworfen` und die jeweiligen Gründe. „Übernommen“ bedeutet dabei ausschließlich: als Referenz akzeptiert. Händler- und Herstellerbilder werden niemals automatisch in öffentliche Website-Assets kopiert. Eine OCR-basierte Werbeerkennung wird bewusst nicht eingesetzt. Deshalb bleibt vor der Freigabe eine visuelle Prüfung erforderlich.

### 04 Media Center

Neue SEO-Cockpit-Seite: `/admin/seo/media/`

Workflow:

1. Amazon- oder Hersteller-Link einfügen
2. Produkt und Hersteller erkennen
3. Referenzbilder sammeln
4. Werbung und ungeeignete Bilder filtern
5. Bildscore und Audit prüfen
6. Prompts pro Zielvariante kopieren
7. mindestens ein eigenes oder generiertes Hero-Bild hochladen
8. WebP-Paket bauen; Thumbnail und Vergleichsbild können aus dem Hero abgeleitet werden
9. Audit freigeben
10. Assets und Produkt-Markdown transaktional aktualisieren

Vor der Freigabe bleiben alle Dateien in `apps/pfotentechnik/.media-center/jobs`. Erst `approve` schreibt in `src/assets/images/products/<slug>` und ersetzt den zentralen `images`-Block der Produktdatei. Schlägt ein Teil fehl, werden Assets und Markdown zurückgesetzt.

## Installation

Das ZIP kann innerhalb oder außerhalb des Repositories entpackt werden.

### Windows PowerShell

```powershell
node .\pfotentechnik-platform-2.0\install.mjs --repo C:\hp\Projekt\affiliate-template
```

### macOS oder Linux

```bash
node ./pfotentechnik-platform-2.0/install.mjs --repo /pfad/zum/affiliate-template
```

Der Installer führt zuerst den unveränderten Build aus. Danach folgen je Modul Unit-Tests, Audit und Build. Bei einem Fehler wird nur das aktuell laufende Modul zurückgerollt. Bereits erfolgreich geprüfte Module bleiben installiert.

Ein Zielmodul einschließlich seiner Vorgänger installieren:

```bash
node ./pfotentechnik-platform-2.0/install.mjs --repo . --module=02-price-intelligence
```

Checks nur in einer bewusst kontrollierten Umgebung überspringen:

```bash
node ./pfotentechnik-platform-2.0/install.mjs --repo . --skip-checks --skip-baseline
```

## Vollständige Prüfung

```bash
node ./pfotentechnik-platform-2.0/verify.mjs --repo .
```

Ausgeführt werden:

- Product Experience Unit-Tests
- Price Intelligence Unit-Tests
- Media Filter Unit-Tests
- Product Experience Architektur-Audit
- Preis-Audit
- Medien-Audit
- vorhandener Repository-Audit
- vollständiger PfotenTechnik-Build

## SEO Cockpit starten

```bash
npm run dev:pfotentechnik:seo
```

Astro läuft wie bisher auf Port 4321. Der lokale schreibende Admin-Service läuft auf `127.0.0.1:4178`. Preis- und Medienaktionen sind nicht als öffentliche Produktions-API gedacht.

## Rollback

Letzten vollständigen Installationslauf zurückrollen:

```bash
node ./pfotentechnik-platform-2.0/rollback.mjs --repo .
```

Ein Modul und alle darauf aufbauenden Module zurückrollen:

```bash
node ./pfotentechnik-platform-2.0/rollback.mjs --repo . --module=02-price-intelligence
```

Backups liegen unter:

```text
.patch-backups/pfotentechnik-platform-2.0/<Zeitstempel>/
```

Der aktuelle Laufstatus liegt lokal unter `.pfotentechnik-platform-2.0/state.json` und wird durch den Installer zur `.gitignore` ergänzt.

## Sicherheits- und Qualitätsentscheidungen

- keine Preisprognosen, Historie, Alerts oder Benachrichtigungen
- keine erfundenen Preise bei blockierten Händlerseiten
- keine Händler-Hardcodierung in der Price Engine
- keine automatischen Medienänderungen vor einer expliziten Freigabe
- HTTPS-Pflicht, DNS-Pinning und Sperre privater oder lokaler Netzwerkziele
- vollständige Abruf-Timeouts sowie begrenzte Download- und Uploadgrößen
- atomarer Dateiersatz für Frontmatter, Auditstatus und Installer-Dateien
- keine Veröffentlichung fremder Referenzbilder ohne eigenen Upload
- manuelle Medienfreigabe bleibt Pflicht
- keine neue öffentliche API
- keine direkten Änderungen an `main` durch den Installer
