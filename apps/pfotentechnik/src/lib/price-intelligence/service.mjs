import fs from 'node:fs';
import {AUDIT_LOG_FILE} from '../search/config.mjs';
import {createHash} from 'node:crypto';
import {searchLog as sharedSearchLog,sanitizeLogEntry} from '../search/logging.mjs';
import {decisionQualitySummary} from '../../domain/productExperience/decisionQuality.mjs';
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractOfferFromHtml } from "./extract-offer.mjs";
import {
  readProductDocument,
  readProductFiles,
  updateProductOffer,
  updateProductEditorial,
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
const productsDir = process.env.PFOTENTECHNIK_PRODUCT_FIXTURES || path.join(appRoot, "src", "content", "products");
const commerceAuditPath=process.env.PFOTENTECHNIK_PRODUCT_FIXTURES?path.join(productsDir,'.commerce-audit.jsonl'):AUDIT_LOG_FILE;
const searchLog=entry=>{if(process.env.PFOTENTECHNIK_PRODUCT_FIXTURES)fs.appendFileSync(commerceAuditPath,JSON.stringify(sanitizeLogEntry(entry))+'\n');else sharedSearchLog(entry)};
const dedupePriceCheck = createInFlightDeduper();

const editorialFields = data => ({ ratings: data.ratings, rating: data.rating, score: data.score,
  editorialStatus: data.editorialStatus, updatedAt: data.updatedAt, priceAutomation: data.priceAutomation,
  evidenceSources: data.evidenceSources, methodology: data.experience?.methodology ?? data.externalEvidence?.consensus?.editorialAssessment ?? '' });

export async function readProductEditorial(slug, { find = findDocument } = {}) {
  const document = await find(validateSlug(slug));
  const { createHash } = await import('node:crypto');
  return { decisionQuality: decisionQualitySummary(document.data), sourceHash: createHash('sha256').update(document.source).digest('hex'), editorial: editorialFields(document.data) };
}

export async function saveProductEditorial(input, { find = findDocument } = {}) {
  const document = await find(validateSlug(input?.slug));
  const saved = await updateProductEditorial(document.file, input.patch, input.expectedHash);
  const { createHash } = await import('node:crypto');
  return { ...resultFromDocument(saved), sourceHash: createHash('sha256').update(saved.source).digest('hex'),
    decisionQuality: decisionQualitySummary(saved.data), editorial: editorialFields(saved.data) };
}

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
  const record = {sourceHash:document.source?createHash('sha256').update(document.source).digest('hex'):undefined,...toOperationsRecord(document.data), commerceOffers: resolveCommerceOffers(document.data)};
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

export async function checkDocumentPrice(document, { fetchText = safeFetchText } = {}) {
  if (!allowsAutomaticPriceCheck(document.data)) {
    throw new Error("Die automatische Preisprüfung ist für dieses Produkt redaktionell gesperrt.");
  }
  const data = document.data ?? {};
  const targetUrl = data.affiliate?.url || data.price?.affiliateUrl || data.productUrl;
  if (!targetUrl) throw new Error("Für dieses Produkt ist keine Händler-URL hinterlegt.");

  const fetched = await fetchText(targetUrl);
  const offer = extractOfferFromHtml(fetched.html, fetched.resolvedUrl);
  if (!offer) throw new Error("Auf der Händlerseite wurde kein belastbarer strukturierter Preis gefunden.");

  const checkedAt = new Date().toISOString();
  const sourceLabel = hostnameLabel(fetched.resolvedUrl);
  const resolvedMerchant = new URL(fetched.resolvedUrl);
  const germanMarket = resolvedMerchant.hostname.endsWith('.de') || resolvedMerchant.hostname.startsWith('de.') || /^\/de(?:[-/]|$)/.test(resolvedMerchant.pathname);
  const availability = germanMarket && offer.currency === "EUR" ? availabilityFromOffer(offer.availability) ?? "unknown" : "unknown";

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
        ...(availability !== "unknown" ? {
          availability,
          availabilityReason: `Händler meldet ${offer.availability} bei der automatischen Prüfung.`,
          availabilityUpdated: checkedAt
        } : {})
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
    const legacyTarget = document.data.affiliate?.url || document.data.price?.affiliateUrl;
    const hasExactOfficialSource = (document.data.offers ?? []).some(offer => {
      if (offer.mappingStatus !== 'verified' || offer.commerceDataProvider !== 'shopify-product') return false;
      try { return new URL(offer.officialProductUrl).hostname === new URL(legacyTarget).hostname; } catch { return false; }
    });
    if (allowsAutomaticPriceCheck(document.data) && legacyTarget && !hasExactOfficialSource) {
      tasks.push({id:'legacy',provider:'structured-html',run:()=>checkLegacy(document)});
    }
    for (const offer of document.data.offers ?? []) {
      tasks.push({id:offer.id,provider:offer.commerceDataProvider,run:async()=>{
        try {
          const next = await refresh(offer);
          await persist(document.file, offer.id, current => {
            if (['officialProductUrl','variantId','expectedSku','program','mappingStatus'].some(key => current[key] !== offer[key])) throw new Error('Händlerzuordnung wurde während der Prüfung geändert; erneut prüfen.');
            return {...current,price:next.price,priceState:next.priceState,availability:next.availability,availabilityUpdated:next.availabilityUpdated,lastAttemptAt:next.lastAttemptAt,error:undefined};
          });
          return {checkedAt:next.price.checkedAt};
        } catch(error) {
          await persist(document.file, offer.id, current => ({...current,lastAttemptAt:new Date().toISOString(),error:String(error.message).slice(0,400)}));
          throw error;
        }
      }});
    }
    const providerResults = await refreshCommerceTasks(tasks);
    searchLog({action:'commerce-check:'+slug,provider:'commerce',status:providerResults.some(r=>r.ok)?'success':'error',message:JSON.stringify(providerResults.map(({id,ok,error,value})=>({id,ok,error,value}))) });
    return resultFromDocument(await find(slug), {providerResults,
      ok:providerResults.some(r=>r.ok), error:providerResults.length ? providerResults.filter(r=>!r.ok).map(r=>`${r.id}: ${r.error}`).join(' · ') : 'Keine automatische Quelle konfiguriert.'});
  });
}

