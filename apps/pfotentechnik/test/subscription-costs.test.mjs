import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import {
  buildSubscriptionCostModel,
  formatSubscriptionComparison,
  isSubscriptionEvidenceStale,
  SUBSCRIPTION_PRICE_STALE_DAYS,
} from "../src/domain/subscriptionCosts.ts";
import { normalizeGpsProduct } from "../src/lib/authority-distribution/gps-subscriptions.mjs";
import { resolveComparisonValue } from "../src/domain/comparison/comparisonDataPlatform.ts";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const yaml = createRequire(path.join(app, "package.json"))("js-yaml");
const NOW = "2026-09-02T12:00:00.000Z";

const plan = (overrides = {}) => ({
  name: "Jahrestarif",
  billingPeriod: "annual",
  commitmentMonths: 12,
  billingMode: "upfront",
  price: 84,
  currency: "EUR",
  effectiveMonthlyPrice: 7,
  autoRenew: true,
  featured: true,
  ...overrides,
});

const subscription = (overrides = {}) => ({
  status: "required-subscription",
  requiredForCoreFunction: true,
  serviceType: "cellular",
  serviceModel: "subscription",
  provider: "Anbieter",
  researchedAt: "2026-09-02",
  source: "https://example.com/pricing",
  plans: [plan()],
  ...overrides,
});

test("Pflichtabo zeigt tatsächlichen Jahresbetrag, Monatsäquivalent und 12/24-Monats-Kosten", () => {
  const model = buildSubscriptionCostModel({ subscription: subscription(), devicePrice: 48.30, now: NOW });
  assert.equal(model.runningCostLabel, "84,00 € / Jahr");
  assert.equal(model.featuredPlan.monthlyEquivalentLabel, "entspricht 7,00 € / Monat");
  assert.equal(model.featuredPlan.billingLabel, "jährliche Zahlung");
  assert.equal(model.totals.months12.value, 132.3);
  assert.equal(model.totals.months24.value, 216.3);
});

test("Pflichtdienst mit unbekanntem Preis wird nie als kostenlos oder als TCO ausgegeben", () => {
  const model = buildSubscriptionCostModel({ subscription: subscription({ plans: [] }), devicePrice: 59.99, now: NOW });
  assert.match(model.runningCostLabel, /Zusatzkosten erforderlich/);
  assert.doesNotMatch(model.runningCostLabel, /kostenlos|0\s*€/i);
  assert.equal(model.totals.months12, null);
  assert.equal(model.totals.months24, null);
});

test("Prepaid trennt Vorauszahlung und automatische Verlängerung", () => {
  const model = buildSubscriptionCostModel({
    subscription: subscription({
      status: "required-prepaid",
      serviceModel: "prepaid",
      plans: [plan({ name: "Prepaid 12 Monate", billingPeriod: "term", billingMode: "prepaid", price: 60, effectiveMonthlyPrice: 5, autoRenew: false })]
    }),
    devicePrice: 80,
    now: NOW
  });
  assert.equal(model.label, "Prepaid-Service erforderlich");
  assert.match(model.featuredPlan.billingLabel, /im Voraus/);
  assert.match(model.featuredPlan.billingLabel, /keine automatische Verlängerung/);
  assert.equal(model.totals.months24.value, 200);
});

test("optionaler Dienst hält Grundbetrieb und Kosten-Szenario auseinander", () => {
  const model = buildSubscriptionCostModel({
    subscription: subscription({ status: "optional-subscription", requiredForCoreFunction: false, serviceModel: "optional", freeFunctions: ["Livebild"], paidFunctions: ["Cloudvideo"] }),
    devicePrice: 49,
    now: NOW
  });
  assert.equal(model.label, "Optionales Abo");
  assert.equal(model.totalScenarioLabel, "mit optionalem Dienst");
  assert.deepEqual(model.freeFunctions, ["Livebild"]);
});

test("kein Abonnement erzeugt keine erfundene laufende Gebühr", () => {
  const model = buildSubscriptionCostModel({ subscription: subscription({ status: "no-subscription", requiredForCoreFunction: false, serviceType: "non-cellular", serviceModel: "none", plans: [] }), devicePrice: 300, now: NOW });
  assert.equal(model.label, "Kein verpflichtendes Abo");
  assert.match(model.runningCostLabel, /Keine verpflichtenden/);
  assert.doesNotMatch(model.runningCostLabel, /kostenlos/i);
});

test("mehrere Pläne nutzen nur den redaktionell markierten Tarif als Rechenbeispiel", () => {
  const model = buildSubscriptionCostModel({ subscription: subscription({ plans: [plan({ name: "Monatlich", billingPeriod: "monthly", commitmentMonths: 1, price: 13, effectiveMonthlyPrice: 13, featured: false }), plan()] }), devicePrice: 48.3, now: NOW });
  assert.equal(model.plans.length, 2);
  assert.equal(model.featuredPlan.name, "Jahrestarif");
  assert.equal(model.totals.months24.value, 216.3);
});

