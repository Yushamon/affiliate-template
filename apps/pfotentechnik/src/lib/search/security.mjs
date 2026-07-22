import { SearchError } from "./errors.mjs";

export function createOriginPolicy(envValue = process.env.SEARCH_ADMIN_ORIGINS) {
  const defaults = [];
  for (let port = 4321; port <= 4325; port += 1) {
    defaults.push(`http://127.0.0.1:${port}`, `http://localhost:${port}`);
  }
  const configured = String(envValue || "").split(",").map((value) => value.trim()).filter(Boolean);
  const allowed = new Set(configured.length ? configured : defaults);
  return {
    allowed: [...allowed],
    permits(origin) { return !origin || allowed.has(origin); },
    assert(origin) { if (!this.permits(origin)) throw new SearchError("SEARCH_ACTION_NOT_ALLOWED", { message: "Der Browser-Origin ist für den lokalen Admin-Service nicht freigegeben." }); },
  };
}

export function assertJsonRequest(request) {
  const type = String(request.headers["content-type"] || "").split(";", 1)[0].trim().toLowerCase();
  if (type !== "application/json") throw new SearchError("SEARCH_ACTION_NOT_ALLOWED", { message: "Admin-Aktionen akzeptieren ausschließlich application/json." });
}

export function readJsonBody(request, limit = 4096) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > limit) {
        reject(new SearchError("SEARCH_ACTION_NOT_ALLOWED", { message: "Admin-Anfrage ist zu groß." }));
        request.destroy();
      }
    });
    request.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (cause) { reject(new SearchError("SEARCH_INVALID_DATA", { message: "Ungültiger JSON-Request.", cause })); }
    });
    request.on("error", reject);
  });
}
