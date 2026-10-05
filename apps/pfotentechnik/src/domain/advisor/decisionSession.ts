import type { AdvisorRequirement, AdvisorSession, DecisionAnswers } from './types';

export const preferenceLabels: Record<string, string> = {
  battery: 'Lange Akkulaufzeit', light: 'Möglichst leicht', live: 'Live-Ortung',
  fence: 'Virtueller Zaun', activity: 'Aktivitätsdaten', cleaning: 'Spülmaschinengeeignete Teile',
  costs: 'Niedrige Filterkosten', cordless: 'Akku / ohne dauerhaftes Kabel', capacity: 'Große Wassermenge'
};
export const createAdvisorSession = (answers: DecisionAnswers): AdvisorSession => {
  const requirements: AdvisorRequirement[] = [], preferences: AdvisorRequirement[] = [];
  const add = (field: string, desired: AdvisorRequirement['desired'], operator: AdvisorRequirement['operator'], label: string, step: number, importance: AdvisorRequirement['importance'] = 'hard') =>
    (importance === 'hard' ? requirements : preferences).push({ field, desired, operator, label, step, importance });
  if (answers.pet !== 'multiple') add('animal', answers.pet, 'includes', answers.pet === 'cat' ? 'Für Katzen dokumentiert' : 'Für Hunde dokumentiert', 0);
  else add('multiPet', true, 'equals', 'Gemeinsame Nutzung mehrerer Tiere', 0, 'preference');
  if (answers.category === 'gps') {
    add('minimumWeight', answers.weight!, 'minimum', `Hersteller-Mindestgewicht für ${answers.weight} kg erfüllt`, 1);
    if (answers.subscription === 'no') add('subscription', false, 'equals', 'Ohne laufendes Abo', 2);
    const fields: Record<string, string> = { battery: 'batteryDays', light: 'deviceWeight', live: 'live', fence: 'fence', activity: 'activity' };
    for (const key of answers.priorities) if (fields[key]) add(fields[key], true, key === 'battery' ? 'higher' : key === 'light' ? 'lower' : 'equals', preferenceLabels[key], 3, 'preference');
  } else {
    if (answers.material === 'steel') add('steel', true, 'equals', 'Edelstahl als dokumentierter Materialbestandteil', 1, 'preference');
    if (answers.cordless === 'yes') add('cordless', true, 'equals', 'Betrieb ohne Steckdose', 3);
    const fields: Record<string, string> = { cleaning: 'dishwasher', costs: 'filterCost', cordless: 'cordless', capacity: 'capacity' };
    for (const key of answers.priorities) if (fields[key]) add(fields[key], true, key === 'costs' ? 'lower' : key === 'capacity' ? 'higher' : 'equals', preferenceLabels[key], 2, 'preference');
  }
  return { intent: answers.category === 'gps' ? 'Tier draußen orten' : 'Wasserversorgung verbessern', category: answers.category, answers, requirements, preferences };
};
export const advisorComparisonLink = (answers: DecisionAnswers) => answers.category === 'gps'
  ? answers.subscription === 'no' ? '/vergleiche/gps-tracker-ohne-abo/' : `/vergleiche/beste-gps-tracker-fuer-${answers.pet === 'dog' ? 'hunde' : 'katzen'}/`
  : `/vergleiche/beste-trinkbrunnen-fuer-${answers.pet === 'dog' ? 'hunde' : 'katzen'}/`;
export const decisionSummary = (a: DecisionAnswers) => {
  const pet = a.pet === 'multiple' ? 'mehrere Tiere' : a.pet === 'cat' ? 'eine Katze' : 'einen Hund';
  const details = a.category === 'gps'
    ? `${pet} (${a.weight} kg); ${a.subscription === 'no' ? 'ohne Abo' : a.subscription === 'yes' ? 'Abo okay' : 'Abo egal'}`
    : `${pet}; ${a.material === 'steel' ? 'Edelstahl bevorzugt' : a.material === 'plastic' ? 'Kunststoff okay' : 'Material egal'}; ${a.cordless === 'yes' ? 'Betrieb ohne Steckdose erforderlich' : 'Steckdose kein Ausschlusskriterium'}`;
  return `Du suchst ${a.category === 'gps' ? 'einen Tracker für' : 'einen Trinkbrunnen für'} ${details}.${a.priorities.length ? ` Besonders wichtig: ${a.priorities.map(p => preferenceLabels[p]).join(', ')}.` : ''}`;
};
