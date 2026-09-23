import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractOfferFromHtml } from "./extract-offer.mjs";
import {
  readProductDocument,
  readProductFiles,
  updateProductOffer,
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
import { resolveCommerceOffers } from '../../domain/commerceOffers.mjs';
import { refreshOfficialOffer, refreshCommerceTasks } from './commerce-refresh.mjs';
import { productOfferSchema } from '../../content/schema/commerce.mjs';
import { affiliatePrograms } from '../../config/affiliate-programs.mjs';
import { httpsDestination } from '../../../../../packages/affiliate-core/src/affiliate/networks.mjs';

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
  const record = {...toOperationsRecord(document.data), commerceOffers: resolveCommerceOffers(document.data)};
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

export const allowsAutomaticPriceCheck = (data = {}) => data?.priceAutomation !== "editorial";

async function checkDocumentPrice(document) {
  if (!allowsAutomaticPriceCheck(document.data)) {
    throw new Error("Die automatische Preisprüfung ist für dieses Produkt redaktionell gesperrt.");
  }
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

export async function checkProductPrice(slugInput, {find = findDocument, checkLegacy = checkDocumentPrice, refresh = refreshOfficialOffer, persist = updateProductOffer} = {}) {
  const slug = validateSlug(slugInput);
  return dedupePriceCheck(slug, async () => {
    const document = await find(slug);
    const tasks = [];
    if (allowsAutomaticPriceCheck(document.data) && (document.data.affiliate?.url || document.data.price?.affiliateUrl)) {
      tasks.push({id:'legacy',provider:'structured-html',run:()=>checkLegacy(document)});
    }
    for (const offer of document.data.offers ?? []) {
      tasks.push({id:offer.id,provider:offer.commerceDataProvider,run:async()=>{
        try {
          const next = await refresh(offer);
          await persist(document.file, offer.id, current => {
            if (['officialProductUrl','variantId','expectedSku','program','mappingStatus'].some(key => current[key] !== offer[key])) throw new Error('Händlerzuordnung wurde während der Prüfung geändert; erneut prüfen.');
            return {...current,price:next.price,priceState:next.priceState,availability:next.availability,lastAttemptAt:next.lastAttemptAt,error:undefined};
          });
          return {checkedAt:next.price.checkedAt};
        } catch(error) {
          await persist(document.file, offer.id, current => ({...current,lastAttemptAt:new Date().toISOString(),error:String(error.message).slice(0,400)}));
          throw error;
        }
      }});
    }
    const providerResults = await refreshCommerceTasks(tasks);
    return resultFromDocument(await find(slug), {providerResults,
      ok:providerResults.some(r=>r.ok), error:providerResults.length ? providerResults.filter(r=>!r.ok).map(r=>`${r.id}: ${r.error}`).join(' · ') : 'Keine automatische Quelle konfiguriert.'});
  });
}

export async function checkAllProductPrices({ limit = Number.MAX_SAFE_INTEGER, includeInactive = false } = {}, {listDocuments = listPriceDocuments, check = checkProductPrice} = {}) {
  const documents = await listDocuments();
  const candidates = documents.filter((document) => {
    if (document.data.offers?.length) return true;
    if (!allowsAutomaticPriceCheck(document.data)) return false;
    if (includeInactive) return true;
    const operations = deriveProductOperations(document.data);
    return !operations.consciouslyUnavailable && !operations.archived;
  });
  const safeLimit = Math.min(candidates.length, Math.max(1, Number(limit) || candidates.length));
  const results = [];

  for (const document of candidates.slice(0, safeLimit)) {
    try {
      results.push({ ok: true, ...(await check(document.slug)) });
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

export async function setManualProductPrice(input = {}, {find = findDocument, persistOffer = updateProductOffer} = {}) {
  // PT_MANUAL_PRICE_STATE_NORMALIZATION_2_0_1
  const slug = validateSlug(input.slug);
  const document = await find(slug);
  const data = document.data ?? {};
  const now = new Date().toISOString();
  const availability = AVAILABILITY_VALUES.includes(input.availability) ? input.availability : undefined;
  const availabilityReason = String(input.availabilityReason || "").trim().slice(0, 500);

  const rawCurrent = String(input.current ?? "").trim();
  const current = rawCurrent ? parseLocalizedPrice(rawCurrent) : null;
  if (rawCurrent && current == null) {
    throw new Error("Der manuelle Preis ist ungültig. Erlaubt sind zum Beispiel 29,99 oder 29.99.");
  }
  if (input.offerId && input.offerId !== 'legacy') {
    const offerId = String(input.offerId);
    if (!data.offers?.some(offer => offer.id === offerId)) throw new Error('Händlerangebot nicht gefunden.');
    if (!availability) throw new Error('Gültige Verfügbarkeit für das Händlerangebot fehlt.');
    const currency = validateCurrency(input.currency);
    const persisted = await persistOffer(document.file, offerId, offer => ({
      ...offer,
      price: {...offer.price, current, currency, checkedAt:now,
        source:{id:'cockpit-manual',label:affiliatePrograms[offer.program]?.label || offer.merchant,type:'manual'}},
      priceState:current == null ? 'unknown' : 'available', availability, error:undefined
    }));
    return resultFromDocument(persisted,{method:'manual-offer',offerId});
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
    .map(({ data }) => ({...toOperationsRecord(data), commerceOffers: resolveCommerceOffers(data)}))
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

// Existing Cockpit handles offer-specific maintenance; official URLs never replace evidence URLs.
export async function setProductCommerceOffer(input = {}) {
  const document = await findDocument(validateSlug(input.slug));
  const id = String(input.id ?? '').trim();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error('Ungültige Offer-ID.');
  const program = affiliatePrograms[input.program];
  if (!program) throw new Error('Unbekanntes Affiliate-Programm.');
  const destination = input.officialProductUrl ? httpsDestination(input.officialProductUrl,program.hosts) : undefined;
  if (input.officialProductUrl && !destination) throw new Error('Ungültige offizielle HTTPS-Produkt-URL.');
  let verifiedSnapshot;
  if (input.confirmIdentity === true) {
    verifiedSnapshot = await refreshOfficialOffer({program:input.program,officialProductUrl:destination,mappingStatus:'verified',commerceDataProvider:'shopify-product',variantId:String(input.variantId ?? ''),expectedSku:String(input.expectedSku ?? '')});
  }
  const persisted = await updateProductOffer(document.file,id,current=>{
    const sameIdentity = current?.officialProductUrl === destination && current?.variantId === String(input.variantId ?? '') && current?.expectedSku === String(input.expectedSku ?? '');
    const next = {...current,id,merchant:program.merchant,network:program.network,program:input.program,
      officialProductUrl:destination,variantId:String(input.variantId ?? '') || undefined,expectedSku:String(input.expectedSku ?? '') || undefined,
      mappingStatus:sameIdentity ? current.mappingStatus : 'unresolved',
      identityNote:sameIdentity ? current.identityNote : 'Neue Zuordnung benötigt Modell-/Generationsprüfung.',
      commerceDataProvider:current?.commerceDataProvider ?? (program.merchant==='petlibro'?'shopify-product':'manual'),
      price:sameIdentity ? current.price : {current:null,currency:'EUR',status:'unknown'},
      priceState:sameIdentity ? current.priceState:'unknown',availability:sameIdentity ? current.availability:'unknown',
      verifiedAt:sameIdentity?current.verifiedAt:undefined,evidenceSources:sameIdentity?current.evidenceSources:[],error:undefined};
    if (verifiedSnapshot) Object.assign(next, {mappingStatus:'verified',verifiedAt:verifiedSnapshot.lastAttemptAt,lastAttemptAt:verifiedSnapshot.lastAttemptAt,price:verifiedSnapshot.price,priceState:verifiedSnapshot.priceState,availability:verifiedSnapshot.availability,
      identityNote:'Modell und Variante im Cockpit redaktionell bestätigt; SKU und Preisquelle serverseitig geprüft.',
      evidenceSources:[{source:program.label,url:destination,accessedAt:verifiedSnapshot.lastAttemptAt,assertion:'Modell-/Generationszuordnung redaktionell bestätigt; exakte SKU in offizieller Variante geprüft.',fields:['officialProductUrl','variantId','expectedSku'],sourceType:'officialStore'}]});
    return productOfferSchema.parse(next);
  });
  return resultFromDocument(persisted);
}
