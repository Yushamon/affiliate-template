# Geschenkfinder: Produktkarten, Preise und Bilder 37.3B

Stand: 17.11.2026. Route: `/ratgeber/technikgeschenke-haustiere/`. Kein Merge, kein Deployment.

## Umsetzung

Die Ergebniskarten unterscheiden den redaktionellen Produktscore jetzt eindeutig von internen Prüfbezeichnungen. „Datencheck“ wird nicht mehr öffentlich neben dem Score angezeigt. Die Werte bleiben unverändert; bei Reolink sind die 91 Punkte die bestehende redaktionelle Kriterienbewertung, keine Kennzahl zur Datenvollständigkeit. Hauptempfehlungen zeigen Produktname, Bewertung, zwei bestehende konkrete Vorteile, einen Nachteil, Gerätepreis und Produktlink. Alternativen bleiben kompakter. Generische Advisor-Begründungen werden nicht als technische Prüfsprache an Besucher weitergereicht. Wesentliche Einschränkungen zu Gewicht, Futter und Lieferbarkeit bleiben verständlich erhalten.

Die Formulierung „Gerätepreis aktuell prüfen; Budgeteinhaltung offen“ entfällt. Eine relevante Budgeteinschränkung lautet nun „Der aktuelle Preis kann über deinem Budget liegen“ und steht beim Preis. Ohne gewählten Preisrahmen erscheint dieser Hinweis nicht. Lieferbarkeit ist davon getrennt. Unbekannte Preise erhalten eine einzige Preisaufforderung statt mehrerer gleichlautender Meldungen.

## Preisursache und vollständiger Datenfluss

Reolink E1 Zoom (4K): gespeicherter Gerätepreis **99,99 €**, erfolgreiches Preisdatum **17.08.2026**, gespeicherte Quelle **Reolink Deutschland**. PetTec Cam 360: **59,46 €**, **17.08.2026**, Quelle **PetTec**. Beide Preise sind beim Prüftermin 92 volle Tage alt. Die vorhandenen gekürzten Amazon-Ziele besitzen eine im bestehenden Resolver bestätigte Produktzuordnung. Ein gültiger Link beweist jedoch keinen aktuellen Händlerpreis. Insbesondere werden Hersteller-Preisquelle und späteres Händlerziel nicht stillschweigend gleichgesetzt.

Der Datenfluss war: Produkt-Frontmatter → vorhandenes Legacy-Commerce-Angebot → zentrale Frischeprüfung → `offer.current = null` nach Fristablauf → Geschenkfinder verwirft den Betrag → Händlerlink bleibt nutzbar. Es fehlte ein eigener historischer Anzeigezustand; ein defekter Abruf oder ein verlorener gespeicherter Betrag war hierfür nicht erforderlich.

Die neue Darstellung verwendet dieselbe `selectCommercePrice`-Auswahl aus 37.3A. Betrag, Quelle, Bestätigungsdatum und Händlerziel werden gemeinsam gelesen. Ein aktueller Preis wird regulär angezeigt. Ein älterer bestätigter Preis erscheint als **„Zuletzt 99,99 €“** beziehungsweise **„Zuletzt 59,46 €“**, unmittelbar mit Preisstand, gespeicherter Quelle und Aufforderung, den aktuellen Preis beim Händler zu prüfen. Unbekannte, undatierte, zukünftige oder ungeeignete Preisnachweise erzeugen keinen erfundenen Betrag. Ein fehlgeschlagener neuer Versuch erneuert kein Datum und löscht keinen früher belegten Preis; dieser bleibt gegebenenfalls historisch sichtbar.

Alle **56** Geschenkfinder-Produkte wurden auf denselben Datenfluss geprüft: **35 aktuelle**, **20 historische**, **1 unbekannter Preiszustand**. Die [vollständige maschinenlesbare Liste](gift-cards-37.3b-qa/price-flow.json) enthält Betrag, Quelle, ausgewähltes Angebot, erfolgreiches Datum, Budgetpreis, Anzeigetext und Affiliate-Ziel jedes Modells.

Historische Beträge bleiben ausschließlich Anzeigeinformationen. `price` und `advisor.decisionFacts.giftPrice` bleiben dabei unbekannt: Sie bestätigen keine Budgeteignung und gehen nicht als heutiger Gerätepreis in Gesamtkosten ein. Optionale oder verpflichtende Dienste werden weiterhin separat benannt; ein optionales Abo wird nicht zum Gerätepreis addiert. Die vorhandenen Regeln für Pflichtdienste und Paketmonate bleiben bestehen. Direktvergleich und Kaufpreis-Modul zeigen einen historischen Preis ebenfalls mit Datum.

Es wurden keine Preise recherchiert oder erfunden, keine Prüfdatumswerte erneuert und keine Produktdateien verändert. Vorhandene aktuelle Händlerangebote aus 37.3A werden weiterverwendet.

## Modellbilder und nachgewiesene Grenze

Die responsive Modellbildanzeige ist für Hauptempfehlung und Alternativen integriert: größeres Bild an der Hauptempfehlung, kleinere Vorschau an Alternativen, `object-fit: contain`, feste Dimensionsattribute gegen Layoutsprünge, konkrete Alt-Texte und lokale 160-/320-/640-Pixel-WebP-Varianten. Initiale Bilder unterhalb des Titelbereichs laden verzögert; eine durch Interaktion neu angezeigte Hauptempfehlung lädt ihr Bild bevorzugt, Alternativen verzögert. Beim Wechsel auf ein Modell ohne Bild werden vorherige Bild-URLs ausdrücklich entfernt.