export async function checkAllProductPrices({ limit = Number.MAX_SAFE_INTEGER, includeInactive = false } = {}, {listDocuments = listPriceDocuments, check = checkProductPrice} = {}) {
  const documents = await listDocuments();
  const candidates = documents.filter((document) => {
    const state=deriveProductOperations(document.data);
    if(!includeInactive&&(state.archived||state.consciouslyUnavailable))return false;
    if (document.data.offers?.length) return true;
    if (!allowsAutomaticPriceCheck(document.data)) return false;
    if (includeInactive) return true;
    const operations = deriveProductOperations(document.data);
    if (resolveCommerceOffers(document.data).some(offer => offer.amazonLink && offer.canLink)) {
      return document.data.maintenanceStatus !== 'archived' && document.data.recommendationStatus !== 'archived';
    }
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
      price: {...offer.price, current, currency, checkedAt:current!=null?now:undefined,
        source:{id:'cockpit-manual',label:affiliatePrograms[offer.program]?.label || offer.merchant,type:'manual'}},
      priceState:current == null ? 'unknown' : 'available', availability, availabilityUpdated: availability!==offer.availability||input.confirmAvailability===true ? (availability!=='unknown'?now:undefined) : offer.availabilityUpdated, error:undefined
    }),{expectedHash:input.expectedHash});
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
      expectedHash:input.expectedHash,
      priceState,
      availability,
      availabilityReason,
      availabilityUpdated: availability&&availability!==deriveProductOperations(data).availability ? now : data.availabilityUpdated,
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
  const unchangedPrice=current===Number(data.price?.current)&&String(input.currency||'EUR')===String(data.price?.currency||'EUR')&&!input.confirmPrice;
  if(unchangedPrice){const patch={sourceLabel,comparisonText,expectedHash:input.expectedHash,...(manufacturer?{manufacturer}:{})};if(targetUrlProvided)patch.affiliateUrl=targetUrl;if(availability&&availability!==deriveProductOperations(data).availability){patch.availability=availability;patch.availabilityReason=availabilityReason}return resultFromDocument(await updateProductOperations(document.file,patch),{method:'manual-metadata'})}
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
      expectedHash:input.expectedHash,
      affiliateUrl: targetUrl,
      syncAffiliateUrl: targetUrlProvided || Boolean(targetUrl),
      removeAffiliate: targetUrlProvided && !targetUrl,
      now,
      operations: {
        priceState,
        availability:availability!==deriveProductOperations(data).availability?availability:undefined,
        availabilityReason,
        availabilityUpdated: availability&&availability!==deriveProductOperations(data).availability ? now : data.availabilityUpdated
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

export async function updateProductOperationsState(input = {}, {find=findDocument}={}) {
  const slug = validateSlug(input.slug);
  const document = await find(slug);
  const patch = { now: new Date().toISOString(),expectedHash:input.expectedHash };

  if (input.availability !== undefined) {
    if (!AVAILABILITY_VALUES.includes(input.availability)) throw new Error("Unbekannter Verfügbarkeitsstatus.");
    patch.availability = input.availability;
    patch.availabilityReason = String(input.availabilityReason || "").trim().slice(0, 500);
  }
  if (input.priceState !== undefined) {
    if (!PRICE_STATE_VALUES.includes(input.priceState)) throw new Error("Unbekannter Preisstatus.");
    patch.priceState = input.priceState;
  }
  for(const [key,values] of [['maintenancePriority',['high','normal','low']],['recommendationOverride',['auto','limited']]])if(input[key]!==undefined){if(!values.includes(input[key]))throw new Error('Ungültige Pflegeeinstellung.');patch[key]=input[key]}
  if (input.archive !== undefined) patch.archive = Boolean(input.archive);

  const persisted = await updateProductOperations(document.file, patch);
  return resultFromDocument(persisted, { method: "operations-update" });
}

export async function priceAudit() {
  const attempts=new Map();if(fs.existsSync(commerceAuditPath))for(const line of fs.readFileSync(commerceAuditPath,'utf8').split('\n')){try{const e=JSON.parse(line);if(e.action?.startsWith('commerce-check:'))attempts.set(e.action.slice(15),{lastCommerceAttemptAt:e.timestamp,lastCommerceAttemptStatus:e.status,lastCommerceAttemptMessage:e.message})}catch{}}
  const documents = await listPriceDocuments();
  const products = documents
    .map(({ data, source }) => ({...attempts.get(data.slug),sourceHash:createHash('sha256').update(source).digest('hex'),...toOperationsRecord(data), commerceOffers: resolveCommerceOffers(data)}))
    .map((record) => ({ ...record, operations: record }))
    .sort(compareMaintenanceRows)
    .map(({ operations: _operations, ...record }) => record);

  const rowsForDashboard = products.map((record) => ({ operations: record }));
  const dashboard = buildOperationsDashboard(rowsForDashboard);

  return {
    generatedAt: new Date().toISOString(),
    administration:{writable:true,isolatedFixtureMode:Boolean(process.env.PFOTENTECHNIK_PRODUCT_FIXTURES)},
    summary: {
      ...dashboard,
      amazonLinks: products.filter(p => p.amazonLinkPresent).length,
      amazonMissingSourceTag: products.filter(p => p.amazonMissingSourceTag).length,
      amazonInvalidLink: products.filter(p => p.amazonInvalidLink).length,
      amazonCtaSuppressed: products.filter(p => p.amazonCtaSuppressed).length,
      noMerchantOption: products.filter(p => p.noMerchantOption).length
    },
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
      availabilityUpdated:sameIdentity ? current.availabilityUpdated:undefined,
      verifiedAt:sameIdentity?current.verifiedAt:undefined,evidenceSources:sameIdentity?current.evidenceSources:[],error:undefined};
    if (verifiedSnapshot) Object.assign(next, {mappingStatus:'verified',verifiedAt:verifiedSnapshot.lastAttemptAt,lastAttemptAt:verifiedSnapshot.lastAttemptAt,price:verifiedSnapshot.price,priceState:verifiedSnapshot.priceState,availability:verifiedSnapshot.availability,availabilityUpdated:verifiedSnapshot.availabilityUpdated,
      identityNote:'Modell und Variante im Cockpit redaktionell bestätigt; SKU und Preisquelle serverseitig geprüft.',
      evidenceSources:[{source:program.label,url:destination,accessedAt:verifiedSnapshot.lastAttemptAt,assertion:'Modell-/Generationszuordnung redaktionell bestätigt; exakte SKU in offizieller Variante geprüft.',fields:['officialProductUrl','variantId','expectedSku'],sourceType:'officialStore'}]});
    return productOfferSchema.parse(next);
  });
  return resultFromDocument(persisted);
}

