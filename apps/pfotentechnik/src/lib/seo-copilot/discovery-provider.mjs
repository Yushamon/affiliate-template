import { isIP } from "node:net";
import { SearchError } from "../search/errors.mjs";

const endpoint = () => process.env.SEO_COPILOT_DISCOVERY_ENDPOINT || "";
const apiKey = () => process.env.SEO_COPILOT_DISCOVERY_API_KEY || "";
const MAX_RESPONSE_BYTES = 1_000_000;

export function discoveryProviderStatus() {
  let configured = false;
  let host;
  try {
    const url = new URL(endpoint());
    host = url.hostname;
    configured =
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !isIP(url.hostname) &&
      !/(^|\.)localhost$|(^|\.)local$|(^|\.)internal$/i.test(url.hostname);
  } catch {}
  return {
    configured,
    provider: configured ? host : undefined,
    mode: configured ? "server-side-validated-provider" : "research-prompt-only",
  };
}

export async function discoverProductsWithProvider(payload, { fetchImpl = fetch, signal } = {}) {
  const status = discoveryProviderStatus();
  if (!status.configured) {
    throw new SearchError("SEARCH_CONFIG_MISSING", {
      message: "Kein sicherer Produktentdeckungs-Provider konfiguriert.",
      nextAction: "SEO_COPILOT_DISCOVERY_ENDPOINT als feste HTTPS-Provider-URL serverseitig konfigurieren.",
    });
  }
  const url = new URL(endpoint());
  const response = await fetchImpl(url, {
    method: "POST",
    redirect: "error",
    signal,
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      ...(apiKey() ? { authorization: `Bearer ${apiKey()}` } : {}),
    },
    body: JSON.stringify({
      category: payload.category,
      targetAnimal: payload.targetAnimal,
      targetSize: payload.targetSize,
      existingManufacturers: Boolean(payload.includeExistingManufacturers),
      onlyNewManufacturers: Boolean(payload.onlyNewManufacturers),
      onlyNewProducts: payload.onlyNewProducts !== false,
      minimumValidationScore: Number(payload.minimumValidationScore) || 60,
      market: payload.market || "DE",
      availability: payload.availability || "DE",
      maxResults: Math.min(50, Math.max(1, Number(payload.maxResults) || 20)),
    }),
  });
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_RESPONSE_BYTES) throw new SearchError("SEARCH_INVALID_DATA", { message: "Provider-Antwort ist zu groß." });
  const text = await response.text();
  if (Buffer.byteLength(text) > MAX_RESPONSE_BYTES) throw new SearchError("SEARCH_INVALID_DATA", { message: "Provider-Antwort ist zu groß." });
  if (!response.ok) throw new SearchError("SEARCH_API_UNAVAILABLE", { message: `Produktentdeckungs-Provider antwortet mit HTTP ${response.status}.` });
  let body;
  try { body = JSON.parse(text); }
  catch (cause) { throw new SearchError("SEARCH_INVALID_DATA", { message: "Provider lieferte kein valides JSON.", cause }); }
  if (!Array.isArray(body?.candidates)) throw new SearchError("SEARCH_INVALID_DATA", { message: "Provider-Antwort enthält keine Kandidatenliste." });
  return { provider: status.provider, candidates: body.candidates.slice(0, 50) };
}
