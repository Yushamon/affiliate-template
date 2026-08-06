import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractOfferFromHtml } from "./extract-offer.mjs";
import {
  readProductDocument,
  readProductFiles,
  updateProductOperations,
  updateProductPrice
} from "./frontmatter-price.mjs";
import { safeFetchText } from "./safe-fetch.mjs";
import {
  AVAILABILITY_VALUES,
  PRICE_STATE_VALUES,
  availabilityFromOffer,
  buildOperationsDashboard,
  compareMaintenanceRows,
  createInFlightDeduper,
  deriveProductOperations,
  parseLocalizedPrice,
  toOperationsRecord
} from "../product-operations/policy.mjs";

const appRoot = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const productsDir = path.join(appRoot, "src", "content", "products");
const dedupePriceCheck = createInFlightDeduper();

const hostnameLabel = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "Händler"; }
};

const validateSlug = (value) => {
  const slug = String(value || "").trim();
  if (!slug) throw new Error("Produkt-Slug fehlt.");
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) throw new Error("Der Produkt-Slug ist ungültig.");
  return slug;
};

const validateCurrency = (value) => {
  const currency = String(value || "EUR").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("Die Währung muss als dreistelliger ISO-Code angegeben werden.");
  }
  return currency;
};

const validateTargetUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  const normalized = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : "https://" + raw;
  const parsed = new URL(normalized);
  if (parsed.protocol === "http:") parsed.protocol = "https:";
  if (parsed.protocol !== "https:") {
    throw new Error("Für Preise und Affiliate-Ziele sind nur HTTPS-URLs erlaubt.");
  }
  return parsed.href;
};

const validateManufacturer = (input) => {
  const provided = [input.manufacturerName, input.manufacturerSlug, input.manufacturerKey]
    .some((value) => String(value || "").trim());
  if (!provided) return undefined;
  const name = String(input.manufacturerName || "").trim().slice(0, 120);
  const slug = String(input.manufacturerSlug || input.manufacturerKey || "").trim().toLocaleLowerCase("de-DE");
  const key = String(input.manufacturerKey || slug).trim().toLocaleLowerCase("de-DE");
  if (!name) throw new Error("Herstellername fehlt.");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug) || !/^[a-z0-9][a-z0-9-]*$/.test(key)) {
    throw new Error("Hersteller-Slug und Hersteller-Key dürfen nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.");
  }
  return { name, slug, key };
};

const resultFromDocument = (document, extra = {}) => {
  const record = toOperationsRecord(document.data);
  return {
    ...record,
    ...extra,
    record
  };
};

export async function listPriceDocuments() {
  const files = await readProductFiles(productsDir);
  return Promise.all(files.map(readProductDocument));
}

async function findDocument(slug) {
  const documents = await listPriceDocuments();
  const document = documents.find((item) => item.slug === slug);
  if (!document) throw new Error(`Produkt "${slug}" wurde nicht gefunden.`);
  return document;
}

async function checkDocumentPrice(document) {
  const data = document.data ?? {};
  const targetUrl = data.affiliate?.url || data.price?.affiliateUrl || data.productUrl;
  if (!targetUrl) throw new Error("Für dieses Produkt ist keine Händler-URL hinterlegt.");

  const fetched = await safeFetchText(targetUrl);
  const offer = extractOfferFromHtml(fetched.html, fetched.resolvedUrl);
  if (!offer) throw new Error("Auf der Händlerseite wurde kein belastbarer strukturierter Preis gefunden.");

  const checkedAt = new Date().toISOString();
  const sourceLabel = hostnameLabel(fetched.resolvedUrl);
  const availability = availabilityFromOffer(offer.availability) ?? "available";

  const persisted = await updateProductPrice(
    document.file,
    {
      current: offer.current,
      currency: offer.currency || "EUR",
      status: "unknown",
      checkedAt,
      source: {
        id: sourceLabel,
        label: sourceLabel,
        type: "merchant"
      }
    },
    {
      affiliateUrl: targetUrl,
      syncAffiliateUrl: true,
      now: checkedAt,
      operations: {
        availability,
        availabilityReason: availability === "available"
          ? "Bei der automatischen Preisprüfung als verfügbar erkannt."
          : `Bei der automatischen Preisprüfung als ${availability} erkannt.`,
        availabilityUpdated: checkedAt
      }
    }
  );

  return resultFromDocument(persisted, {
    checkedAt,
    method: offer.method,
    source: sourceLabel,
    targetUrl,
    availabilityDetected: availability
  });
}

export async function checkProductPrice(slugInput) {
  const slug = validateSlug(slugInput);
  return dedupePriceCheck(slug, async () => checkDocumentPrice(await findDocument(slug)));
}

