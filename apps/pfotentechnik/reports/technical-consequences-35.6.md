# PfotenTechnik 35.6 Technische Entscheidungshilfen und Schema Befund

Stand: 16. November 2026. Die automatische Akkuableitung wurde gezielt korrigiert. Die fehlende Übernahme redaktioneller decisionFacts bleibt als separates Schema-Problem offen; das Content-Schema wurde nicht geändert.

## Reproduzierte Fehler und Korrekturen

- Die ursprüngliche Teilstringsuche deutete „Integrierter Akku, keine Angaben zur Austauschbarkeit“ als fehlenden Akku. Unbekannter Akkustatus erzeugte umgekehrt einen positiven Akkuhinweis.
- Die Laufzeitangaben mit „ohne Energiesparzone“ beziehungsweise „ohne“ erzeugten bei CAT 6 Mini, DOG 6 und DOG 6 XL die falsche Aussage „Kein integrierter Akku“. Dies wurde mit dem ursprünglichen Git-Blob 409ed9ad und den echten Produktdaten reproduziert.
- Bei CAT 6 Mini und DOG 6 XL ordnete die allgemeine Kapazitätsregel 450 mAh beziehungsweise 2150 mAh einem nachfüllbaren Vorrat zu. Akku-Labels sind jetzt ausdrücklich von der Volumenregel ausgeschlossen.
- Nachgewiesene weitere Fehler: „Ohne App“, „App nicht vorhanden“, „WLAN nicht vorhanden“ und „Kamera nicht vorhanden“ wurden positiv interpretiert. Fehlende App-Angaben konnten ebenfalls eine positive Aussage erzeugen. Die Erkennung verlangt nun Aussagen über das Merkmal selbst.
- Vorhanden, nicht vorhanden und unbekannt sind getrennte Zustände. Fehlende Angaben zu Austausch, Zellchemie oder Laufzeit ergeben ohne weiteren Beleg weder Vorhandensein noch Fehlen. Bekannte Akkuangaben bleiben trotz fehlender Detailinformationen erhalten.

## Redaktionelle decisionFacts im Content Schema

**Befund: starke Indizien für eine unbeabsichtigte Integrationslücke, keine belegte bewusste Abschaffung.** Die persönliche Absicht des ursprünglichen Autors ist durch die verfügbare Git-Historie nicht abschließend beweisbar. Ein spezieller Zugriff auf zugehörige KI-Gespräche stand nicht zur Verfügung.

Belege im Repository:

- Commit fc4f9e53 vom 1. August 2026 führte consequences.ts mit Vorrang für explizite decisionFacts ein und ergänzte entsprechende Produktdaten. Das damalige product.ts deklarierte dieses Feld bereits nicht.
- Die Git-Suche nach decisionFacts in der Historie von src/content/schema/product.ts und base.ts zeigt keine Einführung oder gezielte Entfernung des Feldes.
- src/domain/productExperience/consequences.ts unterstützt data.decisionFacts weiterhin ausdrücklich und gibt vollständigen redaktionellen Fakten Vorrang. model.ts übergibt die Produktdaten an diese Funktion.
- scripts/product-standard-3/enrich.mjs schreibt decisionFacts weiterhin in Frontmatter. audit.mjs meldet bei fehlenden Fakten DECISION_FACTS_DERIVED und empfiehlt eigene redaktionelle Konsequenzen.
- Das aktuelle createProductContentSchema in src/content/schema/product.ts enthält kein decisionFacts. Die final gebaute .astro/data-store.json wurde mit devalue geparst: Bei allen drei Tractive-Produkten fehlen decisionFacts in entry.data, während specs vorhanden sind.
- 73 Produktdateien enthalten nichtleere redaktionelle decisionFacts; bei 73 davon fehlt das Feld im gebauten Content-Datenspeicher. Die betroffenen URLs stehen unten. Das ist ein Übernahmeproblem, keine Aussage, dass jede dort automatisch angezeigte Konsequenz falsch ist.

