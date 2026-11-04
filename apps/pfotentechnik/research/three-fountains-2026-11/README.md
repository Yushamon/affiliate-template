# Drei zusätzliche Trinkbrunnen – aktueller Stand

Stand: 4. November 2026. Lokal integriert, nicht deployt. Dieser Bericht beschreibt den aktuellen Stand nach Betreiberkorrektur der Amazon-Zuordnungen, der Umstellung auf Mintgrün und dem ausdrücklich erlaubten direkten Bilddownload.

## Produktseiten und Varianten

- Catit PIXI Standard: **Mintgrün, Modell 43718, ASIN B095PZRWB1**. Die bestehende Route bleibt `/produkt/catit-pixi-standard-trinkbrunnen/`. Modellnummer und Farbe wurden in Titel, Beschreibung, technischen Daten, FAQ, Metadaten und JSON-LD angepasst. Die Amazon-Detailtabelle nennt 43718; Produktbilder und Titel zeigen Mintgrün. Die vorherige Variantensperre ist aufgehoben. Der frühere Händlerpreis für Weiß 43715 wird nicht auf diese Variante übertragen.
- Philips Pet Series 3000: **PAW3210/02, ASIN B0CWVKLXR8**. Der erneut auswertbare Amazon-Seitentitel bestätigt das Modell; Galerie in Dunkelgrau. Route: `/produkt/philips-pet-series-paw3210-02/`.
- Brook Glass Pet Fountain: **2,7 Liter, ASIN B0D5DP2V53**. Der erneut auswertbare Titel und die Galerie zeigen den zugeordneten Brook-Brunnen. Route: `/produkt/brook-glass-pet-fountain/`.

Alle drei Amazon-Kaufbuttons sind aktiv. Die bestehenden Herstellerprofile, die Trinkbrunnen-Übersicht und der Vergleich bleiben verknüpft. Der Vergleich enthält 14 Modelle; seine erste Empfehlung wurde nicht verändert.

## Amazon-Links und Tracking

Die neunstelligen Kurzlinkcodes sind keine ASINs. Die ASINs stammen aus den aufgelösten Produktpfaden. Die vorhandene Affiliate-Logik verwendet die vollständigen Ziel-URLs und erhält `tag=yusha0f-21` sowie `linkCode`, `linkId`, `ref_`, `ascsubtag` und die weiteren mitgelieferten Parameter. Kein neuer Resolver oder allgemeiner Commerce-Refactor.

### catit-pixi-standard-trinkbrunnen

