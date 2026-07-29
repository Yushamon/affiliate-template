import assert from "node:assert/strict";
import test from "node:test";
import { createInternalLinkedHtml } from "./htmlLinker.ts";
import {
  createInternalLinkHtml,
  createLinkBudgetState,
  findInternalLinkMatches,
  selectInternalLinkMatches
} from "./linkEngine.ts";
import type { InternalLinkDefinition } from "./types.ts";

const blocked = [
  "Hund", "Hunde", "Katze", "Katzen", "Tier", "Tiere", "App", "Kamera",
  "Wasser", "Futter", "Nassfutter", "Trockenfutter", "Akku", "Filter",
  "Reinigung", "Vergleich", "Test", "Ratgeber", "Kaufberatung", "Produkt", "Hersteller"
];

const definitions: InternalLinkDefinition[] = [
  {
    id: "hub:feeder",
    href: "/smarte-futterautomaten/",
    anchorAliases: ["Futterautomat", "Futterautomaten"],
    exclusiveAnchors: ["Futterautomat", "Futterautomaten"],
    contextTerms: ["Fütterung", "Portionierung", "Futterautomaten"],
    group: "hub",
    priority: "high"
  },
  {
    id: "guide:dog-feeder",
    href: "/futterautomat-hund/",
    anchorAliases: ["Futterautomat für Hunde"],
    contextTerms: ["Hund", "Fütterung"],
    intentTerms: ["Kaufberatung", "passendes Modell"],
    group: "knowledge",
    priority: "normal"
  },
  {
    id: "comparison:dog-feeder",
    href: "/vergleiche/beste-futterautomaten-fuer-hunde/",
    anchorAliases: ["beste Futterautomaten für Hunde"],
    contextTerms: ["Hund", "Futterautomaten"],
    intentTerms: ["Vergleich", "beste Modelle", "Testsieger"],
    group: "comparison",
    priority: "high"
  },
  {
    id: "guide:dog-fountain",
    href: "/trinkbrunnen-hund/",
    anchorAliases: ["Hundetrinkbrunnen", "Trinkbrunnen für Hunde"],
    contextTerms: ["Hund", "Trinkbrunnen"],
    group: "knowledge"
  },
  {
    id: "guide:cat-fountain",
    href: "/trinkbrunnen-fuer-katzen-sinnvoll/",
    anchorAliases: ["Katzenbrunnen", "Trinkbrunnen für Katzen"],
    contextTerms: ["Katze", "Trinkbrunnen"],
    group: "knowledge"
  },
  {
    id: "product:petlibro",
    href: "/produkt/petlibro-granary-2-vision/",
    anchorAliases: ["PETLIBRO Granary 2 Vision"],
    contextTerms: ["Futterautomat", "Kamera"],
    intentTerms: ["Modell", "Produkt", "Testbericht"],
    group: "product",
    priority: "high"
  },
  {
    id: "manufacturer:petlibro",
    href: "/hersteller/petlibro/",
    anchorAliases: ["PETLIBRO"],
    contextTerms: ["Hersteller", "Futterautomaten"],
    intentTerms: ["Hersteller", "Marke"],
    group: "manufacturer",
    priority: "normal"
  },
  {
    id: "guide:cleaning",
    href: "/futterautomat-richtig-reinigen/",
    anchorAliases: ["Futterautomat richtig reinigen"],
    contextTerms: ["Futterautomat", "Hygiene", "Reinigung"],
    intentTerms: ["wie", "reinigen", "Anleitung", "Problem"],
    group: "knowledge",
    priority: "normal"
  }
];

const options = {
  sourceGroup: "knowledge" as const,
  sourcePath: "/quelle/",
  sourceContexts: ["Futterautomaten", "Hund"],
  blockedAnchors: blocked,
  maxLinksPerPage: 7
};

