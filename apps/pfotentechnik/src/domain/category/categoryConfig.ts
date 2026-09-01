import type { CategoryDecisionPath, CategoryRequirement } from "./model";

type ProductChoice = { slug: string; role: string };
type ComparisonChoice = { slug: string; question: string; why: string };

export type CategoryEditorialConfig = {
  eyebrow: string;
  cue: string;
  requirements: CategoryRequirement[];
  paths: CategoryDecisionPath[];
  comparisons: ComparisonChoice[];
  products: ProductChoice[];
  guides: string[];
  evidenceIntro: string;
  evidenceHeadings: string[];
  closing: { title: string; text: string; href: string; label: string };
};

export const categoryEditorialConfig = {
  "smarte-futterautomaten": {
    eyebrow: "Produktwelt · Futterautomaten",
    cue: "Beginne mit Futterart, Tierzahl und Ausfallsicherheit – erst danach mit App oder Kamera.",
    requirements: [
      { label: "Futterart", question: "Trocken- oder Nassfutter?", consequence: "Vorratsautomaten dosieren trockenes Futter. Für Nassfutter brauchst du geschlossene Fächer und ein belastbares Kühlkonzept." },
      { label: "Tier & Größe", question: "Katze, kleiner oder großer Hund?", consequence: "Napfhöhe, Stabilität, Krokettengröße und mögliche Portionsmenge müssen zum Tier passen." },
      { label: "Mehrere Tiere", question: "Muss Futterklau verhindert werden?", consequence: "Zwei Näpfe verteilen Futter, trennen Tiere aber nicht. Individueller Zugang erfordert Mikrochip- oder RFID-Systeme." },
      { label: "Portionen", question: "Wie reproduzierbar muss die Ausgabe sein?", consequence: "Herstellerportionen sind Förderschritte. Die reale Grammmenge hängt vom verwendeten Futter ab und muss nachgewogen werden." },
      { label: "Ausfall", question: "Was passiert ohne Strom oder Internet?", consequence: "Lokale Zeitpläne und eine Stromreserve schützen die Kernfunktion; eine App allein macht die Fütterung nicht zuverlässig." },
      { label: "Hygiene", question: "Erreichst du Futterweg und Auslass?", consequence: "Napf, Behälter, Rotor und Ausgabekanal müssen regelmäßig kontrollierbar und reinigbar sein." }
    ],
    paths: [
      { label: "Futterart", title: "Für Nassfutter", text: "Fachsysteme nach Kühlung, Standzeit und Reinigung auswählen.", href: "/vergleiche/beste-futterautomaten-fuer-nassfutter/", cta: "Nassfutter-Systeme vergleichen" },
      { label: "Mehrkatzen", title: "Für zwei Katzen", text: "Doppelschale, getrennte Geräte und Zugangskontrolle erfüllen unterschiedliche Aufgaben.", href: "/vergleiche/beste-futterautomaten-fuer-zwei-katzen/", cta: "Passende Bauart wählen" },
      { label: "Unabhängigkeit", title: "Ohne WLAN", text: "Lokale Zeitpläne und Stromreserve priorisieren, wenn Cloud und Router keine Voraussetzung sein sollen.", href: "/vergleiche/beste-futterautomaten-ohne-wlan/", cta: "Offline-Lösungen prüfen" },
      { label: "Kontrolle", title: "Mit Kamera", text: "Sichtkontrolle kann helfen, ersetzt aber weder Fressmengenmessung noch Betreuung.", href: "/vergleiche/beste-futterautomaten-mit-kamera/", cta: "Kamera-Modelle einordnen" },
      { label: "Tier", title: "Für Hunde", text: "Kapazität, Standfestigkeit, Napfhöhe und Portionsbereich nach Hundegröße prüfen.", href: "/vergleiche/beste-futterautomaten-fuer-hunde/", cta: "Hunde-Vergleich öffnen" }
    ],
    comparisons: [
      { slug: "beste-futterautomaten-fuer-katzen", question: "Welcher Automat passt zur Katze und ihrer Futterart?", why: "Trennt Trockenfutter-Allrounder, Nassfutter-Fächer und Zugangssysteme." },
      { slug: "beste-futterautomaten-fuer-hunde", question: "Welche Bauart passt zu Größe und Ration des Hundes?", why: "Ordnet Kapazität, Napfhöhe und Portionsgrenzen nach Einsatz ein." },
      { slug: "beste-futterautomaten-fuer-nassfutter", question: "Wie bleiben vorbereitete Nassfutterportionen geschützt?", why: "Vergleicht Fachzahl, Kühlprinzip, Standzeit und Reinigung." },
      { slug: "beste-futterautomaten-fuer-zwei-katzen", question: "Verteilen oder Tiere wirklich trennen?", why: "Macht den Unterschied zwischen Doppelschale und Zugangskontrolle sichtbar." }
    ],
    products: [
      { slug: "petlibro-granary-wifi-feeder", role: "Trockenfutter-Allrounder" },
      { slug: "cat-mate-c500", role: "Nassfutter-Spezialist" },
      { slug: "surefeed-microchip-pet-feeder-connect", role: "Individueller Zugang" },
      { slug: "petlibro-granary-camera-feeder", role: "Sichtkontrolle" }
    ],
    guides: ["welcher-futterautomat-ist-der-richtige", "futterautomat-richtig-reinigen", "futterautomat-bei-stromausfall", "futterautomat-im-urlaub"],
    evidenceIntro: "Die ausführliche Kaufberatung erklärt Bauarten, Portionierung, Offline-Verhalten, Hygiene, Langzeitkosten und Grenzen automatisierter Fütterung.",
    evidenceHeadings: ["Entscheidungsmatrix: Welche Bauart passt zu welchem Einsatz?", "WLAN, Internet, Cloud und App: Vier verschiedene Ebenen", "Stromausfall richtig bewerten", "Portionen richtig kalibrieren", "Langzeitkosten: Nicht nur den Kaufpreis vergleichen"],
    closing: { title: "Jetzt die passende Bauart eingrenzen", text: "Wenn Futterart, Tierzahl und Ausfallanforderung klar sind, führt der direkte Vergleich schneller zu belastbaren Kandidaten.", href: "/vergleiche/beste-futterautomaten-fuer-katzen/", label: "Mit dem Vergleich starten" }
  },
  trinkbrunnen: {
    eyebrow: "Produktwelt · Trinkbrunnen",
    cue: "Trinkfläche und Reinigung entscheiden früher als App, Beleuchtung oder UVC.",
    requirements: [
      { label: "Tier", question: "Passt die Trinkfläche zu Schnauze und Haltung?", consequence: "Katzen brauchen meist einen gut zugänglichen Rand; bei Hunden zählen zusätzlich Höhe, Größe und Standfestigkeit." },
      { label: "Geräusch", question: "Bleibt der Brunnen auch bei wenig Wasser ruhig?", consequence: "Pumpe, Wasserstand, Untergrund und Verschmutzung verändern das Geräusch im Alltag." },
      { label: "Reinigung", question: "Sind Pumpe und Wasserweg erreichbar?", consequence: "Ein großer Tank reduziert das Nachfüllen, nicht den Wasserwechsel oder die Reinigung von Rotorraum und Oberflächen." },
      { label: "Material", question: "Edelstahl, Keramik oder Kunststoff?", consequence: "Die konkrete Konstruktion und Erreichbarkeit sind wichtiger als das Materialetikett allein." },
      { label: "Folgekosten", question: "Sind Filter und Ersatzpumpe verfügbar?", consequence: "Filterintervalle und proprietäre Verschleißteile bestimmen die laufenden Kosten und Nutzungsdauer." },
      { label: "Standort", question: "Netz, Akku oder Sensorbetrieb?", consequence: "Die Betriebsart muss zum Standort passen; kabellos bedeutet nicht automatisch dauerhaft unabhängig oder reparierbar." }
    ],
    paths: [
      { label: "Tier", title: "Für Katzen", text: "Trinkfläche, ruhiger Betrieb und Reinigung nach Katzenalltag vergleichen.", href: "/vergleiche/beste-trinkbrunnen-fuer-katzen/", cta: "Katzenbrunnen vergleichen" },
      { label: "Tier", title: "Für Hunde", text: "Größe, Stand und Trinkhöhe passend zur Hundegröße einordnen.", href: "/vergleiche/beste-trinkbrunnen-fuer-hunde/", cta: "Hundebrunnen vergleichen" },
      { label: "Hygiene", title: "Leicht zu reinigen", text: "Wasserweg, Pumpe und Rotorraum vor Zusatzfunktionen prüfen.", href: "/katzentrinkbrunnen-richtig-reinigen/", cta: "Reinigungsaufwand verstehen" },
      { label: "Material", title: "Material sinnvoll wählen", text: "Edelstahl, Keramik und Kunststoff anhand von Alltag und Konstruktion abwägen.", href: "/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/", cta: "Materialvergleich lesen" },
      { label: "Verbrauchsteile", title: "Ohne Filter", text: "Filterlose Konstruktionen lösen andere Pflegeaufgaben und brauchen weiterhin regelmäßigen Wasserwechsel.", href: "/katzentrinkbrunnen-ohne-filter/", cta: "Filterlose Systeme einordnen" },
      { label: "Alter", title: "Für Kitten", text: "Trinkhöhe, Standfestigkeit, Kabel und sichere alternative Wasserstellen vor dem Einsatz prüfen.", href: "/trinkbrunnen-fuer-kitten-sicher/", cta: "Kitten-Sicherheit lesen" }
    ],
    comparisons: [
      { slug: "beste-trinkbrunnen-fuer-katzen", question: "Welche Trinkfläche funktioniert im Katzenalltag?", why: "Vergleicht Zugang, Geräusch, Reinigung, Material und Betrieb." },
      { slug: "beste-trinkbrunnen-fuer-hunde", question: "Welcher Brunnen passt zu Hundegröße und Standort?", why: "Ordnet Volumen, Stabilität und Trinkgeometrie ein." }
    ],
    products: [
      { slug: "catit-pixi-smart-trinkbrunnen", role: "Kompakte App-Lösung" },
      { slug: "petsafe-streamside-trinkbrunnen", role: "Ruhiger Wasserlauf" },
      { slug: "petkit-eversweet-solo-2-fountain", role: "Kompakter Allrounder" },
      { slug: "petlibro-dockstream-2-smart-cordless", role: "Flexibler Standort" },
      { slug: "feelneedy-fn-w18-8l-katzenbrunnen", role: "Großes Volumen" }
    ],
    guides: ["katze-an-trinkbrunnen-gewoehnen", "katzentrinkbrunnen-richtig-reinigen", "katzentrinkbrunnen-material-edelstahl-keramik-kunststoff", "filter-im-katzentrinkbrunnen-wechseln", "katzentrinkbrunnen-dauerbetrieb-urlaub"],
    evidenceIntro: "Die vertiefende Kaufberatung ordnet Trinkfläche, Wasserweg, Pumpe, Material, Filter, Lautstärke und Betriebsart ohne Funktionsmarketing ein.",
    evidenceHeadings: ["2. Reinigung: Der wichtigste Qualitätscheck", "3. Netz, Akku oder Sensorbetrieb?", "4. Material: Edelstahl, Keramik oder Kunststoff?", "5. Filter, UVC und App: nützlich, aber nachrangig", "6. Lautstärke: Nicht nur auf die dB-Zahl schauen"],
    closing: { title: "Trinkfläche und Pflegeweg geklärt?", text: "Dann vergleiche Modelle für das konkrete Tier statt Tankvolumen und App-Funktionen isoliert zu bewerten.", href: "/vergleiche/beste-trinkbrunnen-fuer-katzen/", label: "Passende Trinkbrunnen vergleichen" }
  },
  "gps-tracker": {
    eyebrow: "Produktwelt · GPS-Tracker",
    cue: "Ein Tracker ist nur so verlässlich wie Befestigung, Funkweg, Akku und App zusammen.",
    requirements: [
      { label: "Tier", question: "Hund oder Katze?", consequence: "Gewicht, Halsband, Sicherheitsverschluss und Bewegungsprofil führen zu unterschiedlichen Trackerklassen." },
      { label: "Größe", question: "Wie schwer ist das komplette System?", consequence: "Nicht nur das Trackermodul, sondern Befestigung und Halsband müssen zum Tier passen." },
      { label: "Funkweg", question: "Gibt es Mobilfunkabdeckung?", consequence: "Satellitenposition allein reicht nicht; Mobilfunk-Tracker müssen die Position auch an Server und App übertragen." },
      { label: "Akku", question: "Unter welchen Bedingungen gilt die Laufzeit?", consequence: "Live-Modus, Empfang, Temperatur und Energiesparzonen verändern die reale Laufzeit deutlich." },
      { label: "Ortung", question: "Brauchst du echtes Live-Tracking?", consequence: "Bluetooth-Nähe und periodische Standortpunkte ersetzen keine fortlaufende Ortung eines entlaufenen Tiers." },
      { label: "Kosten & Daten", question: "Abo, Konto und Standortverlauf akzeptabel?", consequence: "Übertragungskosten, Datenzugriff, Familienfreigabe und Löschung gehören zur Kaufentscheidung." }
    ],
    paths: [
      { label: "Tier", title: "Für Hunde", text: "Befestigung, Robustheit, Live-Modus und Akku nach Hundealltag vergleichen.", href: "/vergleiche/beste-gps-tracker-fuer-hunde/", cta: "Hunde-Tracker vergleichen" },
      { label: "Tier", title: "Für Katzen", text: "Gewicht, Sicherheitsverschluss und kleine Bauform zuerst prüfen.", href: "/vergleiche/beste-gps-tracker-fuer-katzen/", cta: "Katzen-Tracker vergleichen" },
      { label: "Laufende Kosten", title: "Ohne Abo", text: "VHF, Kaufmodelle und ihre Reichweiten- beziehungsweise Infrastrukturgrenzen trennen.", href: "/vergleiche/gps-tracker-ohne-abo/", cta: "Abo-freie Wege prüfen" },
      { label: "Ausdauer", title: "Lange Akkulaufzeit", text: "Herstellermaxima nur zusammen mit Intervall und Energiesparbedingungen bewerten.", href: "/vergleiche/gps-tracker-mit-langer-akkulaufzeit/", cta: "Akkuvergleich öffnen" },
      { label: "Grundsatz", title: "GPS oder Bluetooth?", text: "Reichweite und Funktionskette vor dem Produktvergleich verstehen.", href: "/gps-oder-bluetooth/", cta: "Systeme unterscheiden" }
    ],
    comparisons: [
      { slug: "beste-gps-tracker-fuer-hunde", question: "Welcher Tracker hält im Hundealltag?", why: "Vergleicht Befestigung, Ortungsweg, Akku und Live-Modus." },
      { slug: "beste-gps-tracker-fuer-katzen", question: "Wie klein und sicher muss ein Katzentracker sein?", why: "Ordnet Gewicht, Halsbandlösung und Ortungsleistung ein." },
      { slug: "gps-tracker-ohne-abo", question: "Welche Systeme funktionieren ohne laufendes Mobilfunkabo?", why: "Zeigt Reichweiten- und Infrastrukturkompromisse statt nur den Preis." },
      { slug: "gps-tracker-mit-langer-akkulaufzeit", question: "Welche Laufzeit bleibt unter realen Bedingungen?", why: "Stellt Maximalwerte und ihre Bedingungen gegenüber." }
    ],
    products: [
      { slug: "tractive-dog-6", role: "Hunde-Allrounder" },
      { slug: "tractive-cat-6-mini", role: "Kompakte Katzenlösung" },
      { slug: "paj-pet-finder-4g-mini", role: "Alternative Mobilfunkplattform" },
      { slug: "garmin-alpha-t-20", role: "VHF-Spezialist" },
      { slug: "enabot-rola-pettracker", role: "Kamera-Spezialist" }
    ],
    guides: ["wie-funktionieren-gps-tracker", "wie-genau-sind-gps-tracker", "warum-brauchen-gps-tracker-ein-abo", "gps-tracker-richtig-befestigen", "datenschutz-bei-gps-trackern"],
    evidenceIntro: "Die ausführliche Einordnung trennt Satellitenortung, Übertragung, App, Genauigkeit, Akku, Befestigung, Datenschutz und laufende Kosten.",
    evidenceHeadings: ["Welche Systeme gibt es?", "Hund und Katze brauchen andere Prioritäten", "Reichweite und Genauigkeit richtig lesen", "Akku und laufende Kosten", "Datenschutz"],
    closing: { title: "Ortungsweg und Tiergröße stehen fest?", text: "Öffne jetzt den Vergleich für das Tier und bewerte Akku sowie Empfang immer im vorgesehenen Einsatz.", href: "/vergleiche/beste-gps-tracker-fuer-hunde/", label: "GPS-Tracker vergleichen" }
  },
  katzenklappen: {
    eyebrow: "Produktwelt · Katzenklappen",
    cue: "Zuerst Zugang, Maße und Einbau klären – App und Beuteerkennung kommen danach.",
    requirements: [
      { label: "Zugang", question: "Freier Durchgang oder Mikrochip?", consequence: "Mikrochipsteuerung kann fremde Tiere aussperren; sie löst nicht automatisch Tailgating oder Futtertrennung." },
      { label: "Maße", question: "Passen Katze und Durchgang wirklich?", consequence: "Schulterbreite, Körperhöhe und Einbaurahmen müssen vor dem Ausschnitt geprüft werden." },
      { label: "Mehrere Katzen", question: "Braucht jedes Tier eigene Rechte?", consequence: "Einige Systeme speichern mehrere IDs, aber Ein- und Ausgangsregeln unterscheiden sich je Modell." },
      { label: "Einbau", question: "Tür, Wand oder Glas?", consequence: "Material, Adapter, Tunnellänge und vorhandener Ausschnitt bestimmen Aufwand und mögliche Wärmebrücken." },
      { label: "Betrieb", question: "Was funktioniert ohne App oder Cloud?", consequence: "Lokale Zugangskontrolle, Zeitregeln und Fernzugriff müssen als getrennte Funktionen geprüft werden." },
      { label: "Komfort", question: "Wie wichtig sind Dämmung und Beuteerkennung?", consequence: "Dichtung, Klappenmechanik und Erkennungsgrenzen sind konkrete Kompromisse, keine bloßen Extras." }
    ],
    paths: [
      { label: "Zugang", title: "Mikrochip-Katzenklappen", text: "Fremde Tiere aussperren und lokale Rechte je Tier vergleichen.", href: "/vergleiche/beste-mikrochip-katzenklappen/", cta: "Mikrochip-Systeme vergleichen" },
      { label: "Smart", title: "App und Beuteerkennung", text: "Fernzugriff, lokale Funktion und Erkennungsgrenzen getrennt bewerten.", href: "/vergleiche/katzenklappen-mit-app-und-beuteerkennung/", cta: "Smarte Systeme einordnen" },
      { label: "Haushalt", title: "Für mehrere Katzen", text: "Gespeicherte Tiere, individuelle Regeln und Tailgating-Risiko prüfen.", href: "/katzenklappe-fuer-mehrere-katzen/", cta: "Mehrkatzen-Anforderungen lesen" },
      { label: "Montage", title: "Einbau planen", text: "Ausschnitt, Adapter und Einbauort vor der Modellauswahl klären.", href: "/katzenklappe-einbauen/", cta: "Einbau-Ratgeber öffnen" }
    ],
    comparisons: [
      { slug: "beste-mikrochip-katzenklappen", question: "Welche Klappe kontrolliert den Zugang zuverlässig?", why: "Vergleicht Durchgang, Tier-IDs, lokale Regeln, Einbau und Dämmung." },
      { slug: "katzenklappen-mit-app-und-beuteerkennung", question: "Wann bringen App und Beuteerkennung echten Zusatznutzen?", why: "Trennt lokale Kernfunktion, Fernzugriff und Erkennungsgrenzen." }
    ],
    products: [
      { slug: "sureflap-mikrochip-katzenklappe", role: "Mikrochip-Basis" },
      { slug: "cat-mate-elite-355w", role: "Individuelle Regeln" },
      { slug: "zeromouse-2-0", role: "Beuteerkennung" },
      { slug: "onlycat-mikrochip-katzenklappe", role: "Smarte Alternative" },
      { slug: "petwalk-medium-tiertuer", role: "Baulicher Spezialist" }
    ],
    guides: ["katzenklappe-einbauen", "katze-an-katzenklappe-gewoehnen", "katzenklappe-fuer-mehrere-katzen", "katzenklappe-zugluft-und-waermedaemmung"],
    evidenceIntro: "Die vertiefende Kaufberatung erklärt Zugangsrollen, Messung, Tailgating, App-Grenzen, Einbau und den laufenden Betrieb.",
    evidenceHeadings: ["Vier Produktrollen, vier Aufgaben", "Entscheidung in fünf Schritten", "Warum viele Katzenklappen falsch gekauft werden", "Vor dem Kauf messen", "Nach dem Einbau"],
    closing: { title: "Zugang und Einbauort geklärt?", text: "Dann vergleiche nur Systeme, deren Durchgang, Rechte und lokale Kernfunktion zu deinem Haushalt passen.", href: "/vergleiche/beste-mikrochip-katzenklappen/", label: "Katzenklappen vergleichen" }
  },
  haustierkameras: {
    eyebrow: "Produktwelt · Haustierkameras",
    cue: "Blickbereich, Speicherung und laufende Kosten sind wichtiger als die längste KI-Funktionsliste.",
    requirements: [
      { label: "Aufgabe", question: "Beobachten, sprechen oder interagieren?", consequence: "Eine normale Indoor-Kamera kann für reine Sichtkontrolle genügen; Futterwurf und mobile Geräte lösen andere Aufgaben." },
      { label: "Blickbereich", question: "Sieht die Kamera den relevanten Ort?", consequence: "Standort, Schwenkwinkel und tote Bereiche entscheiden oft stärker als die nominelle Auflösung." },
      { label: "Speicherung", question: "Lokal, Cloud oder beides?", consequence: "Lokale Aufnahme bedeutet nicht automatisch, dass Wiedergabe, Erkennung und Fernzugriff ohne Herstellerdienst laufen." },
      { label: "Konto & Abo", question: "Welche Funktionen bleiben ohne Bezahlplan?", consequence: "Ereignisse, Verlauf, KI-Erkennung und Cloudspeicher können an Konto oder Abonnement gebunden sein." },
      { label: "Privatsphäre", question: "Welcher Innenraum wird dauerhaft erfasst?", consequence: "Kamerawinkel, Mikrofon, Freigaben und Löschwege gehören vor der Montage geklärt." },
      { label: "Ausfall", question: "Was bleibt ohne Internet oder Cloud?", consequence: "Livebild, lokale Aufnahme, Benachrichtigung und Wiedergabe können bei Ausfällen unterschiedlich reagieren." }
    ],
    paths: [
      { label: "Überblick", title: "Die besten Haustierkameras", text: "Kameraklassen, Blickbereich, Speicherung, Interaktion und Kosten direkt gegenüberstellen.", href: "/vergleiche/beste-haustierkameras/", cta: "Vergleich öffnen" },
      { label: "Einfach", title: "Nur beobachten", text: "Wenn Livebild und lokale Speicherung reichen, kann eine klassische Indoor-Kamera die klarere Lösung sein.", href: "#auswahl", cta: "Ausgewählte Modelle ansehen" },
      { label: "Interaktion", title: "Sprechen oder Futter werfen", text: "Prüfe, ob die Interaktion im Alltag wirklich genutzt wird und welche Cloud-Funktionen vorausgesetzt werden.", href: "#kaufberatung", cta: "Kriterien vertiefen" },
      { label: "Beschäftigung", title: "Technik gegen Langeweile", text: "Kameras können Kontakt ermöglichen, ersetzen aber weder Bewegung noch soziale Betreuung.", href: "/wie-kann-technik-gegen-langeweile-helfen/", cta: "Grenzen einordnen" }
    ],
    comparisons: [
      { slug: "beste-haustierkameras", question: "Welche Kameraklasse passt zur eigentlichen Aufgabe?", why: "Vergleicht stationäre, interaktive und mobile Lösungen samt Speicherung und Kosten." }
    ],
    products: [
      { slug: "reolink-e1-zoom", role: "Klassische Indoor-Kamera" },
      { slug: "furbo-mini-360", role: "Kompakte Haustierkamera" },
      { slug: "petlibro-scout-smart-camera", role: "KI-gestützte Beobachtung" },
      { slug: "pettec-cam-360", role: "Lokale Speicheroption" },
      { slug: "enabot-rola-mini", role: "Mobile Perspektive" }
    ],
    guides: ["wie-kann-technik-gegen-langeweile-helfen", "smarte-haustiertechnik"],
    evidenceIntro: "Die ausführliche Einordnung trennt Blickbereich, Interaktion, lokale Aufnahme, Cloudabhängigkeit, Datenschutz und Gesamtkosten.",
    evidenceHeadings: ["Reicht eine normale Indoor-Kamera?", "Entscheidung nach Aufgabe", "Blickbereich vor Auflösung", "Cloud, Konto und Speicherung vor dem Kauf klären", "Gesamtkosten über 24 Monate rechnen"],
    closing: { title: "Aufgabe und Speicherweg stehen fest?", text: "Dann vergleiche Kameras nach ihrem realen Betrieb – nicht nach einzelnen KI- oder Marketingbegriffen.", href: "/vergleiche/beste-haustierkameras/", label: "Haustierkameras vergleichen" }
  },
  "automatische-katzentoiletten": {
    eyebrow: "Produktwelt · Katzentoiletten",
    cue: "Sicherheit, Einstieg und Streu-Kompatibilität müssen vor App und Komfortfunktionen passen.",
    requirements: [
      { label: "Katze", question: "Passen Gewicht, Größe und Einstieg?", consequence: "Mindestgewicht, Innenraum und Einstiegshöhe entscheiden, ob die Automatik sicher und akzeptabel nutzbar ist." },
      { label: "Bauform", question: "Offen oder geschlossen?", consequence: "Offene Systeme bieten Einblick und oft niedrigere Einstiege; geschlossene Systeme reduzieren Austrag, können aber enger wirken." },
      { label: "Sicherheit", question: "Wie erkennt das System die Katze?", consequence: "Sensorprinzip, Stoppverhalten und Betrieb bei jungen oder sehr leichten Katzen müssen dokumentiert sein." },
      { label: "Streu", question: "Ist die vorhandene Streu kompatibel?", consequence: "Klumpverhalten, Korngröße und Herstellerfreigaben beeinflussen Trennung, Verschleiß und Reinigung." },
      { label: "Wartung", question: "Wie zugänglich sind Trommel und Sensoren?", consequence: "Automatisches Sieben ersetzt weder das Nachfüllen noch die regelmäßige Reinigung von Kontaktflächen und Mechanik." },
      { label: "Haushalt & Kosten", question: "Mehrere Katzen, App und Verbrauchsteile?", consequence: "Identifikation, Nutzungsdaten, Beutel, Filter und weitere Verbrauchsteile bestimmen Alltag und Folgekosten." }
    ],
    paths: [
      { label: "Sicherheit", title: "Für kleine oder leichte Katzen", text: "Mindestgewicht, Einstieg und Freigaben vor Automatikbetrieb prüfen.", href: "#kaufberatung", cta: "Sicherheitskriterien lesen" },
      { label: "Bauform", title: "Offen oder geschlossen", text: "Innenraum, Akzeptanz, Streuaustrag und Stellfläche gegeneinander abwägen.", href: "#kaufberatung", cta: "Bauformen einordnen" },
      { label: "Haushalt", title: "Für mehrere Katzen", text: "Kapazität, Erkennung, Profile und Reinigungsrhythmus als Gesamtsystem bewerten.", href: "/vergleiche/beste-automatische-katzentoiletten/", cta: "Modelle vergleichen" },
      { label: "Pflege", title: "Wartung und Streu", text: "Kompatibilität und Zugang zu Trommel, Sieb und Sensoren vor dem Kauf klären.", href: "#auswahl", cta: "Ausgewählte Systeme ansehen" }
    ],
    comparisons: [
      { slug: "beste-automatische-katzentoiletten", question: "Welches Sicherheits- und Raumkonzept passt zur Katze?", why: "Vergleicht Einstieg, Bauform, Sensorik, Streu, Reinigung und laufende Kosten." }
    ],
    products: [
      { slug: "petkit-purobot-max-3", role: "Niedriger Einstieg" },
      { slug: "petsnowy-snow-plus", role: "Geschlossene Bauform" },
      { slug: "neakasa-m1-lite", role: "Offene Alternative" },
      { slug: "litter-robot-4", role: "Etablierte Plattform" },
      { slug: "petlibro-luma-smart-litter-box", role: "Kompakte Alternative" }
    ],
    guides: ["smarte-haustiertechnik"],
    evidenceIntro: "Die ausführliche Kaufberatung erklärt Funktionsprinzip, offene und geschlossene Bauformen, Mindestgewicht, Sicherheit, Streu, Wartung, Monitoring und laufende Kosten.",
    evidenceHeadings: ["Wie selbstreinigende Katzentoiletten funktionieren", "Offen oder geschlossen?", "Sicherheit, Kitten und Stromausfall", "Streu, Wartung und Geruch", "Laufende Kosten"],
    closing: { title: "Sicherheit und Platzbedarf geprüft?", text: "Dann vergleiche nur Toiletten, deren Einstieg, Sensorik und Streu-Kompatibilität zur Katze passen.", href: "/vergleiche/beste-automatische-katzentoiletten/", label: "Katzentoiletten vergleichen" }
  }
} satisfies Record<string, CategoryEditorialConfig>;

export type CategoryHubSlug = keyof typeof categoryEditorialConfig;

export const isCategoryHubSlug = (slug: string): slug is CategoryHubSlug =>
  Object.prototype.hasOwnProperty.call(categoryEditorialConfig, slug);
