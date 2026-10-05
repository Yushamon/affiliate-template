import type { AdvisorCategory } from './types';
export type DecisionQuestion = { name: string; title: string; help: string; multiple?: boolean; number?: boolean; options: [string, string][] };
export const decisionQuestions: Record<AdvisorCategory, DecisionQuestion[]> = {
  gps: [
    { name: 'pet', title: 'Für welches Tier?', help: 'Die dokumentierte Tierart ist eine harte Anforderung.', options: [['dog','Hund'],['cat','Katze']] },
    { name: 'weight', title: 'Wie schwer ist dein Tier?', help: 'Wir prüfen ausschließlich das vom Hersteller genannte Mindestgewicht. Fehlende Angaben bleiben offen.', number: true, options: [] },
    { name: 'subscription', title: 'Ist ein laufendes Abo für dich okay?', help: '„Lieber ohne Abo“ schließt Modelle mit dokumentierter Abo-Pflicht aus.', options: [['yes','Ja'],['no','Lieber ohne Abo'],['any','Egal']] },
    { name: 'priorities', title: 'Was ist dir besonders wichtig?', help: 'Mehrfachauswahl möglich. Präferenzen verändern die Reihenfolge, schließen aber kein Modell aus.', multiple: true, options: [['battery','Lange Akkulaufzeit'],['light','Möglichst leicht'],['live','Live-Ortung'],['fence','Virtueller Zaun'],['activity','Aktivitätsdaten']] }
  ],
  fountain: [
    { name: 'pet', title: 'Für wen?', help: 'Mehrere Tiere sind eine Präferenz für gemeinsame Nutzung. Die Wassermenge ist keine harte Grenze.', options: [['cat','Katze'],['dog','Hund'],['multiple','Mehrere Tiere']] },
    { name: 'material', title: 'Welches Material bevorzugst du?', help: 'Edelstahl ist eine Präferenz. Tank, Trinkfläche und weitere Teile können aus unterschiedlichen Materialien bestehen.', options: [['steel','Edelstahl'],['plastic','Kunststoff okay'],['any','Egal']] },
    { name: 'priorities', title: 'Was ist dir besonders wichtig?', help: 'Wir vergleichen belegte Eigenschaften. Spülmaschinengeeignete Teile sind nur ein Aspekt der Reinigung; Filterkosten sind keine vollständigen Folgekosten.', multiple: true, options: [['cleaning','Spülmaschinengeeignete Teile'],['costs','Niedrige Filterkosten'],['cordless','Akku / ohne dauerhaftes Kabel'],['capacity','Große Wassermenge']] },
    { name: 'cordless', title: 'Muss der Brunnen zeitweise ohne Steckdose funktionieren?', help: 'Bei „Ja“ muss Akku- oder kabelloser Betrieb belegt sein. Unklare oder widersprüchliche Daten bleiben als mögliche Passung sichtbar.', options: [['yes','Ja'],['no','Nein'],['any','Egal']] }
  ]
};