// Link maintenance is independent of a price confirmation. It never stamps a
// price/stock check, and it uses the existing offers array and atomic writer.
export async function setProductCommerceLink(input={}, {find=findDocument}={}){
 const document=await find(validateSlug(input.slug));
 if(input.id==='legacy'){
  if(input.action!=='remove')throw new Error('Den bisherigen Hauptlink im Produktformular bearbeiten.');
  return resultFromDocument(await updateProductOperations(document.file,{affiliateUrl:undefined,expectedHash:input.expectedHash}));
 }
 const id=String(input.id||'').trim();if(!/^[a-z0-9][a-z0-9-]*$/.test(id))throw new Error('Ungültige Händlerkennung.');
 const existing=document.data.offers?.find(o=>o.id===id);
 if(input.action==='add'&&existing)throw new Error('Diese Händlerkennung ist bereits vergeben.');
 if(input.action!=='add'&&!existing)throw new Error('Händlerangebot nicht gefunden.');
 if(input.action==='remove')return resultFromDocument(await updateProductOffer(document.file,id,null,{expectedHash:input.expectedHash}));
 const network=String(input.network||'none');if(!['partnernet','awin','adcell','none'].includes(network))throw new Error('Unbekanntes Affiliate-Netzwerk.');
 const merchant=String(input.merchant||'').trim();if(!merchant||merchant.length>100)throw new Error('Anbietername fehlt oder ist zu lang.');
 const officialProductUrl=httpsDestination(input.officialProductUrl);if(!officialProductUrl)throw new Error('Eine gültige direkte HTTPS-Produkt-URL ist erforderlich.');
 const affiliateUrl=input.affiliateUrl?httpsDestination(input.affiliateUrl):null;if(input.affiliateUrl&&!affiliateUrl)throw new Error('Ungültige HTTPS-Affiliate-URL.');
 if(network!=='none'&&!affiliateUrl&&!input.program)throw new Error('Affiliate-URL oder konfiguriertes Programm fehlt.');
 const program=input.program?affiliatePrograms[input.program]:null;if(input.program&&!program)throw new Error('Unbekanntes Affiliate-Programm.');
 if(program&&!program.hosts.includes(new URL(officialProductUrl).hostname))throw new Error('Produkt-URL gehört nicht zum gewählten Programm.');
 const same=existing&&existing.officialProductUrl===officialProductUrl&&(existing.variantId||'')===String(input.variantId||'').trim()&&existing.program===(input.program||undefined)&&existing.network===network&&existing.merchant===merchant;
 const confirmed=input.confirmIdentity===true;
 if(!same&&!confirmed)throw new Error('Bitte Modell und Produktvariante vor dem Aktivieren bestätigen.');
 const now=new Date().toISOString();
 const persisted=await updateProductOffer(document.file,id,current=>productOfferSchema.parse({
  ...(current||{}),id,merchant,network,program:input.program||undefined,officialProductUrl,
  affiliate:{provider:affiliateUrl?merchant:'official',url:affiliateUrl||officialProductUrl,label:merchant,rel:affiliateUrl?'sponsored nofollow noopener':'nofollow noopener',target:'_blank'},
  variantId:String(input.variantId||'').trim()||undefined,
  mappingStatus:'verified',verifiedAt:same?current.verifiedAt:now,
  commerceDataProvider:same?current.commerceDataProvider:'manual',
  identityNote:'Produkt und Variante im lokalen Cockpit redaktionell bestätigt.',
  price:same?current.price:{current:null,currency:'EUR',status:'unknown'},priceState:same?current.priceState:'unknown',
  availability:same?current.availability:'unknown',availabilityUpdated:same?current.availabilityUpdated:undefined,
  evidenceSources:same?current.evidenceSources:[{source:merchant,url:officialProductUrl,accessedAt:now,assertion:'Modell und Variante redaktionell bestätigt. Keine Preis- oder Lieferbestätigung.',fields:['officialProductUrl','variantId'],sourceType:'officialStore'}]
 }),{expectedHash:input.expectedHash});
 searchLog({provider:'commerce',action:'commerce-link:'+input.slug,status:'success',message:input.action+':'+id});
 return resultFromDocument(persisted,{method:'commerce-link'});
}
