import dns from "node:dns/promises";
import https from "node:https";
import net from "node:net";

const isUnsafeIpv4 = (address) => {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
};

const mappedIpv4 = (address) => {
  const match = address.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return match?.[1] ?? null;
};

export const isUnsafeNetworkAddress = (address) => {
  if (!address) return true;
  if (net.isIPv4(address)) return isUnsafeIpv4(address);
  if (!net.isIPv6(address)) return true;
  const value = address.toLowerCase();
  const mapped = mappedIpv4(value);
  if (mapped) return isUnsafeIpv4(mapped);
  return (
    value === "::" ||
    value === "::1" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    /^fe[89ab]/.test(value) ||
    value.startsWith("ff")
  );
};

const resolveTarget = async (input, label = "Quell-URL") => {
  let url;
  try {
    url = new URL(String(input));
  } catch {
    throw new Error(`Ungültige ${label}.`);
  }
  if (url.protocol !== "https:") throw new Error(`Nur HTTPS-${label === "Quell-URL" ? "Quellen" : "Ziele"} sind erlaubt.`);
  if (url.username || url.password) throw new Error("URLs mit Zugangsdaten sind nicht erlaubt.");
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) throw new Error("Lokale Ziele sind nicht erlaubt.");
  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  const publicRecords = records.filter(({ address }) => !isUnsafeNetworkAddress(address));
  if (!records.length || publicRecords.length !== records.length) {
    throw new Error("Die URL verweist nicht ausschließlich auf öffentliche Netzwerkziele.");
  }
  return { url, records: publicRecords };
};

const pinnedLookup = (records) => {
  let cursor = 0;
  return (_hostname, options, callback) => {
    const record = records[cursor % records.length];
    cursor += 1;
    if (options?.all) callback(null, records.map(({ address, family }) => ({ address, family })));
    else callback(null, record.address, record.family);
  };
};

const readLimitedBody = (response, maxBytes, controller) => new Promise((resolve, reject) => {
  const chunks = [];
  let bytes = 0;
  response.on("data", (chunk) => {
    bytes += chunk.length;
    if (bytes > maxBytes) {
      controller.destroy(new Error("Quelldatei überschreitet das Größenlimit."));
      return;
    }
    chunks.push(chunk);
  });
  response.on("end", () => resolve(Buffer.concat(chunks, bytes)));
  response.on("error", reject);
});

const requestOnce = async (resolved, { accept, maxBytes, timeoutMs, userAgent }) => new Promise((resolve, reject) => {
  const contentLengthLimit = Number(maxBytes);
  let settled = false;
  let deadline;
  const finish = (callback, value) => {
    if (settled) return;
    settled = true;
    if (deadline) clearTimeout(deadline);
    callback(value);
  };
  const request = https.request(resolved.url, {
    method: "GET",
    agent: false,
    lookup: pinnedLookup(resolved.records),
    servername: resolved.url.hostname,
    headers: {
      accept,
      "accept-encoding": "identity",
      "user-agent": userAgent
    }
  }, async (response) => {
    try {
      const length = Number(response.headers["content-length"] || 0);
      if (length > contentLengthLimit) throw new Error("Quelldatei überschreitet das Größenlimit.");
      const buffer = await readLimitedBody(response, contentLengthLimit, request);
      finish(resolve, {
        status: response.statusCode || 0,
        headers: response.headers,
        buffer
      });
    } catch (error) {
      request.destroy();
      finish(reject, error);
    }
  });
  deadline = setTimeout(() => request.destroy(new Error("Zeitlimit beim Abruf überschritten.")), timeoutMs);
  request.setTimeout(timeoutMs, () => request.destroy(new Error("Zeitlimit beim Abruf überschritten.")));
  request.on("error", (error) => finish(reject, error));
  request.end();
});

const header = (headers, name) => {
  const value = headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : String(value || "");
};

export async function fetchPublicResource(input, options = {}) {
  const maxRedirects = Math.max(0, Number(options.maxRedirects ?? 5));
  const maxBytes = Math.max(1, Number(options.maxBytes ?? 2_500_000));
  const timeoutMs = Math.max(1_000, Number(options.timeoutMs ?? 15_000));
  const accept = String(options.accept || "*/*");
  const userAgent = String(options.userAgent || "Mozilla/5.0 (compatible; PfotenTechnikOperations/2.0; +https://pfotentechnik.de)");
  let resolved = await resolveTarget(input, options.label || "Quell-URL");

  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    const result = await requestOnce(resolved, { accept, maxBytes, timeoutMs, userAgent });
    if ([301, 302, 303, 307, 308].includes(result.status)) {
      const location = header(result.headers, "location");
      if (!location) throw new Error(`Weiterleitung ohne Ziel (${result.status}).`);
      resolved = await resolveTarget(new URL(location, resolved.url).href, options.label || "Quell-URL");
      continue;
    }
    if (result.status < 200 || result.status >= 300) throw new Error(`Quelle antwortet mit HTTP ${result.status}.`);
    return {
      ...result,
      contentType: header(result.headers, "content-type"),
      resolvedUrl: resolved.url.href
    };
  }
  throw new Error("Zu viele Weiterleitungen.");
}
