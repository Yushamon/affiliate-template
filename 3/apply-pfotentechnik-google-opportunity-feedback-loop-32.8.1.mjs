#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const TAG = "[pfotentechnik-google-opportunity-feedback-loop-32.8.1]";
const root = process.cwd();

const routerFile = path.join(root, "apps/pfotentechnik/src/lib/admin/operations-router.mjs");
const cockpitFile = path.join(root, "apps/pfotentechnik/src/pages/admin/seo/cockpit.astro");
const serviceFile = path.join(root, "apps/pfotentechnik/src/lib/seo/opportunity-state.mjs");

const serviceContent = "import fs from \"node:fs\";\nimport path from \"node:path\";\nimport { fileURLToPath } from \"node:url\";\n\nconst APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), \"../../..\");\nconst STATE_FILE = path.join(APP_ROOT, \"reports\", \"seo-recovery\", \"opportunity-state.json\");\n\nconst defaultState = () => ({\n  schemaVersion: 1,\n  updatedAt: \"\",\n  entries: {}\n});\n\nexport const normalizeOpportunityPage = (value) => {\n  const raw = String(value || \"\").trim();\n  if (!raw) throw new Error(\"Opportunity-URL fehlt.\");\n\n  let pathname = raw;\n  try {\n    pathname = new URL(raw, \"https://pfotentechnik.de\").pathname;\n  } catch {}\n\n  pathname = (\"/\" + pathname)\n    .replace(/\\/+/g, \"/\")\n    .replace(/\\/+$/, \"\");\n\n  return pathname ? pathname + \"/\" : \"/\";\n};\n\nconst finite = (value) => {\n  const number = Number(value);\n  return Number.isFinite(number) ? number : 0;\n};\n\nconst normalizeBaseline = (value = {}) => ({\n  clicks: finite(value.clicks),\n  impressions: finite(value.impressions),\n  ctr: finite(value.ctr),\n  position: finite(value.position)\n});\n\nexport function readOpportunityState() {\n  try {\n    if (!fs.existsSync(STATE_FILE)) return defaultState();\n\n    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, \"utf8\"));\n    return {\n      schemaVersion: 1,\n      updatedAt: String(parsed?.updatedAt || \"\"),\n      entries:\n        parsed?.entries && typeof parsed.entries === \"object\"\n          ? parsed.entries\n          : {}\n    };\n  } catch {\n    return defaultState();\n  }\n}\n\nfunction writeOpportunityState(state) {\n  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });\n\n  const next = {\n    schemaVersion: 1,\n    updatedAt: new Date().toISOString(),\n    entries: state.entries || {}\n  };\n\n  const temp = `${STATE_FILE}.tmp-${process.pid}-${Date.now()}`;\n  fs.writeFileSync(temp, JSON.stringify(next, null, 2) + \"\\n\", \"utf8\");\n  fs.renameSync(temp, STATE_FILE);\n\n  return next;\n}\n\nexport function isOpportunityObserving(entry, now = Date.now()) {\n  if (!entry?.observeUntil) return false;\n\n  const until = new Date(entry.observeUntil).getTime();\n  return Number.isFinite(until) && until > now;\n}\n\nexport async function getOpportunityState() {\n  return readOpportunityState();\n}\n\nexport async function markOpportunityOptimized(input = {}) {\n  const page = normalizeOpportunityPage(input.page);\n\n  const rawObserveDays = Number(input.observeDays ?? 21);\n  const observeDays = Math.max(\n    7,\n    Math.min(\n      90,\n      Number.isFinite(rawObserveDays) ? Math.round(rawObserveDays) : 21\n    )\n  );\n\n  const now = new Date();\n  const observeUntil = new Date(now.getTime() + observeDays * 86_400_000);\n  const state = readOpportunityState();\n\n  state.entries[page] = {\n    page,\n    status: \"observing\",\n    optimizedAt: now.toISOString(),\n    observeUntil: observeUntil.toISOString(),\n    observeDays,\n    baseline: normalizeBaseline(input.baseline),\n    note: String(input.note || \"\").trim().slice(0, 500)\n  };\n\n  writeOpportunityState(state);\n\n  return {\n    ok: true,\n    entry: state.entries[page]\n  };\n}\n\nexport async function reopenOpportunity(input = {}) {\n  const page = normalizeOpportunityPage(input.page);\n  const state = readOpportunityState();\n  const existed = Boolean(state.entries[page]);\n\n  delete state.entries[page];\n  writeOpportunityState(state);\n\n  return {\n    ok: true,\n    page,\n    reopened: existed\n  };\n}\n\nexport { STATE_FILE as opportunityStateFile };\n";
const replacements = [
  {
    "label": "Router Import",
    "before": "import {\n  approveMediaJob,",
    "after": "import {\n  getOpportunityState,\n  markOpportunityOptimized,\n  reopenOpportunity\n} from \"../seo/opportunity-state.mjs\";\nimport {\n  approveMediaJob,"
  },
  {
    "label": "Router Endpoints",
    "before": "    if (request.method === \"POST\" && pathname === \"/api/admin/products/operations\") {\n      assertJsonRequest(request);\n      const body = await readJsonBody(request, 32_768);\n      json(response, 200, await updateProductOperationsState(body), origin);\n      return true;\n    }\n\n    if (request.method === \"GET\" && pathname === \"/api/admin/media/audit\") {",
    "after": "    if (request.method === \"POST\" && pathname === \"/api/admin/products/operations\") {\n      assertJsonRequest(request);\n      const body = await readJsonBody(request, 32_768);\n      json(response, 200, await updateProductOperationsState(body), origin);\n      return true;\n    }\n\n    if (request.method === \"GET\" && pathname === \"/api/admin/seo/opportunities/state\") {\n      json(response, 200, await getOpportunityState(), origin);\n      return true;\n    }\n    if (request.method === \"POST\" && pathname === \"/api/admin/seo/opportunities/mark\") {\n      assertJsonRequest(request);\n      const body = await readJsonBody(request, 32_768);\n      json(response, 200, await markOpportunityOptimized(body), origin);\n      return true;\n    }\n    if (request.method === \"POST\" && pathname === \"/api/admin/seo/opportunities/reopen\") {\n      assertJsonRequest(request);\n      const body = await readJsonBody(request, 32_768);\n      json(response, 200, await reopenOpportunity(body), origin);\n      return true;\n    }\n\n    if (request.method === \"GET\" && pathname === \"/api/admin/media/audit\") {"
  },
  {
    "label": "Cockpit State Import",
    "before": "import { loadSeoRecovery } from \"../../../lib/seo/loadRecovery\";\n\nconst payload = loadSeoDashboard();\nconst recovery = loadSeoRecovery();",
    "after": "import { loadSeoRecovery } from \"../../../lib/seo/loadRecovery\";\nimport { isOpportunityObserving, readOpportunityState } from \"../../../lib/seo/opportunity-state.mjs\";\n\nconst payload = loadSeoDashboard();\nconst recovery = loadSeoRecovery();\nconst opportunityState = readOpportunityState();\nconst opportunityNow = Date.now();\nconst observingEntries = Object.values(opportunityState.entries || {})\n  .filter((entry: any) => isOpportunityObserving(entry, opportunityNow))\n  .sort((a: any, b: any) => new Date(b.optimizedAt).getTime() - new Date(a.optimizedAt).getTime());\nconst observingPages = new Set(observingEntries.map((entry: any) => entry.page));"
  },
  {
    "label": "Cockpit Opportunity Filter",
    "before": "const recoveryOpportunityRows = recovery.opportunities.slice(0, 15);",
    "after": "const recoveryOpportunityRows = recovery.opportunities\n  .filter((row) => !observingPages.has(row.page))\n  .slice(0, 15);\nconst activeOpportunityCount = recovery.opportunities.filter((row) => !observingPages.has(row.page)).length;\nconst recoveryOpportunityMap = new Map(recovery.opportunities.map((row) => [row.page, row]));\nconst recoveryObservingRows = observingEntries.slice(0, 20).map((entry: any) => ({\n  entry,\n  current: recoveryOpportunityMap.get(entry.page),\n}));"
  },
  {
    "label": "Opportunity Metric",
    "before": "            <span>Opportunities</span>\n            <strong>{recovery.summary.opportunities}</strong>\n            <span>Google-only, 28 Tage + 3 Monate Kontext</span>",
    "after": "            <span>Opportunities</span>\n            <strong>{activeOpportunityCount}</strong>\n            <span>{observingEntries.length} in Beobachtung · Google-only</span>"
  },
  {
    "label": "Opportunity Tabellenkopf",
    "before": "<tr><th>Seite</th><th>Signal</th><th>Nächster Hebel</th></tr>",
    "after": "<tr><th>Seite</th><th>Signal</th><th>Nächster Hebel</th><th>Aktion</th></tr>"
  },
  {
    "label": "Opportunity CTA",
    "before": "                    <td>{row.action}</td>\n                  </tr>\n                )) : (\n                  <tr><td colspan=\"3\">Noch keine belastbaren GSC-Opportunities vorhanden.</td></tr>",
    "after": "                    <td>{row.action}</td>\n                    <td>\n                      <button\n                        type=\"button\"\n                        class=\"pt-button seo-button\"\n                        data-opportunity-mark\n                        data-page={row.page}\n                        data-clicks={row.metrics.clicks}\n                        data-impressions={row.metrics.impressions}\n                        data-ctr={row.metrics.ctr}\n                        data-position={row.metrics.position}\n                      >\n                        Bearbeitet\n                      </button>\n                    </td>\n                  </tr>\n                )) : (\n                  <tr><td colspan=\"4\">Keine aktive Opportunity. Bearbeitete Seiten können unten beobachtet werden.</td></tr>"
  },
  {
    "label": "Beobachtungsbereich",
    "before": "    )}\n\n    <script type=\"application/json\" data-search-json set:html={serializedPayload}></script>",
    "after": "    )}\n\n    {recovery.available && (\n      <section class=\"seo-panel seo-stack\" data-opportunity-watch>\n        <div class=\"seo-section-header\">\n          <div>\n            <span class=\"seo-eyebrow\">Nach Optimierung</span>\n            <h2>Optimierungen beobachten</h2>\n          </div>\n          <span class=\"seo-muted\">Standard: 21 Tage Cooldown</span>\n        </div>\n        <div class=\"seo-table-wrap\">\n          <table class=\"seo-table\">\n            <thead>\n              <tr><th>Seite</th><th>Bearbeitet</th><th>Baseline</th><th>Aktuelles Signal</th><th>Aktion</th></tr>\n            </thead>\n            <tbody>\n              {recoveryObservingRows.length ? recoveryObservingRows.map(({ entry, current }: any) => (\n                <tr>\n                  <td><code>{entry.page}</code></td>\n                  <td>\n                    {new Date(entry.optimizedAt).toLocaleDateString(\"de-DE\")}<br />\n                    <span class=\"seo-muted\">bis {new Date(entry.observeUntil).toLocaleDateString(\"de-DE\")}</span>\n                  </td>\n                  <td>\n                    {entry.baseline?.impressions ?? 0} Impr. · Pos. {Number(entry.baseline?.position || 0).toFixed(1)}\n                  </td>\n                  <td>\n                    {current\n                      ? `${current.metrics.impressions} Impr. · Pos. ${current.metrics.position.toFixed(1)}`\n                      : \"aktuell keine Opportunity\"}\n                  </td>\n                  <td>\n                    <button\n                      type=\"button\"\n                      class=\"pt-button seo-button\"\n                      data-opportunity-reopen\n                      data-page={entry.page}\n                    >\n                      Wieder öffnen\n                    </button>\n                  </td>\n                </tr>\n              )) : (\n                <tr><td colspan=\"5\">Noch keine Optimierung in Beobachtung.</td></tr>\n              )}\n            </tbody>\n          </table>\n        </div>\n      </section>\n    )}\n\n    <script type=\"application/json\" data-search-json set:html={serializedPayload}></script>"
  },
  {
    "label": "Cockpit Client Actions",
    "before": "    root.querySelectorAll<HTMLButtonElement>(\"[data-range]\").forEach((button) => {\n      button.addEventListener(\"click\", () => render(button.dataset.range || \"\"));\n    });\n\n    const saved = localStorage.getItem(\"seo-cockpit-range\");",
    "after": "    root.querySelectorAll<HTMLButtonElement>(\"[data-range]\").forEach((button) => {\n      button.addEventListener(\"click\", () => render(button.dataset.range || \"\"));\n    });\n\n    const postJson = async (url: string, body: Record<string, unknown>) => {\n      const response = await fetch(url, {\n        method: \"POST\",\n        headers: {\n          \"content-type\": \"application/json\",\n          \"accept\": \"application/json\",\n        },\n        body: JSON.stringify(body),\n      });\n      const result = await response.json().catch(() => ({}));\n      if (!response.ok) {\n        throw new Error(result?.error?.message || `HTTP ${response.status}`);\n      }\n      return result;\n    };\n\n    root.querySelectorAll<HTMLButtonElement>(\"[data-opportunity-mark]\").forEach((button) => {\n      button.addEventListener(\"click\", async () => {\n        const page = button.dataset.page || \"\";\n        const originalLabel = button.textContent || \"Bearbeitet\";\n        button.disabled = true;\n        button.textContent = \"Speichere…\";\n\n        try {\n          await postJson(\"/api/admin/seo/opportunities/mark\", {\n            page,\n            observeDays: 21,\n            baseline: {\n              clicks: Number(button.dataset.clicks || 0),\n              impressions: Number(button.dataset.impressions || 0),\n              ctr: Number(button.dataset.ctr || 0),\n              position: Number(button.dataset.position || 0),\n            },\n          });\n          window.location.reload();\n        } catch (error) {\n          button.disabled = false;\n          button.textContent = originalLabel;\n          window.alert(error instanceof Error ? error.message : String(error));\n        }\n      });\n    });\n\n    root.querySelectorAll<HTMLButtonElement>(\"[data-opportunity-reopen]\").forEach((button) => {\n      button.addEventListener(\"click\", async () => {\n        const page = button.dataset.page || \"\";\n        const originalLabel = button.textContent || \"Wieder öffnen\";\n        button.disabled = true;\n        button.textContent = \"Öffne…\";\n\n        try {\n          await postJson(\"/api/admin/seo/opportunities/reopen\", { page });\n          window.location.reload();\n        } catch (error) {\n          button.disabled = false;\n          button.textContent = originalLabel;\n          window.alert(error instanceof Error ? error.message : String(error));\n        }\n      });\n    });\n\n    const saved = localStorage.getItem(\"seo-cockpit-range\");"
  }
];

