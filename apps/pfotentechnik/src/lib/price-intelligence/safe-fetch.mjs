import { fetchPublicResource } from "../admin/public-fetch.mjs";

export async function safeFetchText(input, options = {}, { fetchResource = fetchPublicResource } = {}) {
  // Amazon's exact-model buybox pages can exceed 2.5 MB before their purchase form.
  // Keep a finite merchant-specific cap; redirects and public-address checks stay unchanged.
  let amazon = false;
  try { amazon = /^(?:www\.)?amazon\.de$|^amzn\.to$|^link\.amazon$/.test(new URL(input).hostname); } catch { /* fetchResource validates the URL */ }
  const result = await fetchResource(input, {
    label: "Händler-URL",
    accept: "text/html,application/xhtml+xml",
    maxRedirects: options.maxRedirects ?? 5,
    maxBytes: options.maxBytes ?? (amazon ? 5_000_000 : 2_500_000),
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
