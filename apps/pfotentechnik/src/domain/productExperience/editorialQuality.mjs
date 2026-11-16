import { productDecisionFactSchema } from '../../content/schema/decision-facts.mjs';
import { decisionFactFingerprint, isDecisionFactApproved } from './decisionFactReview.mjs';

const normalize = value => String(value ?? '').toLocaleLowerCase('de-DE')
  .replaceAll('ä', 'ae').replaceAll('ö', 'oe').replaceAll('ü', 'ue').replaceAll('ß', 'ss')
  .replace(/[^a-z0-9]+/g, ' ').trim();
const unknown = value => /\b(?:unknown|unbekannt|unklar|keine angaben|nicht (?:(?:vom hersteller |eindeutig |belastbar )?(?:dokumentiert|ausgewiesen|angegeben|belegt|bekannt|bestaetigt)))\b/.test(normalize(value));
const feature = label => {
  const key = normalize(label);
  if (/^(?:akku|akkutechnik und austausch)$/.test(key)) return 'battery';
  if (/^(?:app|app steuerung)$/.test(key)) return 'app';
  if (/^(?:wlan|wifi|wi fi)$/.test(key)) return 'wifi';
  if (/^kamera$/.test(key)) return 'camera';
  return null;
};

// Conservative presence statements only. Documentation gaps are not absence.
const presence = (value, kind) => {
  const normalized = normalize(value);
  const noun = { battery: 'akku', app: 'app', wifi: '(?:wlan|wifi|wi fi)', camera: 'kamera' }[kind];
  if (!noun) return null;
  if (/\b(?:keine angaben|unbekannt|unklar|nicht dokumentiert) ob\b/.test(normalized)) return null;
  if (/^(?:nein|nicht vorhanden)(?: |$)/.test(normalized) || new RegExp(`\\b(?:kein(?:e[nrs]?)?|ohne) (?:integrierte[nr]? )?${noun}\\b|\\b${noun} (?:ist )?nicht (?:vorhanden|integriert)\\b`).test(normalized)) return false;
  if (/^(?:ja|vorhanden)(?: |$)/.test(normalized) || new RegExp(`\\b${noun} (?:ist )?vorhanden\\b|\\bintegrierter (?:wiederaufladbarer )?${noun}\\b`).test(normalized)) return true;
  return null;
};

const claimsPresence = (consequence, kind) => {
  const value = normalize(consequence);
  const patterns = {
    battery: /\b(?:ein (?:integrierter )?akku ermoeglicht|akku (?:ist|erlaubt)|kabelloser betrieb ist moeglich)\b/,
    app: /\b(?:fernsteuerung und statusmeldungen sind moeglich|einstellungen lassen sich aus der ferne|app ermoeglicht)\b/,
    wifi: /\b(?:fernsteuerung und statusmeldungen sind moeglich|einstellungen lassen sich aus der ferne|wlan (?:ist vorhanden|ermoeglicht))\b/,
    camera: /\b(?:du kannst (?:zusaetzlich kontrollieren|nicht nur)|kamera ermoeglicht|livebilder sind moeglich)\b/
  };
  return patterns[kind]?.test(value) ?? false;
};

const structuredFeature = (data, kind) => {
  const key = { app: 'app', camera: 'camera', wifi: 'wifi' }[kind];
  if (key && typeof data.comparisonFilters?.[key] === 'boolean') return [{ path: `comparisonFilters.${key}`, value: data.comparisonFilters[key] }];
  return [];
};

const quantities = value => [...String(value ?? '').matchAll(/(\d+(?:[.,]\d+)?)\s*(mAh|Wh|ml|Liter|kg|mm|cm|g|l)\b/gi)]
  .map(match => ({ amount: Number(match[1].replace(',', '.')), unit: match[2].toLowerCase().replace('liter', 'l') }));

const generic = consequence => [
  /^die stromversorgung (?:bestimmt|entscheidet)/,
  /^die groesse beeinflusst/,
  /^das gewicht beeinflusst je nach produkt/,
  /^die masse muessen sowohl zum verfuegbaren platz/,
  /^die tatsaechliche reichweite haengt von verbrauch portionsgroesse/,
  /^die schutzklasse ist bei regen reinigung/
].some(pattern => pattern.test(normalize(consequence)));

export const qualityCheckNames = ['completeness', 'duplicateConsequences', 'technicalConsistency', 'unknownProperties', 'decisionUsefulness'];

