import assert from "node:assert/strict";
import test from "node:test";
import { analysePages, preparePageForAnalysis } from "../scripts/content-quality/core.mjs";

const baseConfig = {
  thresholds: {
    editorialNearDuplicate: 0.72,
    productNearDuplicate: 0.9,
    titleSimilarity: 0.86,
    minimumEditorialWords: 10,
    minimumProductWords: 10
  },
  topicOwners: [],
  consolidations: [],
  allowedSeparations: [],
  allowedSystemPhrases: ["Dieser Beitrag enthält Affiliate-Links."]
};

const longText = (subject) => Array.from({ length: 18 }, (_, index) =>
  `${subject} liefert im Abschnitt ${index + 1} eine konkrete Antwort, nachvollziehbare Grenze und praktische Entscheidungshilfe.`
).join(" ");

const page = (route, overrides = {}, config = baseConfig) => preparePageForAnalysis({
  route,
  sourceFile: `src/content/pages/${route.replace(/\W+/g, "-")}.md`,
  title: overrides.title ?? `Ratgeber ${route}`,
  h1: overrides.h1 ?? overrides.title ?? `Ratgeber ${route}`,
  h1Count: 1,
  mainEntity: overrides.mainEntity ?? overrides.title ?? route,
  mainText: overrides.mainText ?? longText(route),
  headings: overrides.headings ?? ["Direkte Antwort", "Entscheidung", "Grenzen"],
  headingCount: 3,
  quality: { score: 85, signals: ["answer", "structure", "decision"] },
  ...overrides
}, config);

const run = (pages, config = baseConfig, redirects = new Map(), sitemap = new Set(pages.filter((item) => item.inSitemap).map((item) => item.route))) =>
  analysePages({ pages, config, redirects, sitemap });

const codes = (result) => result.findings.map((item) => item.code);

test("eindeutiger Ratgeber bleibt KEEP", () => {
  const result = run([page("/ratgeber-a/")]);
  assert.equal(result.decisions[0].decision, "KEEP");
});

test("eindeutiger Vergleich bleibt eigenständig", () => {
  const result = run([page("/vergleiche/test/", { pageType: "comparison", searchIntent: { primary: "comparison" } })]);
  assert.equal(result.decisions[0].decision, "KEEP");
});

test("Produktseite mit konsistenter Identität besteht", () => {
  const result = run([page("/produkt/modell-a/", {
    pageType: "product",
    title: "Modell A im Check",
    h1: "Modell A",
    mainEntity: "Modell A",
    searchIntent: { primary: "product-research" }
  })]);
  assert.ok(!codes(result).includes("CONTENT_PRODUCT_REFERENCE_MISMATCH"));
});

test("Herstellerseite mit konsistenter Identität besteht", () => {
  const result = run([page("/hersteller/marke-a/", {
    pageType: "manufacturer",
    title: "Marke A im Überblick",
    h1: "Marke A",
    mainEntity: "Marke A",
    searchIntent: { primary: "brand-navigation" }
  })]);
  assert.ok(!codes(result).includes("CONTENT_MANUFACTURER_REFERENCE_MISMATCH"));
});

test("Hubseite besitzt eine eigenständige Discovery-Intention", () => {
  const result = run([page("/hub/", { pageType: "category-hub", searchIntent: { primary: "category-discovery" } })]);
  assert.equal(result.decisions[0].decision, "KEEP");
});

test("ähnliche Themen mit unterschiedlicher Intention bleiben getrennt", () => {
  const config = {
    ...baseConfig,
    allowedSeparations: [{ routes: ["/wissen-a/", "/vergleich-a/"], reason: "Ratgeber und Vergleich lösen verschiedene Aufgaben." }]
  };
  const shared = longText("GPS Tracker Reichweite");
  const result = run([
    page("/wissen-a/", { mainText: shared, searchIntent: { primary: "informational" }, cluster: "gps-tracker" }, config),
    page("/vergleich-a/", { mainText: shared, pageType: "comparison", searchIntent: { primary: "comparison" }, cluster: "gps-tracker" }, config)
  ], config);
  assert.ok(!codes(result).includes("CONTENT_NEAR_DUPLICATE"));
});

test("zwei echte Intent-Duplikate werden erkannt", () => {
  const text = longText("gleiche Kaufentscheidung");
  const result = run([
    page("/a/", { mainText: text, cluster: "gps-tracker", searchIntent: { primary: "commercial-investigation" } }),
    page("/b/", { mainText: `${text} Kleine Ergänzung.`, cluster: "gps-tracker", searchIntent: { primary: "commercial-investigation" } })
  ]);
  assert.ok(codes(result).includes("CONTENT_NEAR_DUPLICATE"));
});

test("exaktes redaktionelles Textduplikat blockiert", () => {
  const text = longText("identischer Hauptinhalt");
  const result = run([
    page("/a/", { mainText: text }),
    page("/b/", { mainText: text })
  ]);
  assert.ok(codes(result).includes("CONTENT_EXACT_DUPLICATE"));
});

test("erlaubter Systemblock erzeugt allein kein Duplikat", () => {
  const catText = Array.from({ length: 24 }, (_, index) =>
    `Katzen benötigen Wasserstelle ${index + 1} mit sauberem Napf, ruhigem Standort und beobachtbarer Trinkmenge.`
  ).join(" ");
  const gpsText = Array.from({ length: 24 }, (_, index) =>
    `GPS-Ortung ${index + 1} hängt von Satellitensicht, Mobilfunk, Akku, Aktualisierungsrate und Gerätebefestigung ab.`
  ).join(" ");
  const result = run([
    page("/a/", { mainText: `Dieser Beitrag enthält Affiliate-Links. ${catText}` }),
    page("/b/", { mainText: `Dieser Beitrag enthält Affiliate-Links. ${gpsText}` })
  ]);
  assert.ok(!codes(result).includes("CONTENT_NEAR_DUPLICATE"));
});