export async function checkAllProductPrices({ limit = 100, includeInactive = false } = {}) {
  const documents = await listPriceDocuments();
  const candidates = documents.filter((document) => {
    if (includeInactive) return true;
    const operations = deriveProductOperations(document.data);
    return !operations.consciouslyUnavailable && !operations.archived;
  });
  const safeLimit = Math.min(candidates.length, Math.max(1, Number(limit) || 100));
  const results = [];

  for (const document of candidates.slice(0, safeLimit)) {
    try {
      results.push({ ok: true, ...(await checkProductPrice(document.slug)) });
    } catch (error) {
      results.push({
        ok: false,
        slug: document.slug,
        title: document.data?.title,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return {
    checkedAt: new Date().toISOString(),
    total: results.length,
    succeeded: results.filter((item) => item.ok).length,
    failed: results.filter((item) => !item.ok).length,
    skipped: documents.length - candidates.length,
    results
  };
}

export async function setManualProductPrice(input = {}) {
  // PT_MANUAL_PRICE_STATE_NORMALIZATION_2_0_1
  const slug = validateSlug(input.slug);
  const document = await findDocument(slug);
  const data = document.data ?? {};
  const now = new Date().toISOString();
  const availability = AVAILABILITY_VALUES.includes(input.availability) ? input.availability : undefined;
  const availabilityReason = String(input.availabilityReason || "").trim().slice(0, 500);

  const rawCurrent = String(input.current ?? "").trim();
  const current = rawCurrent ? parseLocalizedPrice(rawCurrent) : null;
  if (rawCurrent && current == null) {
    throw new Error("Der manuelle Preis ist ungültig. Erlaubt sind zum Beispiel 29,99 oder 29.99.");
  }
  const hasCurrent = current != null;
  const requestedPriceState = PRICE_STATE_VALUES.includes(input.priceState) ? input.priceState : undefined;
  const priceState = hasCurrent
    ? requestedPriceState === "stale" ? "stale" : "available"
    : requestedPriceState || data.priceState || (data.price?.current == null ? "unknown" : "available");

  const targetUrlProvided = Object.prototype.hasOwnProperty.call(input, "targetUrl") ||
    Object.prototype.hasOwnProperty.call(input, "affiliateUrl");
  const enteredUrl = validateTargetUrl(input.targetUrl ?? input.affiliateUrl);
  const targetUrl = targetUrlProvided
    ? enteredUrl
    : validateTargetUrl(data.affiliate?.url || data.price?.affiliateUrl || data.price?.source?.url || data.productUrl);

  const sourceLabel =
    String(input.sourceLabel || "").trim().slice(0, 120) ||
    (targetUrl ? hostnameLabel(targetUrl) : "") ||
    (data.price?.source?.type === "manual" ? String(data.price.source.label || "").trim() : "") ||
    "Manuell im SEO Cockpit";
  const comparisonText = String(input.comparisonText || "").trim().slice(0, 360);
  const manufacturer = validateManufacturer(input);

  if (!hasCurrent) {
    if (["available", "stale"].includes(priceState) && data.price?.current == null) {
      throw new Error("Für den Status Preis vorhanden oder veraltet muss ein Preis eingegeben werden.");
    }
    const patch = {
      priceState,
      availability,
      availabilityReason,
      availabilityUpdated: availability ? now : undefined,
      sourceLabel,
      comparisonText,
      ...(manufacturer ? { manufacturer } : {}),
      now
    };
    if (targetUrlProvided) patch.affiliateUrl = targetUrl;
    const persisted = await updateProductOperations(document.file, patch);
    return resultFromDocument(persisted, {
      method: "manual-status",
      targetUrl: targetUrl ?? null,
      affiliateUrl: targetUrl ?? null,
      ctaUpdated: targetUrlProvided
    });
  }

  const currency = validateCurrency(input.currency);
  const persisted = await updateProductPrice(
    document.file,
    {
      current,
      currency,
      status: "unknown",
      comparisonText: comparisonText || undefined,
      checkedAt: now,
      source: {
        id: "manual",
        label: sourceLabel,
        type: "manual"
      }
    },
    {
      affiliateUrl: targetUrl,
      syncAffiliateUrl: targetUrlProvided || Boolean(targetUrl),
      removeAffiliate: targetUrlProvided && !targetUrl,
      now,
      operations: {
        priceState,
        availability,
        availabilityReason,
        availabilityUpdated: availability ? now : undefined
      }
    }
  );

  const finalDocument = manufacturer
    ? await updateProductOperations(persisted.file, { manufacturer, now })
    : persisted;

  return resultFromDocument(finalDocument, {
    checkedAt: now,
    source: sourceLabel,
    targetUrl: targetUrl ?? null,
    affiliateUrl: targetUrl ?? null,
    ctaUpdated: targetUrlProvided,
    method: "manual"
  });
}

export async function updateProductOperationsState(input = {}) {
  const slug = validateSlug(input.slug);
  const document = await findDocument(slug);
  const patch = { now: new Date().toISOString() };

  if (input.availability !== undefined) {
    if (!AVAILABILITY_VALUES.includes(input.availability)) throw new Error("Unbekannter Verfügbarkeitsstatus.");
    patch.availability = input.availability;
    patch.availabilityReason = String(input.availabilityReason || "").trim().slice(0, 500);
  }
  if (input.priceState !== undefined) {
    if (!PRICE_STATE_VALUES.includes(input.priceState)) throw new Error("Unbekannter Preisstatus.");
    patch.priceState = input.priceState;
  }
  if (input.archive !== undefined) patch.archive = Boolean(input.archive);

  const persisted = await updateProductOperations(document.file, patch);
  return resultFromDocument(persisted, { method: "operations-update" });
}

export async function priceAudit() {
  const documents = await listPriceDocuments();
  const products = documents
    .map(({ data }) => toOperationsRecord(data))
    .map((record) => ({ ...record, operations: record }))
    .sort(compareMaintenanceRows)
    .map(({ operations: _operations, ...record }) => record);

  const rowsForDashboard = products.map((record) => ({ operations: record }));
  const dashboard = buildOperationsDashboard(rowsForDashboard);

  return {
    generatedAt: new Date().toISOString(),
    summary: dashboard,
    products
  };
}