test("Hundetrinkbrunnen erzeugt keinen Katzenbrunnen-Anker", () => {
  const html = createInternalLinkHtml("Ein Hundetrinkbrunnen kann sinnvoll sein.", definitions, options);
  assert.match(html, /href="\/trinkbrunnen-hund\/">Hundetrinkbrunnen/);
  assert.doesNotMatch(html, /katzen/i);
});

test("Futterautomat für Hunde erzeugt nicht den nackten Anker Hund", () => {
  const html = createInternalLinkHtml("Ein Futterautomat für Hunde entlastet im Alltag.", definitions, options);
  assert.match(html, />Futterautomat für Hunde<\/a>/);
  assert.doesNotMatch(html, />Hund<\/a>/);
});

test("nacktes Futterautomat gehört exklusiv dem Cornerstone", () => {
  const html = createInternalLinkHtml("Ein Futterautomat portioniert Mahlzeiten.", definitions, options);
  assert.match(html, /href="\/smarte-futterautomaten\/">Futterautomat<\/a>/);
});

test("spezifische Hund-Phrase schlägt den Cornerstone", () => {
  const html = createInternalLinkHtml("Ein Futterautomat für Hunde muss zur Portionsgröße passen.", definitions, options);
  assert.match(html, /href="\/futterautomat-hund\/">Futterautomat für Hunde<\/a>/);
  assert.doesNotMatch(html, /href="\/smarte-futterautomaten\/">Futterautomat<\/a>/);
});

test("Vergleichsintent bevorzugt die vollständige Vergleichsphrase", () => {
  const html = createInternalLinkHtml(
    "Für die Kaufentscheidung solltest du die besten Modelle vergleichen: beste Futterautomaten für Hunde.",
    definitions,
    options
  );
  assert.match(html, /href="\/vergleiche\/beste-futterautomaten-fuer-hunde\/">beste Futterautomaten für Hunde<\/a>/);
});

test("exakter Produktname führt zur Produktseite", () => {
  const html = createInternalLinkHtml("Das Modell PETLIBRO Granary 2 Vision ist ein Futterautomat.", definitions, options);
  assert.match(html, /href="\/produkt\/petlibro-granary-2-vision\/">PETLIBRO Granary 2 Vision<\/a>/);
});

test("Herstellername verdrängt keinen längeren Produktnamen", () => {
  const html = createInternalLinkHtml("PETLIBRO Granary 2 Vision stammt von PETLIBRO.", definitions, options);
  assert.match(html, /href="\/produkt\/petlibro-granary-2-vision\/">PETLIBRO Granary 2 Vision<\/a>/);
  assert.doesNotMatch(html, /href="\/hersteller\/petlibro\/">PETLIBRO<\/a> Granary/);
});

test("blockierte Einzelbegriffe werden nicht verlinkt", () => {
  const generic: InternalLinkDefinition = {
    id: "bad",
    href: "/bad/",
    anchorAliases: ["Hund", "Kamera", "Nassfutter"],
    group: "knowledge"
  };
  const html = createInternalLinkHtml("Hund, Kamera und Nassfutter.", [generic], options);
  assert.equal(html, "Hund, Kamera und Nassfutter.");
});

test("längste spezifische Phrase gewinnt bei Überschneidung", () => {
  const html = createInternalLinkHtml("Futterautomat für Hunde", definitions, options);
  assert.equal((html.match(/<a /g) ?? []).length, 1);
  assert.match(html, /futterautomat-hund/);
});