test("leere indexierbare Seite blockiert", () => {
  const result = run([page("/leer/", { mainText: "", wordCount: 0, quality: { score: 10, signals: [] } })]);
  assert.ok(codes(result).includes("CONTENT_EMPTY_MAIN"));
});

test("sichtbares TODO blockiert", () => {
  const result = run([page("/todo/", { mainText: `${longText("Inhalt")} TODO` })]);
  assert.ok(codes(result).includes("CONTENT_VISIBLE_PLACEHOLDER"));
});

test("noindex-Seite außerhalb der Sitemap ist zulässig", () => {
  const result = run([page("/intern/", { indexable: false, inSitemap: false })], baseConfig, new Map(), new Set());
  assert.ok(!codes(result).includes("CONTENT_NOINDEX_IN_SITEMAP"));
  assert.equal(result.decisions[0].decision, "NOINDEX");
});

test("vollständige Konsolidierung mit Redirect ist gelöst", () => {
  const config = {
    ...baseConfig,
    consolidations: [{ id: "merge-a", from: "/alt/", to: "/neu/", reason: "Bestätigtes Duplikat." }]
  };
  const result = run(
    [page("/neu/")],
    config,
    new Map([["/alt/", "/neu/"]]),
    new Set(["/neu/"])
  );
  assert.equal(result.conflicts.find((item) => item.id === "merge-a").after, "resolved");
  assert.ok(!codes(result).includes("CONTENT_CONSOLIDATION_REDIRECT_MISSING"));
});

test("gegenteilige Gesundheitsintentionen bleiben getrennt", () => {
  const config = {
    ...baseConfig,
    allowedSeparations: [{ routes: ["/zu-viel/", "/zu-wenig/"], reason: "Gegensätzliche Symptome." }]
  };
  const result = run([
    page("/zu-viel/", { pageType: "medical-guide", searchIntent: { primary: "medical-information" }, mainText: longText("Katze trinkt zu viel") }, config),
    page("/zu-wenig/", { pageType: "medical-guide", searchIntent: { primary: "medical-information" }, mainText: longText("Katze trinkt zu wenig") }, config)
  ], config);
  assert.ok(!codes(result).includes("CONTENT_NEAR_DUPLICATE"));
});

test("zwei Topic Owner derselben Regel blockieren", () => {
  const config = {
    ...baseConfig,
    topicOwners: [
      { route: "/a/", cluster: "gps", intent: "comparison", terms: ["gps tracker"] },
      { route: "/b/", cluster: "gps", intent: "comparison", terms: ["gps tracker"] }
    ]
  };
  assert.ok(codes(run([page("/a/"), page("/b/")], config)).includes("CONTENT_TOPIC_OWNER_CONFLICT"));
});

test("identische Titles und H1 blockieren", () => {
  const result = run([
    page("/a/", { title: "Gleicher Titel", h1: "Gleiche H1" }),
    page("/b/", { title: "Gleicher Titel", h1: "Gleiche H1" })
  ]);
  assert.ok(codes(result).includes("CONTENT_TITLE_DUPLICATE"));
  assert.ok(codes(result).includes("CONTENT_H1_DUPLICATE"));
});

test("Produktseite mit falscher Produktidentität blockiert", () => {
  const result = run([page("/produkt/a/", {
    pageType: "product",
    mainEntity: "Modell Alpha",
    title: "Modell Beta im Check",
    h1: "Modell Beta",
    searchIntent: { primary: "product-research" }
  })]);
  assert.ok(codes(result).includes("CONTENT_PRODUCT_REFERENCE_MISMATCH"));
});

test("falsche Vergleichsanzahl blockiert", () => {
  const result = run([page("/vergleiche/a/", {
    pageType: "comparison",
    expectedComparisonCount: 5,
    renderedComparisonCount: 4,
    searchIntent: { primary: "comparison" }
  })]);
  assert.ok(codes(result).includes("CONTENT_COMPARISON_COUNT_MISMATCH"));
});

test("nahezu identische Ratgeber werden gewarnt oder blockiert", () => {
  const text = longText("gemeinsame redaktionelle Struktur");
  const result = run([
    page("/a/", { mainText: text, cluster: "futterautomaten" }),
    page("/b/", { mainText: text.replace("konkrete", "präzise"), cluster: "futterautomaten" })
  ]);
  assert.ok(codes(result).includes("CONTENT_NEAR_DUPLICATE"));
});

test("entfernte URL ohne Redirect blockiert", () => {
  const config = {
    ...baseConfig,
    consolidations: [{ id: "missing-redirect", from: "/alt/", to: "/neu/", reason: "Duplikat." }]
  };
  assert.ok(codes(run([page("/neu/")], config)).includes("CONTENT_CONSOLIDATION_REDIRECT_MISSING"));
});

test("noindex-URL in Sitemap blockiert", () => {
  const result = run([page("/intern/", { indexable: false, inSitemap: true })]);
  assert.ok(codes(result).includes("CONTENT_NOINDEX_IN_SITEMAP"));
});

test("medizinische Seite mit kommerziellem Topic Owner blockiert", () => {
  const result = run([page("/gesundheit/", {
    pageType: "medical-guide",
    searchIntent: { primary: "medical-information" },
    topicOwner: { route: "/vergleiche/produkte/", id: "wrong", explicit: true }
  })]);
  assert.ok(codes(result).includes("CONTENT_HEALTH_INTENT_CONFLICT"));
});