- Betreiberlink: https://link.amazon/B0hgDjX0V
- Endgültige ASIN: **B095PZRWB1**
- Erzeugter Affiliate-Link: [Amazon](https://www.amazon.de/Catit-Pixi-Trinkbrunnen-Katzen-mintgr%C3%BCn/dp/B095PZRWB1?linkCode=sl2&tag=yusha0f-21&linkId=f7a6fe8f15668fa37fdf5f3f2b52c709&gaOptInStatus=true&ref_=as_li_ss_tl&ascsubtag=srctok-7a552d20d27d0bc0&btn_type=ss&btn_ref=srctok-7a552d20d27d0bc0)
- Redirect-Prüfung: zwei HTTP-302-Weiterleitungen und HTTP 200. Erster Abruf ohne auswertbare Produktdetails; erneuter Abruf für den Bildimport liefert Produktdetails und die ausgewählte Galerie.
- Variantenprüfung: Amazon-Produktdetailtabelle nennt Modell-/Artikelnummer 43718; Titel und ausgewählte Galerie zeigen Mintgrün. ASIN B095PZRWB1. Amazon-Titel nennt 2 L, dokumentierter Herstellerwert bleibt 2,5 L. Betreiber hat Umstellung auf diese Variante und direkten Bildbezug ausdrücklich beauftragt.

### philips-pet-series-paw3210-02

- Betreiberlink: https://link.amazon/B09b54zLX
- Endgültige ASIN: **B0CWVKLXR8**
- Erzeugter Affiliate-Link: [Amazon](https://www.amazon.de/Katzenbrunnen-Intelligenter-Auslaufschutz-Nachf%C3%BCll%C3%BCberwachung-Bewegungsaktivierung/dp/B0CWVKLXR8?__mk_de_DE=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=11MBN80GSXG3L&dib=eyJ2IjoiMSJ9.VbuKPAhOcVK8THlPztTi7lA2LKnb_qVf2Uzm-KZOhGXPW-nOjuHny4gSzcczfTHdg5HYMaslmZlY2r3t9edtylSnvP6zkSFUXjJRR7DpJ9U0Db_4VWgBJyE02ydyDcjcRkfu5eMcr1uZjmVBwmmaeDLXkfekozeXoKRpULt-SnLSJwiFYAtnirVL6o_2F1KqMbIbs8dxiF-DLdHG-XOqlZgo6aPhpcLuI0lShMNKRgHVZxsK6jWIkTxpLNUc0TsVQKp-OdAdh42UKQ4005ST0N8KbGsD7rfC2opf-jLwL7Q.XcXf280wM66iUjUiMXYAi5lrVuWuFzxcdvWllTDgxsU&dib_tag=se&keywords=Philips+Pet+Series+Trinkbrunnen%2C&qid=1793781418&s=pet-supplies&sprefix=philips+pet+series+trinkbrunnen+%2Cpets%2C185&sr=1-4&ufe=app_do%3Aamzn1.fos.51cb8c0f-0aa5-4b3b-90c2-c740c1c5186f&linkCode=sl2&tag=yusha0f-21&linkId=9bad08bf562f520424bca11ce606f2d5&gaOptInStatus=true&ref_=as_li_ss_tl&ascsubtag=srctok-53c67dcb9a05c31a&btn_type=ss&btn_ref=srctok-53c67dcb9a05c31a)
- Redirect-Prüfung: zwei HTTP-302-Weiterleitungen und HTTP 200. Erster Abruf ohne auswertbare Produktdetails; erneuter Abruf für den Bildimport liefert Produktdetails und die ausgewählte Galerie.
- Variantenprüfung: Amazon-Seitentitel nennt PAW3210/02; ausgewählte Produktgalerie zeigt den Philips Pet Series Brunnen in Dunkelgrau. Kein Modellwiderspruch.

### brook-glass-pet-fountain

- Betreiberlink: https://link.amazon/B0a5uPakx
- Endgültige ASIN: **B0D5DP2V53**
- Erzeugter Affiliate-Link: [Amazon](https://www.amazon.de/Brook-Glas-Haustier-Brunnen-551-5/dp/B0D5DP2V53?linkCode=sl2&tag=yusha0f-21&linkId=b279ac454a5bac189b09f76272e9bf00&gaOptInStatus=true&ref_=as_li_ss_tl&ascsubtag=srctok-61dccee8b78f282c&btn_type=ss&btn_ref=srctok-61dccee8b78f282c)
- Redirect-Prüfung: zwei HTTP-302-Weiterleitungen und HTTP 200. Erster Abruf ohne auswertbare Produktdetails; erneuter Abruf für den Bildimport liefert Produktdetails und die ausgewählte Galerie.
- Variantenprüfung: Amazon-Seitentitel und ausgewählte Produktgalerie zeigen den Brook Glas-Trinkbrunnen mit 2,7 Litern zur ASIN B0D5DP2V53. Kein Modellwiderspruch.

## Produktbilder

Der Betreiber hat ausdrücklich die Ausnahme zum direkten Amazon-Bildbezug ohne Schnittstelle erlaubt. Die bisherige Schnittstellenanforderung ist für diesen Auftrag aufgehoben. Es wird keine unabhängig erteilte Drittanbieter-Bildlizenz behauptet. Die Herkunft und die ausdrückliche Betreiberfreigabe sind in `media-provenance.json` je Produkt dokumentiert.

Die 18 bisherigen Datengrafiken wurden an ihren vorhandenen Dateipfaden durch WebP-Dateien aus den zugeordneten Amazon-Produktgalerien ersetzt: je `hero.webp`, `thumbnail.webp`, `comparison.webp` und `gallery-1.webp` bis `gallery-3.webp`. Es wurden ausschließlich die Bilder der initial ausgewählten Produktvariante verwendet, keine Empfehlungsbilder anderer Produkte oder Farbvarianten. Keine KI-Bilder und keine SVG-Dateien angelegt.

Hero, Thumbnail und Vergleich stammen aus der jeweiligen Hauptansicht; die drei Galeriebilder haben unterschiedliche Bildquellen. Catit zeigt Mintgrün, Schnittdarstellung, Trinkszene und Draufsicht. Philips zeigt Produktansichten, Maße und Trinkszene. Brook zeigt Produkt mit Verpackung, Trinkszene, Bauteilaufbau sowie Filter-/Ersatzteilübersicht.

Die Bilder wurden ohne Beschnitt oder Änderung des Produktaussehens verkleinert und komprimiert. Hero/Galerie maximal 1200 Pixel, Thumbnail 480 Pixel, Vergleich 720 Pixel. Bei detailreichen Brook-Bildern wurde die Kantenlänge für das Größenbudget reduziert; exakte Maße und Dateigrößen stehen in den Herkunftsdateien. Jede Datei bleibt unter 100 KB. Quellen-URLs, ASIN, SHA-256 von Original und WebP sowie Dateirollen werden festgehalten. Die ausgewählten Originalbilder und die konvertierten Ansichten wurden visuell geprüft.

Die fehlende Produktfotografie ist damit für diese drei Seiten behoben. Bildhinweise und Alttexte beschreiben die tatsächlichen Anbieterbilder. Beschriftete Anbieterbilder werden nicht als eigene Messungen oder Praxistests ausgegeben.

## Inhalte, Kosten und Quellen

Technische Herstellerquellen, redaktionelle Bewertungen (Catit 78, Philips 73, Brook 74 von 100), Filterdaten, FAQ und interne Links bleiben erhalten. Vier dokumentierte Eignungskriterien werden nach der vorhandenen Scorefunktion gleich gewichtet. Die Farbe führt zu keiner neuen technischen Bewertung. Es werden keine eigenen Praxistests oder übernommenen Kundensterne behauptet.

Beim Catit nennt der Amazon-Titel 2 Liter, die bereits dokumentierte Herstellerquelle nennt 2,5 Liter für den PIXI Standard. Der Herstellerwert bleibt im technischen Datensatz und die Abweichung ist sichtbar dokumentiert. Bei Philips bleibt Handreinigung maßgeblich, weil die konkrete Supportanweisung der älteren Presseinformation zur Spülmaschine widerspricht.

Die zuvor dokumentierten Filterrechnungen bleiben erhalten: Catit 36,76 EUR für zwölf Filter beim datierten Recherchepreis; Philips 59,96 EUR. Brook: Aktivkohle alle 1–2 Wochen und Ringe alle 2–4 Wochen; größtes Set 28 USD, verbrauchsanteilig 30,33–60,67 USD für 364 Tage beziehungsweise ganze Sets 56–84 USD mit Restbestand. Versand, Import, Strom, Wasser und Reinigung sind keine bestätigten Gesamtbetriebskosten. Der Brook-Setpreis wird nicht doppelt auf beide Filtertypen angewendet.

Alle drei primären Amazon-Commerce-Datensätze haben `price.current: null`, `priceState: unknown` und `availability: unknown`. Aus einer ASIN oder einem Bild wurde keine Lieferbarkeit abgeleitet. Keine neuen Preise aus dem Bildabruf übernommen; keine InStock-Offers in JSON-LD. Vollständige technische Quellen bleiben in `evidenceSources` der Produktdateien.

## Prüfung

Relevante Tests prüfen Bildherkunft und WebP-Dateien, Trackingparameter, Modell-/ASIN-Zuordnung, aktive Kaufbuttons, fehlende unbestätigte Preis-/Lagerangaben, JSON-LD, Quellen und interne Linkziele. Produktionsbuild erneut erfolgreich: 382 Seiten. 73 relevante Tests bestanden, null fehlgeschlagen. `git diff --check` erfolgreich. Aktuelle Ergebnisse stehen in `validation.json`. Keine umfangreichen Audits und kein Deployment.
