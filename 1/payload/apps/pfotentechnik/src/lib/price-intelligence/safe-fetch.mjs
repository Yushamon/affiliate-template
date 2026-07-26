import { fetchPublicResource } from "../admin/public-fetch.mjs";

export async function safeFetchText(input, options = {}) {
  const result = await fetchPublicResource(input, {
    label: "Händler-URL",
    accept: "text/html,application/xhtml+xml",
    maxRedirects: options.maxRedirects ?? 5,
    maxBytes: options.maxBytes ?? 2_500_000,
    timeoutMs: options.timeoutMs ?? 15_000,
    userAgent: "Mozilla/5.0 (compatible; PfotenTechnikPriceBot/1.0; +https://pfotentechnik.de)"
  });
  if (!/text\/html|application\/xhtml\+xml/i.test(result.contentType)) {
    throw new Error("Händlerseite liefert kein HTML.");
  }
  return {
    html: result.buffer.toString("utf8"),
    resolvedUrl: result.resolvedUrl,
    status: result.status
  };
}