test("fehlender Gerätepreis unterdrückt TCO, lässt Servicepreis aber sichtbar", () => {
  const model = buildSubscriptionCostModel({ subscription: subscription(), devicePrice: null, now: NOW });
  assert.equal(model.devicePriceLabel, "Preis beim Händler prüfen");
  assert.equal(model.totals.months12, null);
  assert.equal(model.totals.months24, null);
  assert.equal(model.runningCostLabel, "84,00 € / Jahr");
});

test("120-Tage-Regel entwertet veraltete Servicepreise und verhindert falsche TCO", () => {
  const stale = subscription({ researchedAt: "2026-04-01" });
  assert.equal(SUBSCRIPTION_PRICE_STALE_DAYS, 120);
  assert.equal(isSubscriptionEvidenceStale(stale, NOW), true);
  const model = buildSubscriptionCostModel({ subscription: stale, devicePrice: 50, now: NOW });
  assert.equal(model.stale, true);
  assert.match(model.runningCostLabel, /aktuellen Tarif prüfen/i);
  assert.equal(model.totals.months24, null);
});

test("Vergleichsformat enthält Servicemodell, echten Zahlbetrag und 24-Monats-Szenario", () => {
  const value = formatSubscriptionComparison(subscription(), 48.3, NOW);
  assert.match(value, /Abo erforderlich/);
  assert.match(value, /84,00 € \/ Jahr/);
  assert.match(value, /2 Jahre 216,30 €/);
});

test("Produktkosten überschreiben veralteten vergleichsspezifischen Abo-Freitext", () => {
  const value = resolveComparisonValue({
    product: { data: { title: "Tracker", recommendation: "Test", manufacturer: { name: "Test" }, specs: [], strengths: [], decision: { attention: [] }, comparisonData: {}, comparisonFilters: {}, price: { current: 48.3, currency: "EUR", checkedAt: "2026-09-02" }, subscription: subscription() } },
    item: { slug: "tracker", values: { abo: "Alter Freitext" } },
    criterion: { key: "abo", label: "Abo" }
  });
  assert.doesNotMatch(value, /Alter Freitext/);
  assert.match(value, /84,00 € \/ Jahr/);
});

test("GPS-Asset bevorzugt strukturierten Status und übernimmt Prepaid-Pläne rückwärtskompatibel", () => {
  const product = {
    title: "Prepaid GPS", slug: "prepaid-gps", productStatus: "active", updatedAt: "2026-09-02",
    manufacturer: { key: "test", name: "Test", slug: "test" },
    gps: { subscriptionRequired: true },
    subscription: subscription({ status: "required-prepaid", serviceModel: "prepaid", plans: [plan({ billingPeriod: "term", billingMode: "prepaid", autoRenew: false })] })
  };
  const normalized = normalizeGpsProduct(product, { generatedAt: NOW });
  assert.equal(normalized.subscription.status, "required");
  assert.equal(normalized.subscription.modelStatus, "required-prepaid");
  assert.equal(normalized.subscription.plans[0].billingMode, "prepaid");
  assert.equal(normalized.eligible, true);
});

test("Schema, Cost Card und responsive contract sind im Produktionspfad verdrahtet", () => {
  const schema = fs.readFileSync(path.join(app, "src/content/schema/product.ts"), "utf8");
  const hero = fs.readFileSync(path.join(app, "src/components/product-experience-2/ProductHero2.astro"), "utf8");
  const priceBox = fs.readFileSync(path.join(app, "src/components/product-experience-2/PriceBox2.astro"), "utf8");
  assert.match(schema, /required-prepaid/);
  assert.match(schema, /subscription: productSubscriptionSchema\.optional\(\)/);
  assert.match(hero, /subscriptionCost=\{model\.subscriptionCosts\}/);
  assert.match(priceBox, /Gesamtkosten nach 2 Jahren/);
  assert.match(priceBox, /@media \(max-width: 410px\)/);
  assert.doesNotMatch(priceBox, /min-width:\s*[5-9]\d\dpx/);
});

test("alle aktiven GPS- und Haustierkamera-Produkte besitzen strukturierten Research-Status", () => {
  const directory = path.join(app, "src/content/products");
  const scoped = fs.readdirSync(directory).filter((file) => file.endsWith(".md")).map((file) => {
    const source = fs.readFileSync(path.join(directory, file), "utf8");
    const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
    return match ? yaml.load(match[1], { schema: yaml.JSON_SCHEMA }) : null;
  }).filter((data) => data?.productStatus === "active" && ["gps-tracker", "haustierkameras"].includes(data?.category?.key));
  assert.equal(scoped.length, 20);
  assert.equal(scoped.filter((data) => data.subscription?.status).length, 20);
  assert.equal(scoped.filter((data) => data.subscription?.source && data.subscription?.researchedAt).length, 20);
});