Die Feldnamen decision in den Produktdaten und decisionFacts in der Advisor-Domain sind andere Datenstrukturen und ersetzen diese redaktionelle Liste nicht. Eine spätere gezielte Schema-Korrektur benötigt eigene Validierung und Prüfung der dann erstmals aktiven redaktionellen Texte. 35.6 aktiviert das Feld nicht pauschal.

Astro-Dokumentation zur Schema-Validierung: https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema

## Aussagen aus dem endgültigen HTML

Direkt aus dist/produkt/<slug>/index.html extrahierte sichtbare Texte im Abschnitt „Was die wichtigsten Daten bedeuten“, nach dem endgültigen Build. Es folgen alle sechs Einträge je Seite.

### tractive-cat-6-mini

URL: /produkt/tractive-cat-6-mini/

- **Akkutechnik und Austausch Integrierter, wiederaufladbarer Akku; Zellchemie und Austausch durch Nutzer in den geprüften modellspezifischen Herstellerangaben nicht eindeutig dokumentiert**

  Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.

- **Abo Erforderlich; ein Abo pro Tracker**

  Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.

- **App Tractive GPS App; Android 10 oder neuer, iOS 17 oder neuer**

  Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.

- **Akkukapazität 450 mAh**

  Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.

- **Akkulaufzeit Bis zu 7 Tage mit Energiesparzone; bis zu 4 Tage ohne Energiesparzone**

  Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.

- **Stromversorgung Integrierter Akku**

  Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.

### tractive-dog-6

URL: /produkt/tractive-dog-6/

- **Akkutechnik und Austausch Integrierter, wiederaufladbarer Akku; Zellchemie und Austausch durch Nutzer in den geprüften modellspezifischen Herstellerangaben nicht eindeutig dokumentiert**

  Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.

- **Abo Erforderlich; ein eigenes Abo pro Tracker**

  Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.

- **App Tractive GPS App; Android 10 oder neuer, iOS/iPadOS 17 oder neuer**

  Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.

- **Akkulaufzeit Laut Tractive bis zu 14 Tage mit Energiesparzonen; bis zu 6 Tage ohne**

  Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.

- **Stromversorgung Integrierter Akku; Laden über das mitgelieferte USB-C-Ladekabel**

  Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.

- **Akku Integrierter Akku, laut Support 930 mAh**

  Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.

### tractive-dog-6-xl

URL: /produkt/tractive-dog-6-xl/

- **Akkukapazität 2150 mAh laut Tractive**

  Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.

- **Akkutechnik und Austausch Integrierter, wiederaufladbarer Akku; Zellchemie und Austausch durch Nutzer in den geprüften modellspezifischen Herstellerangaben nicht eindeutig dokumentiert**

  Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.

- **Abo Erforderlich; ein eigenes Abo pro Tracker**

  Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.

- **App Tractive GPS App; Android 10 oder neuer, iOS/iPadOS 17 oder neuer**

  Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.

- **Akkulaufzeit Bis zu 42 Tage mit Energiesparzonen; bis zu 20 Tage ohne**

  Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.

- **Stromversorgung Integrierter Akku; Laden über das mitgelieferte USB-C-Ladekabel**

  Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.

## Validierung

- Endgültiger Build: npm run build:pfotentechnik erfolgreich, 382 Seiten, 1 Minute 20 Sekunden.
- Nach diesem Build bestanden 62 relevante Tests, keine Fehler und keine übersprungenen Tests.
- Neue Regressionen umfassen die sechs geforderten Akkuformulierungen, unbekannte Detailangaben, explizite und negierte App-, WLAN- und Kameraangaben sowie Ja/Nein mit zusätzlichen Details.
- mAh-Akkukapazität ist mit GPS-Tracker, Trinkbrunnen und Futterautomaten geprüft. Bei Trinkbrunnen und Futterautomaten werden Volumen-, Nachfüll- und Futterdichte-Hinweise ausdrücklich ausgeschlossen; fehlende Kapazitätsangaben erzeugen keine Eigenschaft.
- Drei Tests lesen die tatsächlich gebauten Tractive-Seiten. Sie prüfen alle sichtbaren Akkuwerte und Akku-Konsequenzen, das Fehlen von „Kein integrierter Akku“ und Nachfüllhinweisen sowie weiterhin sichtbare Unsicherheit zu Zellchemie und Austausch.
- Bestehende Tests für Product Experience, Content-Hotfixes und Decision Data sind eingeschlossen.

