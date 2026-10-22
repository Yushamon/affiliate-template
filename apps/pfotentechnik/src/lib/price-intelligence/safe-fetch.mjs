import { fetchPublicResource } from "../admin/public-fetch.mjs";

export async function safeFetchText(input, options = {}, { fetchResource = fetchPublicResource } = {}) {
  const result = await fetchResource(input, {
    label: "Händler-URL",
    accept: "text/html,application/xhtml+xml",
    maxRedirects: options.maxRedirects ?? 5,
    maxBytes: options.maxBytes ?? 2_500_000,
    timeoutMs: options.timeoutMs ?? 15_000
  });
  const html = result.buffer.toString("utf8");
  const untypedHtml = !result.contentType && /^\s*(?:<!doctype\s+html\b[^>]*>\s*)?<html\b/i.test(html);
  if (!/text\/html|application\/xhtml\+xml/i.test(result.contentType) && !untypedHtml) {
    throw new Error("Händlerseite liefert kein HTML.");
  }
  return {
    html,
    resolvedUrl: result.resolvedUrl,
    status: result.status
  };
}
