import type { AutoContentBlock } from "./assembleContentPage";

export type InformationGainProfile = {
  blocks: AutoContentBlock[];
  summary: string[];
  checklist: string[];
  mistakes: string[];
  expertNote: string;
  nextLinks: Array<{ href: string; label: string; reason: string }>;
};

export const informationGainProfiles: Record<string, InformationGainProfile> = {
  "hund-frisst-zu-schnell": {
    blocks: ["summary", "checklist", "mistakes"],
    summary: ["Schlingen ist ein Tempo- und Sicherheitsproblem, nicht automatisch ein Mengenproblem.", "Die Ursache kann von Konkurrenz und großen Portionen bis zu Schmerzen oder Erkrankungen reichen.", "Die sicherste erste Maßnahme ist kontrollierte Verlangsamung bei unveränderter Tagesration."],
    checklist: ["Fressdauer und Begleitsymptome dokumentieren", "Tagesration in kleinere Mahlzeiten teilen", "Lösung passend zu Schnauze und Futter testen", "Bei Würgen, Schmerz oder Gewichtsverlust tierärztlich abklären"],
    mistakes: ["Tagesmenge unbemerkt erhöhen", "Zu schwere oder verschluckbare Hindernisse in den Napf legen", "Medizinische Warnzeichen als bloße Gewohnheit abtun"],
    expertNote: "Miss die Fressdauer vor und nach einer Änderung. Nur so erkennst du, ob eine Lösung tatsächlich verlangsamt, ohne Frust oder Futterverweigerung zu erzeugen.",
    nextLinks: [{ href: "/warum-schlingt-mein-hund/", label: "Ursachen unterscheiden", reason: "Für Konkurrenz, Hunger, Verhalten und medizinische Auslöser." }, { href: "/vergleiche/futterautomat-gegen-schlingen/", label: "Technische Lösungen vergleichen", reason: "Wenn kleinere automatische Mahlzeiten sinnvoll sind." }]
  },
  "hund-trinkt-ploetzlich-viel": {
    blocks: ["summary", "checklist", "mistakes"],
    summary: ["Eine plötzliche deutliche Zunahme ist wichtiger als ein einzelner pauschaler Milliliter-Grenzwert.", "Hitze, Aktivität und Futterart können die Trinkmenge verändern, aber auch Erkrankungen oder Medikamente.", "Wasser darf nicht entzogen werden, um das Symptom zu testen."],
    checklist: ["24-Stunden-Menge messen", "Gewicht, Futterart, Wetter und Medikamente notieren", "Urinabsatz und weitere Symptome beobachten", "Bei deutlicher oder anhaltender Veränderung Tierarztpraxis kontaktieren"],
    mistakes: ["Wasser begrenzen", "Nur die Napfmenge ohne Verschütten und mehrere Tiere messen", "Bei Erbrechen, Schwäche oder fehlendem Urin abwarten"],
    expertNote: "Für die Tierarztpraxis ist eine kurze Zeitreihe wertvoller als die Aussage „trinkt viel“: Datum, aufgenommene Menge, Körpergewicht, Futter und Begleitsymptome.",
    nextLinks: [{ href: "/trinkmenge-hund-messen/", label: "Trinkmenge sauber messen", reason: "Für Haushalte mit Verschütten oder mehreren Tieren." }, { href: "/wie-viel-wasser-braucht-ein-hund/", label: "Bedarf einordnen", reason: "Um Futterart, Wetter und Aktivität zu berücksichtigen." }]
  },
  "hund-trinkt-viel": {
    blocks: ["summary", "checklist"],
    summary: ["Entscheidend sind Dauer, Veränderung zum Normalwert und Begleitsymptome.", "Nassfutter und Trockenfutter verschieben die sichtbare Wasseraufnahme stark.", "Eine gemessene 24-Stunden-Menge lässt sich besser beurteilen als häufige Napfbesuche."],
    checklist: ["Ausgangswert über 24 Stunden messen", "Wasser im Futter berücksichtigen", "Urinmenge und Verhalten notieren", "Auffällige Entwicklung tierärztlich besprechen"],
    mistakes: ["Wasser einschränken", "Mehrere Hunde gemeinsam messen", "Literangaben ohne Körpergewicht interpretieren"],
    expertNote: "Vergleiche den Hund zuerst mit seinem eigenen stabilen Normalwert. Individuelle Veränderungen sind oft aussagekräftiger als eine starre Tabelle.",
    nextLinks: [{ href: "/hund-trinkt-ploetzlich-viel/", label: "Plötzliche Zunahme einordnen", reason: "Wenn sich das Verhalten kurzfristig verändert hat." }, { href: "/trinkmenge-hund-messen/", label: "Messfehler vermeiden", reason: "Für eine belastbare 24-Stunden-Erfassung." }]
  },
  "warum-hunde-feste-fuetterungszeiten-brauchen": {
    blocks: ["summary", "checklist", "mistakes"],
    summary: ["Feste Zeiten schaffen Beobachtbarkeit, sind aber kein medizinisches Muss auf die Minute.", "Wichtiger als starre Uhrzeiten sind passende Tagesmenge, verlässliche Routine und individuelle Verträglichkeit.", "Welpen, kranke Hunde und bestimmte Medikamente können andere Intervalle erfordern."],
    checklist: ["Tagesration festlegen", "Mahlzeiten zum Alltag passend verteilen", "Kot, Hunger und Verträglichkeit beobachten", "Änderungen schrittweise vornehmen"],
    mistakes: ["Routine mit minutengenauer Starrheit verwechseln", "Leckerlis außerhalb der Tagesration ignorieren", "Fütterungsplan trotz medizinischer Vorgaben unverändert lassen"],
    expertNote: "Eine gute Routine ist stabil genug für Vergleichbarkeit und flexibel genug für den Hund. Sie macht Veränderungen bei Appetit und Verdauung früher sichtbar.",
    nextLinks: [{ href: "/wie-viele-mahlzeiten-hund/", label: "Mahlzeitenzahl bestimmen", reason: "Nach Alter, Alltag und Verträglichkeit." }, { href: "/fuetterungszeiten-nach-alter/", label: "Zeiten nach Lebensphase planen", reason: "Für Welpen, Erwachsene und Senioren." }]
  },
  "warum-katzen-fliessendes-wasser-trinken": {
    blocks: ["summary", "checklist", "mistakes"],
    summary: ["Nicht jede Katze bevorzugt fließendes Wasser; individuelle Erfahrung und Standort zählen.", "Bewegung kann Wasser auffälliger machen, während Geräusch oder Spritzer andere Katzen abschrecken.", "Ein Brunnen erhöht die Aufnahme nicht garantiert und ersetzt keine Messung bei Gesundheitsfragen."],
    checklist: ["Brunnen parallel zur Schale anbieten", "Standort und Geräusch getrennt testen", "Wasseraufnahme statt bloßer Besuche beobachten", "Mehrere Wasserstellen beibehalten"],
    mistakes: ["Vorliebe als biologisches Gesetz darstellen", "Schale sofort entfernen", "Häufiges Trinken automatisch als Erfolg werten"],
    expertNote: "Beobachte Aufnahme, nicht nur Interesse. Spielen mit dem Strahl oder häufige Besuche sagen noch nicht, wie viel Wasser tatsächlich aufgenommen wird.",
    nextLinks: [{ href: "/katze-an-trinkbrunnen-gewoehnen/", label: "Präferenz fair testen", reason: "Ohne die bisherige Wasserquelle abrupt zu entfernen." }, { href: "/trinkmenge-katze-messen/", label: "Aufnahme belastbar erfassen", reason: "Wenn die Trinkmenge gesundheitlich relevant ist." }]
  },
  "wie-kann-technik-gegen-langeweile-helfen": {
    blocks: ["summary", "checklist", "mistakes"],
    summary: ["Technik kann Abwechslung dosieren, ersetzt aber keine soziale Interaktion, Bewegung und artspezifische Beschäftigung.", "Der Nutzen zeigt sich an Verhalten und Nutzung, nicht an App-Funktionen.", "Automatische Reize müssen Fluchtmöglichkeit, Pausen und sichere Materialien respektieren."],
    checklist: ["Verhaltensziel definieren", "Gerät beaufsichtigt einführen", "Nutzungsdauer und Stresssignale beobachten", "Angebote rotieren statt Dauerbetrieb"],
    mistakes: ["Gerät unbegrenzt laufen lassen", "Laserpunkte ohne fangbaren Abschluss einsetzen", "Desinteresse mit mehr Reizintensität beantworten"],
    expertNote: "Gute Beschäftigung endet mit einem erreichbaren Ergebnis. Reine Reizverfolgung ohne Fang-, Such- oder Kauabschluss kann Frust statt Auslastung erzeugen.",
    nextLinks: [{ href: "/smarte-gadgets-fuer-hunde-und-katzen/", label: "Technik nach Problem auswählen", reason: "Für Nutzen, Kosten und Ausfallgrenzen." }, { href: "/smarte-haustiertechnik/", label: "Geräteklassen überblicken", reason: "Um Beschäftigung von Versorgungstechnik zu trennen." }]
  },
  "trinkbrunnen-fuer-mehrere-katzen": {
    blocks: ["summary", "checklist", "mistakes"],
    summary: ["Mehr Volumen allein löst weder Zugangskonflikte noch Hygienebelastung.", "Mehrere Ausweichstellen sind wichtiger als ein zentraler großer Brunnen.", "Tierzahl, Haare und Speichel können Reinigungs- und Wechselintervalle verkürzen."],
    checklist: ["Mindestens eine alternative Wasserstelle einplanen", "Zugang ohne Sackgasse prüfen", "Verbrauch und Verschmutzung beobachten", "Pumpe und Filter für höhere Belastung kontrollieren"],
    mistakes: ["Einen Brunnen als einzige Ressource einsetzen", "Literzahl mit konfliktfreiem Zugang gleichsetzen", "Einzeltier-Intervalle unverändert übernehmen"],
    expertNote: "Beobachte, ob eine Katze den Zugang blockiert oder nur bevorzugte Laufwege besetzt. Eine zweite kleine Wasserstelle kann mehr bewirken als ein größerer Tank.",
    nextLinks: [{ href: "/wie-viele-wasserstellen-katze/", label: "Wasserstellen verteilen", reason: "Für konfliktarme Zugänge im Haushalt." }, { href: "/vergleiche/beste-trinkbrunnen-fuer-katzen/", label: "Brunnen nach Pflegeaufwand vergleichen", reason: "Für mehrere Tiere und häufigere Reinigung." }]
  },
  "trinkbrunnen-seniorenkatzen": {
    blocks: ["summary", "checklist", "mistakes"],
    summary: ["Niedrige Einstiegshöhe, rutschfester Stand und leiser Betrieb sind für Senioren oft wichtiger als App-Funktionen.", "Schmerzen, Seh- oder Hörveränderungen können die Akzeptanz beeinflussen.", "Eine neue Wasserquelle darf bei älteren Katzen nicht abrupt die vertraute Schale ersetzen."],
    checklist: ["Trinkhöhe und Körperhaltung beobachten", "Rutschfesten freien Zugang schaffen", "Geräusch niedrig halten", "Vertraute Schale parallel anbieten"],
    mistakes: ["Hohe Ränder übersehen", "Standort in enge oder glatte Ecke legen", "Weniger Trinken als Alterserscheinung abtun"],
    expertNote: "Achte auf die Körperhaltung: Muss die Katze tief beugen, breit stehen oder sichtbar ausweichen, passt nicht nur der Standort, sondern möglicherweise die Bauhöhe nicht.",
    nextLinks: [{ href: "/wasserstelle-katze-richtiger-standort/", label: "Barrierearmen Standort wählen", reason: "Für kurze Wege und sicheren Stand." }, { href: "/nierenkranke-katze-trinken/", label: "Medizinische Trinkfragen trennen", reason: "Wenn Erkrankung oder auffällige Mengen eine Rolle spielen." }]
  },
  "nierenkranke-katze-trinken": {
    blocks: ["summary", "checklist"],
    summary: ["Bei Nierenerkrankungen ist die Trinkstrategie Teil des tierärztlichen Behandlungsplans.", "Mehr sichtbares Trinken bedeutet nicht automatisch ausreichende Flüssigkeitsversorgung.", "Futter, Medikamente, Übelkeit, Urinmenge und Laborwerte müssen zusammen betrachtet werden."],
    checklist: ["Behandlungsplan und Futtervorgaben beachten", "Trink- und Futteraufnahme dokumentieren", "Gewicht und Verhalten beobachten", "Verschlechterung zeitnah melden"],
    mistakes: ["Wasser begrenzen", "Zusätze ohne tierärztliche Rücksprache geben", "Brunnen als Behandlung verstehen"],
    expertNote: "Technik kann Zugang und Beobachtung verbessern, aber keine Dehydratation beurteilen. Bei Erbrechen, Futterverweigerung, Schwäche oder deutlicher Veränderung zählt die medizinische Abklärung.",
    nextLinks: [{ href: "/trinkmenge-katze-messen/", label: "Aufnahme dokumentieren", reason: "Als Ergänzung für die tierärztliche Verlaufskontrolle." }, { href: "/wie-viel-wasser-braucht-eine-katze/", label: "Gesamtwasser verstehen", reason: "Damit Wasser aus Nassfutter nicht übersehen wird." }]
  },
  "biofilm-im-katzentrinkbrunnen": {
    blocks: ["summary", "checklist", "mistakes"],
    summary: [
      "Biofilm ist eine haftende Mikroorganismen-Schicht und nicht immer sichtbar oder durch bloßes Ausspülen entfernt.",
      "Pumpe, Rotorraum, Dichtungen und enge Kanäle sind kritischer als die gut sichtbare Schale.",
      "Materialverträglichkeit und Herstellerangaben entscheiden über Reiniger, Temperatur und Einwirkzeit."
    ],
    checklist: ["Strom trennen", "Pumpe nach Anleitung zerlegen", "Schleimige Beläge mechanisch lösen", "Alle Teile vollständig spülen und trocknen"],
    mistakes: ["Nur das Becken auswischen", "Elektrische Basis eintauchen", "Reiniger mischen oder Rückstände im Wasserkreislauf lassen"],
    expertNote: "Geruch und klares Wasser sind keine verlässlichen Hygienenachweise. Entscheidend ist, ob auch die wasserführenden Hohlräume zugänglich und frei von Belag sind.",
    nextLinks: [
      { href: "/pumpe-katzentrinkbrunnen-reinigen/", label: "Pumpe gründlich reinigen", reason: "Der Rotorraum ist die häufigste übersehene Stelle." },
      { href: "/katzentrinkbrunnen-richtig-reinigen/", label: "Kompletten Reinigungsplan öffnen", reason: "Für Intervalle, Zerlegung und Wiederinbetriebnahme." }
    ]
  },
  "filter-im-katzentrinkbrunnen-wechseln": {
    blocks: ["summary", "checklist", "mistakes"],
    summary: [
      "Ein Filterwechsel ersetzt die Reinigung von Becken, Pumpe und Leitungswegen nicht.",
      "Das Kalenderintervall ist nur ein Ausgangspunkt; Tierzahl, Futterreste, Haare und Wasserhärte können es deutlich verkürzen.",
      "Weniger Durchfluss kann auch von einer verschmutzten Pumpe statt von einem gesättigten Filter kommen."
    ],
    checklist: ["Herstellerintervall notieren", "Filter auf Verfärbung und Geruch prüfen", "Durchfluss vor und nach dem Wechsel vergleichen", "Neuen Filter nach Anleitung vorbereiten"],
    mistakes: ["Universalintervalle als Garantie verstehen", "Filter auswaschen und unbegrenzt weiterverwenden", "Schwachen Durchfluss automatisch dem Filter zuschreiben"],
    expertNote: "Bewerte Filter und Pumpe getrennt. So vermeidest du unnötige Filterwechsel und erkennst eine blockierte Pumpe früher.",
    nextLinks: [
      { href: "/pumpe-katzentrinkbrunnen-reinigen/", label: "Pumpenproblem ausschließen", reason: "Wenn der Durchfluss trotz neuem Filter schwach bleibt." },
      { href: "/katzentrinkbrunnen-ohne-filter/", label: "Systeme ohne Wechselkartusche einordnen", reason: "Wenn Verbrauchsmaterial der Hauptnachteil ist." }
    ]
  },
  "kalk-katzentrinkbrunnen-entfernen": {
    blocks: ["summary", "checklist", "mistakes"],
    summary: [
      "Kalk und Biofilm sind verschiedene Probleme: Kalk ist mineralisch, Biofilm organisch und schleimig.",
      "Säurehaltige Entkalker dürfen nur auf materialverträglichen, nicht elektrischen Teilen eingesetzt werden.",
      "Nach dem Entkalken müssen gelöste Rückstände und Reinigungsmittel vollständig aus dem Wasserkreislauf entfernt sein."
    ],
    checklist: ["Material und Anleitung prüfen", "Elektrik und Pumpe trennen", "Belag gezielt statt pauschal behandeln", "Mehrfach mit klarem Wasser spülen"],
    mistakes: ["Essig oder Zitronensäure ungeprüft auf Dichtungen einsetzen", "Kalkentfernung mit Desinfektion verwechseln", "Reiniger im zusammengebauten Gerät zirkulieren lassen"],
    expertNote: "Je härter das Wasser, desto wichtiger sind kurze Sichtkontrollen. Häufige leichte Ablagerungen lassen sich materialschonender entfernen als eine dicke Kalkschicht.",
    nextLinks: [
      { href: "/biofilm-im-katzentrinkbrunnen/", label: "Biofilm sicher unterscheiden", reason: "Wenn der Belag schmierig statt kreidig wirkt." },
      { href: "/katzentrinkbrunnen-richtig-reinigen/", label: "Reinigung und Entkalkung koordinieren", reason: "Für einen vollständigen Pflegeablauf." }
    ]
  },
  "katze-an-trinkbrunnen-gewoehnen": {
    blocks: ["summary", "checklist", "mistakes"],
    summary: [
      "Der alte Wassernapf bleibt zunächst stehen; er wird erst entfernt, wenn die Katze den Brunnen zuverlässig nutzt.",
      "Standort, Geräusch und Wasserbewegung sollten einzeln verändert werden, damit Ablehnung zuordenbar bleibt.",
      "Nicht trinken, Erbrechen, Mattigkeit oder auffällige Urinveränderungen sind kein Gewöhnungsproblem und gehören abgeklärt."
    ],
    checklist: ["Brunnen zunächst ausgeschaltet anbieten", "Abstand zu Futter und Toilette prüfen", "Pumpe auf niedriger Stufe starten", "Trinkverhalten über mehrere Tage beobachten"],
    mistakes: ["Wasserquelle abrupt ersetzen", "Katze zum Brunnen tragen oder festhalten", "Duftstoffe oder ungeeignete Zusätze ins Wasser geben"],
    expertNote: "Eine langsame Annäherung liefert zugleich eine Diagnose: Meidet die Katze nur das Pumpengeräusch, lässt sich das anders lösen als eine ungünstige Position.",
    nextLinks: [
      { href: "/wasserstelle-katze-richtiger-standort/", label: "Standort systematisch prüfen", reason: "Wenn der Brunnen grundsätzlich ignoriert wird." },
      { href: "/katzentrinkbrunnen-laut-pumpe/", label: "Geräuschursache finden", reason: "Wenn die Katze nur bei ausgeschalteter Pumpe trinkt." }
    ]
  },
  "katzentrinkbrunnen-laut-pumpe": {
    blocks: ["summary", "checklist", "mistakes"],
    summary: [
      "Brummen entsteht häufig durch Resonanz, zu niedrigen Wasserstand, Luft im System oder einen verschmutzten Rotor.",
      "Ein plötzlich lauter Brunnen ist eher ein Wartungssignal als eine unveränderliche Produkteigenschaft.",
      "Trockenlauf kann die Pumpe beschädigen und darf nicht als Geräuschtest provoziert werden."
    ],
    checklist: ["Wasserstand prüfen", "Gehäuse auf ebenen Stand und Kontaktflächen prüfen", "Pumpe entlüften", "Rotorraum nach Anleitung reinigen"],
    mistakes: ["Pumpe trocken laufen lassen", "Vibration nur mit weichen Unterlagen kaschieren", "Elektrische Teile untertauchen"],
    expertNote: "Trenne Wassergeräusch und Motorgeräusch: Plätschern verändert sich mit Füllstand und Auslauf, Brummen eher mit Pumpe, Resonanz und Rotor.",
    nextLinks: [
      { href: "/pumpe-katzentrinkbrunnen-reinigen/", label: "Rotorraum reinigen", reason: "Bei neuem Rattern oder sinkendem Durchfluss." },
      { href: "/vergleiche/beste-trinkbrunnen-fuer-katzen/", label: "Leisere Bauarten vergleichen", reason: "Wenn Wartung und Aufstellung das Problem nicht lösen." }
    ]
  },
  "katzenwasser-taeglich-wechseln": {
    blocks: ["summary", "checklist", "mistakes"],
    summary: [
      "Ein Filter macht stehendes Wasser nicht unbegrenzt frisch und ersetzt keinen regelmäßigen Wasserwechsel.",
      "Haare, Futterreste, Speichel, Wärme und mehrere Tiere verkürzen sinnvolle Kontrollintervalle.",
      "Nachfüllen verdünnt Verunreinigungen, entfernt sie aber nicht."
    ],
    checklist: ["Wasser täglich ansehen und riechen", "Füllstand und Durchfluss prüfen", "Bei Verunreinigung sofort komplett wechseln", "Behälter bei jedem Wechsel auf Belag kontrollieren"],
    mistakes: ["Nur verdunstetes Wasser nachfüllen", "Klares Wasser automatisch für hygienisch halten", "Filter als Ersatz für Schalen- und Pumpenreinigung behandeln"],
    expertNote: "Ein fester täglicher Kontrollzeitpunkt ist verlässlicher als starre Wechselversprechen. Er verbindet Wasserqualität, Füllstand und Pumpenfunktion in einer kurzen Routine.",
    nextLinks: [
      { href: "/biofilm-im-katzentrinkbrunnen/", label: "Unsichtbare Beläge erkennen", reason: "Wenn Oberflächen glitschig oder muffig werden." },
      { href: "/wie-viele-wasserstellen-katze/", label: "Wasserstellen sinnvoll verteilen", reason: "Damit der Brunnen nicht die einzige Ausweichmöglichkeit ist." }
    ]
  },
  "pumpe-katzentrinkbrunnen-reinigen": {
    blocks: ["summary", "checklist", "mistakes"],
    summary: [
      "Die äußere Pumpenhülle zu spülen reicht meist nicht; Rotor und Rotorraum sammeln Haare und Biofilm.",
      "Wie weit die Pumpe zerlegt werden darf, bestimmt ausschließlich die Modellanleitung.",
      "Vor dem Wiedereinsetzen müssen alle Teile gespült, korrekt montiert und vollständig frei beweglich sein."
    ],
    checklist: ["Netzstecker ziehen", "Ausbaufolge fotografieren", "Nur freigegebene Teile öffnen", "Rotor und Hohlraum mit kleiner Bürste reinigen", "Pumpe unter Wasser entlüften"],
    mistakes: ["Kabel oder vergossene Elektrik öffnen", "Rotor mit Gewalt heraushebeln", "Pumpe trocken testen"],
    expertNote: "Dokumentiere die Einbaulage vor dem Zerlegen. Das senkt Montagefehler und macht sichtbar, ob Dichtung, Abdeckung oder Rotor nachher fehlen.",
    nextLinks: [
      { href: "/biofilm-im-katzentrinkbrunnen/", label: "Belag richtig einordnen", reason: "Für schleimige Rückstände im Rotorraum." },
      { href: "/filter-im-katzentrinkbrunnen-wechseln/", label: "Filter separat prüfen", reason: "Wenn der Durchfluss weiterhin schwach ist." }
    ]
  },
  "trinkbrunnen-fuer-kitten-sicher": {
    blocks: ["summary", "checklist", "mistakes"],
    summary: [
      "Für Kitten zählen kippsicherer Stand, geschützte Kabel, geringe offene Wassertiefe und leicht erreichbare Trinkhöhe.",
      "Ein Brunnen darf nie die einzige Wasserquelle während der Eingewöhnung sein.",
      "Kleine abnehmbare Teile und zugängliche Kabel sind relevantere Risiken als App-Funktionen."
    ],
    checklist: ["Kippsicherheit testen", "Kabel und Netzteil unzugänglich führen", "Wassertiefe und Kanten prüfen", "Alternative Schale bereitstellen"],
    mistakes: ["Kitten unbeaufsichtigt an lose Kabel lassen", "Tiefe Behälter nur nach Literzahl auswählen", "Gewöhnung durch Entfernen aller Alternativen erzwingen"],
    expertNote: "Teste den aufgebauten Brunnen aus Kitten-Perspektive: Was lässt sich ziehen, kippen, benagen oder als Tritt nutzen?",
    nextLinks: [
      { href: "/katze-an-trinkbrunnen-gewoehnen/", label: "Schonend eingewöhnen", reason: "Für die ersten Tage mit dem neuen Brunnen." },
      { href: "/vergleiche/beste-trinkbrunnen-fuer-katzen/", label: "Bauarten vergleichen", reason: "Für Material, Reinigung und Standfestigkeit." }
    ]
  },
  "wasserstelle-katze-richtiger-standort": {
    blocks: ["summary", "checklist", "mistakes"],
    summary: [
      "Eine Wasserstelle sollte ruhig, frei zugänglich und räumlich von Toilette sowie möglichst vom Futter getrennt sein.",
      "Mehrere verteilte Wasserstellen sind aussagekräftiger als ein ständig umgestellter einzelner Napf.",
      "Sonne, Wärme und Laufwege beeinflussen Wasserqualität und Akzeptanz."
    ],
    checklist: ["Ruhigen Laufweg wählen", "Abstand zu Toilette und Futter schaffen", "Sonnen- und Wärmequellen vermeiden", "Nutzung je Standort mehrere Tage beobachten"],
    mistakes: ["Standort täglich wechseln", "Wasser in Sackgassen oder neben laute Geräte stellen", "Nur einen Trinkplatz anbieten"],
    expertNote: "Ändere immer nur eine Variable. Nur so erkennst du, ob Standort, Gefäß, Material oder Wasserbewegung die Nutzung beeinflusst.",
    nextLinks: [
      { href: "/wie-viele-wasserstellen-katze/", label: "Anzahl der Wasserstellen planen", reason: "Für Mehrkatzenhaushalte und größere Wohnungen." },
      { href: "/katze-an-trinkbrunnen-gewoehnen/", label: "Brunnen am neuen Standort einführen", reason: "Wenn ein Gerät statt einer Schale genutzt werden soll." }
    ]
  },
  "wie-laut-sind-automatische-futterautomaten": {
    blocks: ["summary", "checklist", "mistakes"],
    summary: [
      "Entscheidend sind nicht nur Dezibel, sondern Impulsgeräusch, Tonhöhe, Untergrund und Reaktion des Tieres.",
      "Motorlauf und fallende Kroketten erzeugen unterschiedliche Geräusche und sollten getrennt beurteilt werden.",
      "Ein Test mit dem eigenen Futter ist belastbarer als eine pauschale Lautstärkeangabe."
    ],
    checklist: ["Gerät auf festem Untergrund testen", "Eigene Krokettengröße verwenden", "Ausgabe aus Schlafdistanz anhören", "Reaktion des Tieres beobachten"],
    mistakes: ["Smartphone-Messwerte als Labormessung behandeln", "Nur den Motor ohne Futter beurteilen", "Gerät direkt neben Schlafplatz aufstellen"],
    expertNote: "Ein kurzer harter Impuls kann störender sein als ein längeres leises Brummen. Deshalb ist die Geräuschcharakteristik wichtiger als ein einzelner Spitzenwert.",
    nextLinks: [
      { href: "/wie-funktioniert-ein-futterautomat/", label: "Mechanik verstehen", reason: "Um Motor- und Futtergeräusch einzuordnen." },
      { href: "/vergleiche/beste-futterautomaten-ohne-wlan/", label: "Einfache Modelle vergleichen", reason: "Wenn App-Funktionen keine Rolle spielen." }
    ]
  },
  "smarte-gadgets-fuer-hunde-und-katzen": {
    blocks: ["summary", "fit", "checklist", "mistakes"],
    summary: [
      "Technik ist sinnvoll, wenn sie ein konkretes Problem messbar löst: Ortung, Portionierung, Zugangskontrolle oder Trinkroutine.",
      "Automatisierung darf Beobachtung, Bewegung, Betreuung und medizinische Abklärung nicht ersetzen.",
      "Folgekosten, Cloud-Abhängigkeit und Ausfallverhalten gehören vor dem Kauf zur Funktionsprüfung."
    ],
    checklist: ["Problem in einem Satz benennen", "Nutzen ohne App und Cloud prüfen", "Folgekosten für zwei Jahre rechnen", "Notbetrieb und Datenzugriff klären"],
    mistakes: ["Funktionsmenge mit Nutzen verwechseln", "Abo und Verbrauchsteile ausblenden", "Automatisierung als Betreuung einsetzen"],
    expertNote: "Wenn du vor dem Kauf kein beobachtbares Erfolgskriterium formulieren kannst, ist das Gerät wahrscheinlich eine Spielerei statt einer Lösung.",
    nextLinks: [
      { href: "/smarte-haustiertechnik/", label: "Geräteklassen einordnen", reason: "Für Nutzen, Grenzen und Datenschutz." },
      { href: "/so-bewerten-wir/", label: "Bewertungsmaßstab prüfen", reason: "So trennt PfotenTechnik Funktionen von Eignung." }
    ]
  }
};
