import { fetchPublicResource } from "../admin/public-fetch.mjs";

export async function fetchHtml(input) {
  const result = await fetchPublicResource(input, {
    label: "Quell-URL",
    accept: "text/html,application/xhtml+xml",
    maxBytes: 4_000_000,
    timeoutMs: 18_000,
    maxRedirects: 5,
    userAgent: "Mozilla/5.0 (compatible; PfotenTechnikMediaCenter/2.0; +https://pfotentechnik.de)"
  });
  if (!/html|xhtml/i.test(result.contentType)) throw new Error("Die Quelle liefert kein HTML.");
  return { ...result, html: result.buffer.toString("utf8") };
}

export async function fetchImage(input) {
  const result = await fetchPublicResource(input, {
    label: "Bild-URL",
    accept: "image/avif,image/webp,image/png,image/jpeg,image/*",
    maxBytes: 15_000_000,
    timeoutMs: 18_000,
    maxRedirects: 5,
    userAgent: "Mozilla/5.0 (compatible; PfotenTechnikMediaCenter/2.0; +https://pfotentechnik.de)"
  });
  if (!result.contentType.startsWith("image/")) throw new Error("Die Bildquelle liefert keine Bilddatei.");
  return result;
}