test("lokaler How-to-Intent beeinflusst die Zielwahl", () => {
  const competing: InternalLinkDefinition = {
    id: "comparison:cleaning",
    href: "/vergleiche/reinigungsfreundliche-futterautomaten/",
    anchorAliases: ["Futterautomat richtig reinigen"],
    intentTerms: ["Vergleich", "beste Modelle"],
    contextTerms: ["Futterautomat", "Reinigung"],
    group: "comparison",
    priority: "high"
  };
  const html = createInternalLinkHtml(
    "Wie kannst du einen Futterautomat richtig reinigen? Diese Anleitung zeigt jeden Schritt.",
    [...definitions, competing],
    options
  );
  assert.match(html, /href="\/futterautomat-richtig-reinigen\//);
});

test("globale Auswahl bevorzugt eine bessere spätere Absatzstelle", () => {
  const html = createInternalLinkedHtml(
    '<div class="quick-fact"><span>Futterautomat</span></div><p>Im ausführlichen Absatz hilft ein Futterautomat bei einer verlässlichen Portionierung.</p>',
    definitions,
    options
  );
  assert.doesNotMatch(html, /quick-fact"><span><a/);
  assert.match(html, /<p>Im ausführlichen Absatz hilft ein <a href="\/smarte-futterautomaten\//);
});

test("ein Ziel wird im gemeinsamen Seitenbudget nur einmal verlinkt", () => {
  const budget = createLinkBudgetState(7);
  const first = createInternalLinkHtml("Ein Futterautomat hilft.", definitions, { ...options, linkBudget: budget });
  const second = createInternalLinkHtml("Noch ein Futterautomat hilft.", definitions, { ...options, linkBudget: budget });
  assert.match(first, /<a /);
  assert.doesNotMatch(second, /<a /);
});

test("gemeinsames Seitenbudget wird über mehrere Durchläufe eingehalten", () => {
  const budget = createLinkBudgetState(2);
  const first = createInternalLinkHtml(
    "Futterautomat und Hundetrinkbrunnen.",
    definitions,
    { ...options, linkBudget: budget, maxLinksPerPage: 2 }
  );
  const second = createInternalLinkHtml(
    "PETLIBRO Granary 2 Vision und PETLIBRO.",
    definitions,
    { ...options, linkBudget: budget, maxLinksPerPage: 2 }
  );
  assert.equal((first.match(/<a /g) ?? []).length + (second.match(/<a /g) ?? []).length, 2);
  assert.equal(budget.used, 2);
});

test("Überschriften, Buttons und bestehende Links bleiben unverändert", () => {
  const input = '<h2>Futterautomat</h2><button>Futterautomat</button><a href="/x/">Futterautomat</a><p>Futterautomat</p>';
  const html = createInternalLinkedHtml(input, definitions, options);
  assert.match(html, /^<h2>Futterautomat<\/h2><button>Futterautomat<\/button><a href="\/x\/">Futterautomat<\/a>/);
  assert.equal((html.match(/href="\/smarte-futterautomaten\//g) ?? []).length, 1);
});

test("stabile ID ist nur der letzte Tie-Breaker", () => {
  const sameA: InternalLinkDefinition = { id: "b", href: "/b/", anchorAliases: ["Eindeutige Phrase"], group: "knowledge" };
  const sameB: InternalLinkDefinition = { id: "a", href: "/a/", anchorAliases: ["Eindeutige Phrase"], group: "knowledge" };
  const selected = selectInternalLinkMatches(
    findInternalLinkMatches("Eindeutige Phrase", [sameA, sameB], options),
    options
  );
  assert.equal(selected[0]?.definition.id, "a");
});

test("maxOccurrences funktioniert seitenweit über mehrere Durchläufe", () => {
  const definition = {
    ...definitions[0],
    maxOccurrences: 2
  };
  const budget = createLinkBudgetState(3);
  const first = createInternalLinkedHtml("Ein Futterautomat hilft.", [definition], {
    sourceGroup: "knowledge", sourcePath: "/quelle/", linkBudget: budget
  });
  const second = createInternalLinkedHtml("Auch dieser Futterautomat hilft.", [definition], {
    sourceGroup: "knowledge", sourcePath: "/quelle/", linkBudget: budget
  });
  const third = createInternalLinkedHtml("Der dritte Futterautomat bleibt Text.", [definition], {
    sourceGroup: "knowledge", sourcePath: "/quelle/", linkBudget: budget
  });
  assert.match(first, /<a /);
  assert.match(second, /<a /);
  assert.doesNotMatch(third, /<a /);
});
