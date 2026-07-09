# Legal Pages im Monorepo

Jedes Affiliate-Projekt stellt mindestens diese vier Seiten als direkt
erreichbare Astro-Routen bereit:

- `/impressum`
- `/datenschutz`
- `/kontakt`
- `/affiliate-hinweis`

Die Seiten werden im Footer unter der Rubrik **Rechtliches** verlinkt. Links
dürfen erst ergänzt werden, wenn die entsprechende Route existiert.

## LegalLayout

Das gemeinsame Layout liegt unter
`packages/affiliate-core/src/layouts/LegalLayout.astro`. Es sorgt für eine
ruhige, konsistente Darstellung ohne Produktkarten, Rankings, aggressive CTAs
oder redaktionelle Empfehlungsblöcke.

Legal-Seiten verwenden `WebPage`-Strukturdaten. Sie erzeugen weder
`Article`- noch `Person`-JSON-LD und benötigen kein Breadcrumb-Schema. Der
Robots-Metatag bleibt bewusst auf `index,follow`, damit Impressum und
Datenschutzhinweise unmittelbar auffindbar sind.

Eine Seite bindet das Layout mit `title`, `description`, `canonical`, der
jeweiligen `projectConfig` und optional `updatedAt` ein. Nischen- und
Projektnamen gehören in die App, nicht in das Core-Layout.

## Personenbezogene Angaben

Pflichtangaben werden als normaler, lesbarer Inhalt ausgegeben. Sie erhalten
keine vCard-, Microdata-, `Person`-Schema- oder sonstige besondere semantische
Auszeichnung. E-Mail-Adressen werden im Astro-Quelltext als HTML-Entity
ausgegeben; JavaScript-Verschleierung wird nicht verwendet.

Personenbezogene Angaben dürfen nicht aus anderen Projekten geraten oder
erraten werden. Änderungen an Name, Anschrift, Kontaktadresse oder der
inhaltlich verantwortlichen Person müssen gegen die tatsächlichen Angaben des
Betreibers geprüft werden.

## Projektspezifische Prüfung

Vor Veröffentlichung sind insbesondere anzupassen und zu prüfen:

- Projektname, Domain und Kontaktadresse,
- Betreiber und ladungsfähige Anschrift,
- inhaltlich verantwortliche Person,
- tatsächlich eingesetztes Hosting,
- aktive Analyse-, Marketing- und Einwilligungsdienste,
- Affiliate-Netzwerke und Partnerkennzeichnungen,
- externe Inhalte, Formulare, Newsletter oder weitere Empfänger,
- einschlägige Aufbewahrungsfristen und internationale Datentransfers.

Optionale Dienste dürfen nur konditional beschrieben werden, solange sie nicht
aktiv sind. Wird ein neuer Dienst eingebunden, muss die Datenschutzerklärung
vor seiner Aktivierung aktualisiert werden.

## Footer-Links

Die Footer-Spalten werden app-spezifisch in der jeweiligen
`src/project.config.ts` gepflegt. Die generische Footer-Komponente rendert die
dort konfigurierten Spalten und passt das Raster an deren Anzahl an.

Bestehende Vertrauensseiten wie Über uns, Redaktion und Bewertungsmethodik
bleiben in einer getrennten Unternehmensrubrik. Nicht vorhandene
Vertrauensseiten werden nicht verlinkt.

## Rechtliche Prüfung

Die Dateien bilden ein technisches und redaktionelles Grundsystem, keine
Rechtsberatung. Rechtliche Inhalte und tatsächliche Datenverarbeitungen müssen
bei Bedarf durch eine fachkundige Stelle geprüft und bei Änderungen am Projekt
aktualisiert werden.
