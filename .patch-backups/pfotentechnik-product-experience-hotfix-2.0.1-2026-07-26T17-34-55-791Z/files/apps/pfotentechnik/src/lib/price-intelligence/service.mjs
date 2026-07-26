import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractOfferFromHtml } from "./extract-offer.mjs";
import { readProductDocument, readProductFiles, updateProductPrice } from "./frontmatter-price.mjs";
import { safeFetchText } from "./safe-fetch.mjs";

const appRoot = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const productsDir = path.join(appRoot, "src", "content", "products");

const hostnameLabel = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "Händler"; }
};

export async function listPriceDocuments() {
  const files = await readProductFiles(productsDir);
  return Promise.all(files.map(readProductDocument));
}

async function checkDocumentPrice(document) {
  const data = document.data ?? {};
  const targetUrl = data.price?.affiliateUrl || data.affiliate?.url || data.productUrl;
  if (!targetUrl) throw new Error("Für dieses Produkt ist keine Händler-URL hinterlegt.");
  const fetched = await safeFetchText(targetUrl);
  const offer = extractOfferFromHtml(fetched.html, fetched.resolvedUrl);
  if (!offer) throw new Error("Auf der Händlerseite wurde kein belastbarer strukturierter Preis gefunden.");
  const checkedAt = new Date().toISOString();
  const sourceLabel = hostnameLabel(fetched.resolvedUrl);
  await updateProductPrice(document.file, {
    current: offer.current,
    currency: offer.currency || "EUR",
    status: "unknown",
    comparisonText: data.price?.comparisonText,
    checkedAt,
    affiliateUrl: targetUrl,
    source: { id: sourceLabel, label: sourceLabel, type: "merchant", url: fetched.resolvedUrl }
  });
  return { slug: document.slug, title: data.title, current: offer.current, currency: offer.currency || "EUR", checkedAt, method: offer.method, source: sourceLabel };
}

export async function checkProductPrice(slug) {
  const documents = await listPriceDocuments();
  const document = documents.find((item) => item.slug === slug);
  if (!document) throw new Error(`Produkt "${slug}" wurde nicht gefunden.`);
  return checkDocumentPrice(document);
}

export async function checkAllProductPrices({ limit = 100 } = {}) {
  const documents = await listPriceDocuments();
  const safeLimit = Math.min(documents.length, Math.max(1, Number(limit) || 100));
  const results = [];
  for (const document of documents.slice(0, safeLimit)) {
    try { results.push({ ok: true, ...(await checkDocumentPrice(document)) }); }
    catch (error) { results.push({ ok: false, slug: document.slug, title: document.data?.title, error: error instanceof Error ? error.message : String(error) }); }
  }
  return { checkedAt: new Date().toISOString(), total: results.length, succeeded: results.filter((item) => item.ok).length, failed: results.filter((item) => !item.ok).length, results };
}

export async function priceAudit() {
  const documents = await listPriceDocuments();
  const now = Date.now();
  const rows = documents.map(({ slug, data }) => {
    const current = Number(data.price?.current);
    const checkedAt = data.price?.checkedAt ? Date.parse(String(data.price.checkedAt)) : NaN;
    const ageDays = Number.isFinite(checkedAt) ? Math.max(0, Math.floor((now - checkedAt) / 86_400_000)) : null;
    return {
      slug,
      title: data.title,
      category: data.category?.key ?? data.category?.label ?? "unbekannt",
      current: Number.isFinite(current) && current > 0 ? current : null,
      currency: data.price?.currency ?? "EUR",
      checkedAt: data.price?.checkedAt ?? null,
      ageDays,
      stale: ageDays == null || ageDays > 14,
      affiliateUrl: data.price?.affiliateUrl ?? data.affiliate?.url ?? null
    };
  });
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      products: rows.length,
      withPrice: rows.filter((row) => row.current != null).length,
      missingPrice: rows.filter((row) => row.current == null).length,
      stale: rows.filter((row) => row.stale).length,
      withoutUrl: rows.filter((row) => !row.affiliateUrl).length
    },
    products: rows
  };
}