function fail(message) {
  console.error(`${TAG} FEHLER: ${message}`);
  process.exit(1);
}

function log(message) {
  console.log(`${TAG} ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) fail(`Datei fehlt: ${path.relative(root, file)}`);
  return fs.readFileSync(file, "utf8");
}

function atomicWrite(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temp, content, "utf8");
  fs.renameSync(temp, file);
}

function replaceOnce(source, item) {
  if (source.includes(item.after)) {
    log(`${item.label}: bereits aktuell.`);
    return source;
  }

  const count = source.split(item.before).length - 1;
  if (count !== 1) {
    fail(`${item.label}: Ausgangsmuster kommt ${count}× vor.`);
  }

  log(`${item.label}: aktualisiert.`);
  return source.replace(item.before, item.after);
}

// Keine Teilinstallation: erst alle Zieltexte im Speicher vorbereiten.
let router = read(routerFile);
let cockpit = read(cockpitFile);

for (const item of replacements.slice(0, 2)) {
  router = replaceOnce(router, item);
}

for (const item of replacements.slice(2)) {
  cockpit = replaceOnce(cockpit, item);
}

for (const token of [
  "/api/admin/seo/opportunities/mark",
  "/api/admin/seo/opportunities/reopen",
  "../seo/opportunity-state.mjs",
]) {
  if (!router.includes(token)) fail(`Router-Sicherheitscheck fehlgeschlagen: ${token}`);
}

for (const token of [
  "data-opportunity-mark",
  "Optimierungen beobachten",
  "data-opportunity-reopen",
  "activeOpportunityCount",
  "../../../lib/seo/opportunity-state.mjs",
]) {
  if (!cockpit.includes(token)) fail(`Cockpit-Sicherheitscheck fehlgeschlagen: ${token}`);
}

// Erst nach allen Checks schreiben.
atomicWrite(serviceFile, serviceContent);
atomicWrite(routerFile, router);
atomicWrite(cockpitFile, cockpit);

log("Google-Opportunity Feedback Loop installiert.");
log("CTA: Bearbeitet.");
log("Cooldown: 21 Tage.");
log("Baseline: Klicks, Impressionen, CTR und Position.");
log("State entsteht beim ersten Klick unter reports/seo-recovery/opportunity-state.json.");
log("Keine .bak-Dateien angelegt.");

console.log("");
console.log("Jetzt prüfen:");
console.log("  npm --workspace apps/pfotentechnik run build");
console.log("  git diff -- apps/pfotentechnik/src/lib/admin/operations-router.mjs");
console.log("  git diff -- apps/pfotentechnik/src/lib/seo/opportunity-state.mjs");
console.log("  git diff -- apps/pfotentechnik/src/pages/admin/seo/cockpit.astro");