**Aktuell wird kein zusätzliches Fremd-Modellfoto veröffentlicht.** Die neun vorhandenen Provenienzdateien dokumentieren Quellen und zum Teil ausdrücklich nur eine Betreiber-Ausnahme für Downloads; sie beanspruchen keine unabhängige Lizenz. Für Reolink und PetTec fehlt zusätzlich eine entsprechende Bild-Provenienzdatei. Der frühere Bildplan `research/gift-guide-37.0/image-plan.json` hält diese Grenze bereits ausdrücklich fest. Eine ergänzende Frage nach bestehenden Nutzungsfreigaben wurde gestellt; ohne belegte Freigabe wird keine Erlaubnis angenommen.

Der Bildpfad verlangt eine ausdrücklich dokumentierte Website-Nutzungserlaubnis, identische Modellzuordnung, echte statt generierter Modellaufnahme und passenden Asset-Hash. Eine vorhandene Datei, eine Hersteller-URL oder eine Downloadgenehmigung allein schaltet kein Bild frei. Ohne diese Nachweise wird die ausdrücklich erlaubte **kompakte neutrale Karte ohne Modellbild** verwendet. Es wird kein beliebiges Ersatzfoto als echtes Modellfoto gezeigt. Die weiterhin vorhandenen redaktionellen KI-Symbolbilder bleiben außerhalb der Modellkarten und sind als solche beschriftet.

Der positive Bild-Renderer wird mit einem neutralen, ausschließlich lokalen Browser-Testbild geprüft; daraus wird keine Produktfoto-Lizenz abgeleitet. [Medienprüfung](gift-cards-37.3b-qa/media-audit.json).

## Tests und Schutz

**Abschluss: GO mit dem dokumentierten neutralen Bild-Fallback.** Alle **359 Tests** bestehen, keine Fehler oder übersprungenen Fälle: 47 Geschenkfinder-Tests einschließlich neun neuer Regressionen, 145 Produktintegrationstests, 137 Domain-/Commerce-/Operations-/Freigabetests und 30 SEO-/Indexierungstests. Produktionsbuild: **391 Seiten**. Strikter SEO-Audit: **0 Fehler, 0 Warnungen**. Geschenkfinder-Prüfung mit 60 Szenarien und direkter Release-Check bestehen ebenfalls.

Die automatisierte Browserprüfung am fertigen Produktionsbuild besteht bei 375 und 1600 Pixeln in Light/Dark, mit sechs Screenshots und ohne JavaScript-Ausnahmen. Der gemeldete Kamera-Fall wurde zusätzlich gezielt geprüft. Der tatsächliche Browser-Renderer wurde mit einem neutralen Testbild auf Haupt-/Alternativdarstellung, Ladepriorität, Alt-Text, Dimensionsattribute und vollständiges Entfernen des vorherigen Bildes beim Fallback geprüft.

[Maschinenlesbarer Abschluss](gift-cards-37.3b-qa/validation.json) · [Browsernachweis](gift-cards-37.3b-qa/browser.json) · [Mobile-Kamerakarten](gift-cards-37.3b-qa/camera-cards-375.png) · [Desktop-Kamerakarten](gift-cards-37.3b-qa/camera-cards-1600.png).

Alle 110 Produktdateien, ihre Preise/Prüfdaten, redaktionellen Scores und Affiliate-Ziele sowie die historischen Baseline-Dateien sind bytegleich zum geschützten Inventar. Alle 437 gesperrten Originalhinweise, 20 Experimentseiten und 205 eingehenden Experiment-Linkkanten bleiben erhalten. Es wurden keine Baselines pauschal erneuert. Die Regressionen umfassen aktuelle, historische und unbekannte Preise, fehlgeschlagenen Neuabruf, Budgetfilter, fehlende Bilder/Rechte, falsche Modellzuordnung/Asset-Hashes, generierte Bilder, redaktionelle statt interner Scorebeschriftung sowie bestehende optionale/verpflichtende Dienste. Historische Baselines werden nicht überschrieben und kein fehlgeschlagener Fall aus der Auswahl entfernt.

## Reproduktion

Zuerst `npm --workspace apps/pfotentechnik run build`, anschließend `npm --workspace apps/pfotentechnik run test:gift-guide`, `npm --workspace apps/pfotentechnik run test:product-integration`, `npm --workspace apps/pfotentechnik run check:release-gate`, `npm --workspace apps/pfotentechnik run check:gift-guide` und `npm --workspace apps/pfotentechnik run audit:release-build-output:strict`. Die Browserprüfung startet mit `node apps/pfotentechnik/scripts/gift-guide/visual-37.3b.mjs` einen separaten lokalen Testbrowser und statischen Testserver; keine externen Schreiboperationen. Die vollständigen Domain-/SEO-Suiten entsprechen dem Abschlussumfang von 37.3A; die zusätzlichen neun Regressionen sind dauerhaft im regulären `test:gift-guide` enthalten. Keine neue Dependency.