Testdateien: test/product-consequences-35.6.test.mjs, test/product-consequences-rendered-35.6.test.mjs, test/product-experience-2.test.mjs, test/product-experience-2-content-hotfix.test.mjs, test/product-experience-2-hotfix.test.mjs und test/decision-data-batch-03.test.mjs.

## Umfang und Diff Kontrolle

Die Umsetzung betrifft src/domain/productExperience/consequences.ts, zwei Regressionstestdateien und diesen Bericht. Der Gesamtdiff wurde gegen den ursprünglichen Funktionsstand 409ed9ad sowie der aktuelle Arbeitsdiff geprüft. Während der Arbeit wurde ein Zwischenstand durch einen externen Commit aae90ccf in HEAD übernommen; deshalb enthält git diff HEAD allein nicht mehr die gesamte 35.6-Korrektur.

Keine Schemaänderung, keine Änderung an Bewertungen, Scores oder Affiliate-Links, keine neuen Produktseiten, keine Änderung am Indexierungsexperiment 35.5. Kein Merge und kein Deployment durch diesen Auftrag. Bereits vorhandene beziehungsweise parallele Produktdatenänderungen wurden nicht zurückgesetzt oder übernommen.

## Produktseiten mit verworfenen redaktionellen decisionFacts

- Aqara Smart Pet Feeder C1: /produkt/aqara-smart-pet-feeder-c1/ (6 redaktionelle Einträge)
- Cat Mate Pet Fountain 335: /produkt/cat-mate-335-pet-fountain/ (6 redaktionelle Einträge)
- Cat Mate C200: /produkt/cat-mate-c200/ (6 redaktionelle Einträge)
- Cat Mate C300: /produkt/cat-mate-c300/ (6 redaktionelle Einträge)
- Cat Mate C500: /produkt/cat-mate-c500/ (6 redaktionelle Einträge)
- Cat Mate Shell Pet Fountain: /produkt/cat-mate-shell-fountain/ (6 redaktionelle Einträge)
- Catit PIXI Smart 6-Meal Feeder: /produkt/catit-pixi-smart-6-meal-feeder/ (6 redaktionelle Einträge)
- Catit PIXI Vision Smart Feeder: /produkt/catit-pixi-vision-smart-feeder/ (5 redaktionelle Einträge)
- Devoko 90L Automatisches Katzenklo: /produkt/devoko-90l-automatisches-katzenklo/ (8 redaktionelle Einträge)
- Garmin Alpha T 20: /produkt/garmin-alpha-t-20/ (6 redaktionelle Einträge)
- Garmin Alpha TT 25: /produkt/garmin-alpha-tt-25/ (6 redaktionelle Einträge)
- HoneyGuardian A305D: /produkt/honeyguardian-a305d/ (6 redaktionelle Einträge)
- HoneyGuardian A68 Smart Pet Feeder: /produkt/honeyguardian-a68/ (6 redaktionelle Einträge)
- HoneyGuardian Smart Pet Feeder S305D: /produkt/honeyguardian-smart-pet-feeder-s305d/ (6 redaktionelle Einträge)
- IMIPAW 3L Automatic Cat Feeder: /produkt/imipaw-3l-automatic-cat-feeder/ (6 redaktionelle Einträge)
- Neakasa M1 Plus Lite: /produkt/neakasa-m1-lite/ (6 redaktionelle Einträge)
- oneisall 2,2L Cordless Cat Fountain: /produkt/oneisall-2-2l-cordless-fountain/ (6 redaktionelle Einträge)
- Oneisall 2-in-1 Automatic Cat Feeder and Water Dispenser: /produkt/oneisall-2-in-1-feeder-water/ (6 redaktionelle Einträge)
- oneisall 3,2L Cordless Cat Fountain: /produkt/oneisall-3-2l-cordless-fountain/ (6 redaktionelle Einträge)
- oneisall 3,5L Cordless Fountain: /produkt/oneisall-3-5l-cordless-fountain/ (6 redaktionelle Einträge)
- oneisall 5L Automatic Cat Feeder: /produkt/oneisall-5l-automatic-cat-feeder/ (6 redaktionelle Einträge)
- oneisall 7L Dog Water Fountain: /produkt/oneisall-7l-dog-water-fountain/ (6 redaktionelle Einträge)
- PAJ PET Finder 4G Mini: /produkt/paj-pet-finder-4g-mini/ (6 redaktionelle Einträge)
- PAWBBY Smart Pet Feeder: /produkt/pawbby-smart-pet-feeder/ (6 redaktionelle Einträge)
- PawSync Smart Pet Feeder: /produkt/pawsync-smart-pet-feeder/ (6 redaktionelle Einträge)
- PETKIT Eversweet 3 Pro UVC: /produkt/petkit-eversweet-3-pro-uvc/ (6 redaktionelle Einträge)
- PETKIT Eversweet 5 Mini: /produkt/petkit-eversweet-5-mini/ (6 redaktionelle Einträge)
- PETKIT Eversweet Max 2 UVC: /produkt/petkit-eversweet-max-2-uvc/ (6 redaktionelle Einträge)
- PETKIT Eversweet Max Cordless: /produkt/petkit-eversweet-max-cordless/ (6 redaktionelle Einträge)
- PETKIT Eversweet Solo 2: /produkt/petkit-eversweet-solo-2-fountain/ (6 redaktionelle Einträge)
- PETKIT Eversweet Solo SE: /produkt/petkit-eversweet-solo-se/ (6 redaktionelle Einträge)
- PETKIT Eversweet Ultra: /produkt/petkit-eversweet-ultra/ (6 redaktionelle Einträge)
- PETKIT Fresh Element Infinity: /produkt/petkit-fresh-element-infinity/ (6 redaktionelle Einträge)
- PETKIT Fresh Element Solo: /produkt/petkit-fresh-element-solo/ (6 redaktionelle Einträge)
- PETKIT YumShare Dual-Hopper 2: /produkt/petkit-yumshare-dual-hopper/ (6 redaktionelle Einträge)
- PETKIT YumShare Solo 2: /produkt/petkit-yumshare-solo-2/ (6 redaktionelle Einträge)
- PETLIBRO Air Automatic Feeder: /produkt/petlibro-air-automatic-feeder/ (6 redaktionelle Einträge)
- PETLIBRO Air WiFi Feeder: /produkt/petlibro-air-wifi-feeder/ (6 redaktionelle Einträge)
- PETLIBRO Capsule Dog Fountain: /produkt/petlibro-capsule-dog-fountain/ (6 redaktionelle Einträge)
- PETLIBRO Dockstream 2 Smart: /produkt/petlibro-dockstream-2-smart/ (6 redaktionelle Einträge)
- PETLIBRO Dockstream 2 Smart Cordless: /produkt/petlibro-dockstream-2-smart-cordless/ (6 redaktionelle Einträge)
- PETLIBRO Dockstream Cordless: /produkt/petlibro-dockstream-cordless/ (6 redaktionelle Einträge)
- PETLIBRO Dockstream RFID Smart: /produkt/petlibro-dockstream-rfid-smart/ (6 redaktionelle Einträge)
- PETLIBRO Glacier Ultrafiltration Fountain: /produkt/petlibro-glacier-ultrafiltration/ (6 redaktionelle Einträge)
- PETLIBRO Granary 2 Vision: /produkt/petlibro-granary-2-vision/ (6 redaktionelle Einträge)
- PETLIBRO Granary Camera Feeder: /produkt/petlibro-granary-camera-feeder/ (6 redaktionelle Einträge)
- PETLIBRO Granary WiFi Dual Food Tray Feeder: /produkt/petlibro-granary-dual-feeder/ (6 redaktionelle Einträge)
- PETLIBRO Granary WiFi Feeder: /produkt/petlibro-granary-wifi-feeder/ (6 redaktionelle Einträge)
- PETLIBRO One RFID Smart Feeder: /produkt/petlibro-one-rfid-smart-feeder/ (6 redaktionelle Einträge)
- PETLIBRO Polar Wet Food Feeder: /produkt/petlibro-polar-wet-food-feeder/ (6 redaktionelle Einträge)
- PETLIBRO Space Smart Feeder: /produkt/petlibro-space-smart-feeder/ (6 redaktionelle Einträge)
- PETLIBRO Stainless Steel Fountain 3L: /produkt/petlibro-stainless-steel-fountain/ (6 redaktionelle Einträge)
- PetSafe FreshFeed Refrigerated Pet Feeder: /produkt/petsafe-freshfeed-refrigerated-feeder/ (4 redaktionelle Einträge)
- PetSafe Healthy Pet Simply Feed: /produkt/petsafe-healthy-pet-simply-feed/ (6 redaktionelle Einträge)
- PetSafe Petporte smart flap: /produkt/petsafe-petporte-smart-flap/ (7 redaktionelle Einträge)
- PetSafe Smart Feed 2.0: /produkt/petsafe-smart-feed-2/ (5 redaktionelle Einträge)
- SureFeed Microchip Pet Feeder: /produkt/surefeed-microchip-pet-feeder/ (6 redaktionelle Einträge)
- SureFeed Microchip Pet Feeder Connect: /produkt/surefeed-microchip-pet-feeder-connect/ (6 redaktionelle Einträge)
- SureFlap DualScan Mikrochip Katzenklappe: /produkt/sureflap-dualscan-mikrochip-katzenklappe/ (5 redaktionelle Einträge)
- SureFlap Mikrochip Katzenklappe: /produkt/sureflap-mikrochip-katzenklappe/ (8 redaktionelle Einträge)
- SureFlap Mikrochip Katzenklappe Connect: /produkt/sureflap-mikrochip-katzenklappe-connect/ (7 redaktionelle Einträge)
- Tractive CAT 6 Mini: /produkt/tractive-cat-6-mini/ (6 redaktionelle Einträge)
- Tractive DOG 6: /produkt/tractive-dog-6/ (6 redaktionelle Einträge)
- Tractive DOG 6 XL: /produkt/tractive-dog-6-xl/ (6 redaktionelle Einträge)
- Weenect XS GPS-Tracker: /produkt/weenect-xs/ (6 redaktionelle Einträge)
- Weenect XT GPS-Tracker: /produkt/weenect-xt/ (6 redaktionelle Einträge)
- WOPET Cube Air WiFi Pet Feeder CA10: /produkt/wopet-cube-air-ca10/ (6 redaktionelle Einträge)
- WOPET Heritage View Camera Feeder: /produkt/wopet-heritage-view-camera-feeder/ (6 redaktionelle Einträge)
- WOPET Patrol F07 Pro: /produkt/wopet-patrol-f07-pro/ (6 redaktionelle Einträge)
- WOPET Pioneer F01 Plus: /produkt/wopet-pioneer-f01-plus/ (6 redaktionelle Einträge)
- Xiaomi Smart Pet Food Feeder 2: /produkt/xiaomi-smart-pet-food-feeder-2/ (6 redaktionelle Einträge)
- Xiaomi Smart Pet Fountain 2: /produkt/xiaomi-smart-pet-fountain-2/ (6 redaktionelle Einträge)
- ZeroMOUSE 2.0: /produkt/zeromouse-2-0/ (4 redaktionelle Einträge)