export function reviewProductDecisionFacts(data, { approvals = [] } = {}) {
  const facts = Array.isArray(data.decisionFacts) ? data.decisionFacts : [];
  return facts.map((fact, index) => {
    const original = { label: fact?.label ?? null, value: fact?.value ?? null, consequence: fact?.consequence ?? null };
    const issues = [];
    const add = (check, code, problem, evidence = []) => issues.push({ check, code, problem, evidence });
    const validation = productDecisionFactSchema.safeParse(fact);
    if (!validation.success) {
      for (const issue of validation.error.issues) add('completeness', 'INCOMPLETE_FACT', `${issue.path.join('.') || 'Hinweis'}: ${issue.message}`);
    }

    const duplicateIndices = normalize(fact?.consequence) ? facts.flatMap((other, otherIndex) =>
      otherIndex !== index && normalize(other?.consequence) === normalize(fact?.consequence) ? [otherIndex + 1] : []) : [];
    if (duplicateIndices.length) add('duplicateConsequences', 'DUPLICATE_CONSEQUENCE', `Identische Konsequenz auch in Hinweis ${duplicateIndices.join(', ')} dieses Produkts.`, duplicateIndices.map(position => ({ path: `decisionFacts.${position - 1}.consequence`, value: facts[position - 1].consequence })));

    const kind = feature(fact?.label);
    const specs = (data.specs ?? []).flatMap((spec, specIndex) =>
      normalize(spec.label) === normalize(fact?.label) ? [{ path: `specs.${specIndex}.value`, value: spec.value }] : []);
    const evidence = [...specs, ...structuredFeature(data, kind)];
    const factPresence = presence(fact?.value, kind);
    for (const item of evidence) {
      const technicalPresence = typeof item.value === 'boolean' ? item.value : presence(item.value, kind);
      if (factPresence !== null && technicalPresence !== null && factPresence !== technicalPresence) {
        add('technicalConsistency', 'FEATURE_CONTRADICTION', `Redaktioneller Wert „${fact.value}“ und technischer Wert „${item.value}“ widersprechen sich beim Vorhandensein.`, [item]);
      } else if (typeof item.value === 'string' && normalize(item.value) !== normalize(fact?.value)) {
        const a = quantities(fact?.value), b = quantities(item.value);
        if (a.length === 1 && b.length === 1 && a[0].unit === b[0].unit && a[0].amount !== b[0].amount && !unknown(item.value) && !unknown(fact?.value)) {
          add('technicalConsistency', 'NUMERIC_VALUE_DIFFERS', `Abweichende Mengenangabe mit gleicher Einheit: redaktionell „${fact.value}“, technisch „${item.value}“. Varianten, Bereiche und Messbedingungen manuell abgleichen.`, [item]);
        } else {
          add('technicalConsistency', 'VALUE_REQUIRES_COMPARISON', `Abweichender Originalwortlaut: redaktionell „${fact?.value}“, technisch „${item.value}“. Dies allein belegt keinen sachlichen Widerspruch.`, [item]);
        }
      }
    }

    const assertsPresence = claimsPresence(fact?.consequence, kind);
    if (assertsPresence && factPresence === false) add('technicalConsistency', 'CONSEQUENCE_CONTRADICTS_VALUE', `Die Konsequenz behauptet die Funktion, obwohl der eigene redaktionelle Wert „${fact.value}“ sie verneint.`, [{ path: `decisionFacts.${index}.value`, value: fact.value }]);
    if ((unknown(fact?.value) && factPresence === null || evidence.some(item => typeof item.value === 'string' && unknown(item.value) && presence(item.value, kind) === null)) && (assertsPresence || factPresence === true)) {
      add('unknownProperties', 'PRESENCE_WITH_UNKNOWN_PROPERTY', 'Trotz fehlender oder unbekannter Angabe wird das Vorhandensein der Funktion behauptet. Fehlende Dokumentation liefert keinen positiven Beleg.', evidence);
    }

    const category = normalize(data.category?.key ?? data.category?.label ?? data.category);
    const label = normalize(fact?.label), consequence = normalize(fact?.consequence);
    const wrongContext = category.includes('brunnen') && /portionsgroesse|futterdichte/.test(consequence)
      ? `Der Wasserinhalt „${fact?.value}“ wird über Futterportionen oder Futterdichte eingeordnet, obwohl die Produktkategorie Trinkbrunnen ist.`
      : label.includes('akku') && /nachfuellen|nachgefuellt/.test(consequence)
        ? `Das Akkumerkmal „${fact?.value}“ wird wie ein nachfüllbarer Vorratsbehälter eingeordnet.`
        : /krokettengroesse/.test(label) && /stellplatz|verfuegbaren platz|koerpergroesse/.test(consequence)
          ? `Die Krokettengröße „${fact?.value}“ wird mit Stellplatz oder Körpergröße begründet; das sind andere Größen als die zulässigen Futterabmessungen.` : null;
    if (wrongContext) add('technicalConsistency', 'WRONG_DECISION_CONTEXT', wrongContext, [{ path: 'category', value: data.category }, { path: `decisionFacts.${index}.label`, value: fact?.label }]);
    if (generic(fact?.consequence)) add('decisionUsefulness', 'GENERIC_CONSEQUENCE', `Pauschale Vorlage ohne konkrete Einordnung von „${fact?.label}: ${fact?.value}“; der Nutzen für die Auswahl muss redaktionell geprüft werden.`);

    const checks = Object.fromEntries(qualityCheckNames.map(check => [check, {
      result: issues.some(issue => issue.check === check) ? 'finding'
        : check === 'technicalConsistency' && !evidence.length ? 'not-verifiable' : 'no-rule-findings'
    }]));
    const approved = isDecisionFactApproved(data.slug, fact, approvals);
    return {
      slug: data.slug,
      position: index + 1,
      fingerprint: decisionFactFingerprint(fact),
      original,
      automatedResult: issues.length ? 'needs-review' : 'no-rule-findings',
      editorialReview: approved ? 'approved-exact-text' : 'unreviewed',
      publication: approved ? 'approved-candidate' : 'blocked-fallback-only',
      checks,
      issues,
      technicalEvidence: evidence,
      limitation: 'Regelbasierte Vorprüfung anhand vorhandener Produktdaten; keine vollständige semantische Prüfung und keine redaktionelle Freigabe.'
    };
  });
}
