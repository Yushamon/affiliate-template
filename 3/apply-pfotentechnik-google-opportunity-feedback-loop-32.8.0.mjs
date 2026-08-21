#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const TAG = "[pfotentechnik-google-opportunity-feedback-loop-32.8.0]";
const root = process.cwd();

const files = {
  router: path.join(root, "apps/pfotentechnik/src/lib/admin/operations-router.mjs"),
  cockpit: path.join(root, "apps/pfotentechnik/src/pages/admin/seo/cockpit.astro"),
  service: path.join(root, "apps/pfotentechnik/src/lib/seo/opportunity-state.mjs"),
};

const serviceContent = "import fs from \"node:fs\";\nimport path from \"node:path\";\nimport { fileURLToPath } from \"node:url\";\n\nconst APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), \"../../..\");\nconst STATE_FILE = path.join(APP_ROOT, \"reports\", \"seo-recovery\", \"opportunity-state.json\");\n\nconst defaultState = () => ({\n  schemaVersion: 1,\n  updatedAt: \"\",\n  entries: {}\n});\n\nexport const normalizeOpportunityPage = (value) => {\n  const raw = String(value || \"\").trim();\n  if (!raw) throw new Error(\"Opportunity-URL fehlt.\");\n  let pathname = raw;\n  try {\n    pathname = new URL(raw, \"https://pfotentechnik.de\").pathname;\n  } catch {}\n  pathname = (\"/\" + pathname).replace(/\\\\/+/g, \"/\").replace(/\\\\/+$/, \"\");\n  return pathname ? pathname + \"/\" : \"/\";\n};\n\nconst finite = (value) => {\n  const number = Number(value);\n  return Number.isFinite(number) ? number : 0;\n};\n\nconst normalizeBaseline = (value = {}) => ({\n  clicks: finite(value.clicks),\n  impressions: finite(value.impressions),\n  ctr: finite(value.ctr),\n  position: finite(value.position)\n});\n\nexport function readOpportunityState() {\n  try {\n    if (!fs.existsSync(STATE_FILE)) return defaultState();\n    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, \"utf8\"));\n    return {\n      schemaVersion: 1,\n      updatedAt: String(parsed?.updatedAt || \"\"),\n      entries: parsed?.entries && typeof parsed.entries === \"object\" ? parsed.entries : {}\n    };\n  } catch {\n    return defaultState();\n  }\n}\n\nfunction writeOpportunityState(state) {\n  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });\n  const next = {\n    schemaVersion: 1,\n    updatedAt: new Date().toISOString(),\n    entries: state.entries || {}\n  };\n  const temp = `${STATE_FILE}.tmp-${process.pid}-${Date.now()}`;\n  fs.writeFileSync(temp, JSON.stringify(next, null, 2) + \"\\n\", \"utf8\");\n  fs.renameSync(temp, STATE_FILE);\n  return next;\n}\n\nexport function isOpportunityObserving(entry, now = Date.now()) {\n  if (!entry?.observeUntil) return false;\n  const until = new Date(entry.observeUntil).getTime();\n  return Number.isFinite(until) && until > now;\n}\n\nexport async function getOpportunityState() {\n  return readOpportunityState();\n}\n\nexport async function markOpportunityOptimized(input = {}) {\n  const page = normalizeOpportunityPage(input.page);\n  const observeDaysRaw = Number(input.observeDays ?? 21);\n  const observeDays = Math.max(7, Math.min(90, Number.isFinite(observeDaysRaw) ? Math.round(observeDaysRaw) : 21));\n  const now = new Date();\n  const observeUntil = new Date(now.getTime() + observeDays * 86_400_000);\n  const state = readOpportunityState();\n\n  state.entries[page] = {\n    page,\n    status: \"observing\",\n    optimizedAt: now.toISOString(),\n    observeUntil: observeUntil.toISOString(),\n    observeDays,\n    baseline: normalizeBaseline(input.baseline),\n    note: String(input.note || \"\").trim().slice(0, 500)\n  };\n\n  writeOpportunityState(state);\n  return { ok: true, entry: state.entries[page] };\n}\n\nexport async function reopenOpportunity(input = {}) {\n  const page = normalizeOpportunityPage(input.page);\n  const state = readOpportunityState();\n  const existed = Boolean(state.entries[page]);\n  delete state.entries[page];\n  writeOpportunityState(state);\n  return { ok: true, page, reopened: existed };\n}\n\nexport { STATE_FILE as opportunityStateFile };\n";

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
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, content, "utf8");
  fs.renameSync(tmp, file);
}
function replaceOnce(source, before, after, label) {
  if (source.includes(after)) {
    log(`${label}: bereits aktuell.`);
    return source;
  }
  const count = source.split(before).length - 1;
  if (count !== 1) fail(`${label}: Ausgangsmuster kommt ${count}× vor.`);
  log(`${label}: aktualisiert.`);
  return source.replace(before, after);
}

if (!fs.existsSync(files.service) || fs.readFileSync(files.service, "utf8") !== serviceContent) {
  atomicWrite(files.service, serviceContent);
  log(`State-Service geschrieben: ${path.relative(root, files.service)}`);
} else {
  log("State-Service: bereits aktuell.");
}

let router = read(files.router);

router = replaceOnce(
  router,
  `import {
  approveMediaJob,`,
  `import {
  getOpportunityState,
  markOpportunityOptimized,
  reopenOpportunity
} from "../seo/opportunity-state.mjs";
import {
  approveMediaJob,`,
  "Router Import"
);

router = replaceOnce(
  router,
  `    if (request.method === "POST" && pathname === "/api/admin/products/operations") {
      assertJsonRequest(request);
      const body = await readJsonBody(request, 32_768);
      json(response, 200, await updateProductOperationsState(body), origin);
      return true;
    }

    if (request.method === "GET" && pathname === "/api/admin/media/audit") {`,
  `    if (request.method === "POST" && pathname === "/api/admin/products/operations") {
      assertJsonRequest(request);
      const body = await readJsonBody(request, 32_768);
      json(response, 200, await updateProductOperationsState(body), origin);
      return true;
    }

    if (request.method === "GET" && pathname === "/api/admin/seo/opportunities/state") {
      json(response, 200, await getOpportunityState(), origin);
      return true;
    }
    if (request.method === "POST" && pathname === "/api/admin/seo/opportunities/mark") {
      assertJsonRequest(request);
      const body = await readJsonBody(request, 32_768);
      json(response, 200, await markOpportunityOptimized(body), origin);
      return true;
    }
    if (request.method === "POST" && pathname === "/api/admin/seo/opportunities/reopen") {
      assertJsonRequest(request);
      const body = await readJsonBody(request, 32_768);
      json(response, 200, await reopenOpportunity(body), origin);
      return true;
    }

    if (request.method === "GET" && pathname === "/api/admin/media/audit") {`,
  "Router Endpoints"
);

atomicWrite(files.router, router);

let cockpit = read(files.cockpit);

cockpit = replaceOnce(
  cockpit,
  `import { loadSeoRecovery } from "../../../lib/seo/loadRecovery";

const payload = loadSeoDashboard();
const recovery = loadSeoRecovery();`,
  `import { loadSeoRecovery } from "../../../lib/seo/loadRecovery";
import { isOpportunityObserving, readOpportunityState } from "../../../lib/seo/opportunity-state.mjs";

const payload = loadSeoDashboard();
const recovery = loadSeoRecovery();
const opportunityState = readOpportunityState();
const opportunityNow = Date.now();
const observingEntries = Object.values(opportunityState.entries || {})
  .filter((entry: any) => isOpportunityObserving(entry, opportunityNow))
  .sort((a: any, b: any) => new Date(b.optimizedAt).getTime() - new Date(a.optimizedAt).getTime());
const observingPages = new Set(observingEntries.map((entry: any) => entry.page));`,
  "Cockpit State Import"
);

cockpit = replaceOnce(
  cockpit,
  `const recoveryOpportunityRows = recovery.opportunities.slice(0, 15);`,
  `const recoveryOpportunityRows = recovery.opportunities
  .filter((row) => !observingPages.has(row.page))
  .slice(0, 15);
const activeOpportunityCount = recovery.opportunities.filter((row) => !observingPages.has(row.page)).length;
const recoveryOpportunityMap = new Map(recovery.opportunities.map((row) => [row.page, row]));
const recoveryObservingRows = observingEntries.slice(0, 20).map((entry: any) => ({
  entry,
  current: recoveryOpportunityMap.get(entry.page),
}));`,
  "Cockpit Opportunity Filter"
);

cockpit = replaceOnce(
  cockpit,
  `            <span>Opportunities</span>
            <strong>{recovery.summary.opportunities}</strong>
            <span>Google-only, 28 Tage + 3 Monate Kontext</span>`,
  `            <span>Opportunities</span>
            <strong>{activeOpportunityCount}</strong>
            <span>{observingEntries.length} in Beobachtung · Google-only</span>`,
  "Opportunity Metric"
);

cockpit = replaceOnce(
  cockpit,
  `<tr><th>Seite</th><th>Signal</th><th>Nächster Hebel</th></tr>`,
  `<tr><th>Seite</th><th>Signal</th><th>Nächster Hebel</th><th>Aktion</th></tr>`,
  "Opportunity Tabellenkopf"
);

cockpit = replaceOnce(
  cockpit,
  `                    <td>{row.action}</td>
                  </tr>
                )) : (
                  <tr><td colspan="3">Noch keine belastbaren GSC-Opportunities vorhanden.</td></tr>`,
  `                    <td>{row.action}</td>
                    <td>
                      <button
                        type="button"
                        class="pt-button seo-button"
                        data-opportunity-mark
                        data-page={row.page}
                        data-clicks={row.metrics.clicks}
                        data-impressions={row.metrics.impressions}
                        data-ctr={row.metrics.ctr}
                        data-position={row.metrics.position}
                      >
                        Bearbeitet
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colspan="4">Keine aktive Opportunity. Bearbeitete Seiten können unten beobachtet werden.</td></tr>`,
  "Opportunity CTA"
);

cockpit = replaceOnce(
  cockpit,
  `    )}

    <script type="application/json" data-search-json set:html={serializedPayload}></script>`,
  `    )}

    {recovery.available && (
      <section class="seo-panel seo-stack" data-opportunity-watch>
        <div class="seo-section-header">
          <div>
            <span class="seo-eyebrow">Nach Optimierung</span>
            <h2>Optimierungen beobachten</h2>
          </div>
          <span class="seo-muted">Standard: 21 Tage Cooldown</span>
        </div>
        <div class="seo-table-wrap">
          <table class="seo-table">
            <thead>
              <tr><th>Seite</th><th>Bearbeitet</th><th>Baseline</th><th>Aktuelles Signal</th><th>Aktion</th></tr>
            </thead>
            <tbody>
              {recoveryObservingRows.length ? recoveryObservingRows.map(({ entry, current }: any) => (
                <tr>
                  <td><code>{entry.page}</code></td>
                  <td>
                    {new Date(entry.optimizedAt).toLocaleDateString("de-DE")}<br />
                    <span class="seo-muted">bis {new Date(entry.observeUntil).toLocaleDateString("de-DE")}</span>
                  </td>
                  <td>
                    {entry.baseline?.impressions ?? 0} Impr. · Pos. {Number(entry.baseline?.position || 0).toFixed(1)}
                  </td>
                  <td>
                    {current
                      ? `${current.metrics.impressions} Impr. · Pos. ${current.metrics.position.toFixed(1)}`
                      : "aktuell keine Opportunity"}
                  </td>
                  <td>
                    <button
                      type="button"
                      class="pt-button seo-button"
                      data-opportunity-reopen
                      data-page={entry.page}
                    >
                      Wieder öffnen
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colspan="5">Noch keine Optimierung in Beobachtung.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    )}

    <script type="application/json" data-search-json set:html={serializedPayload}></script>`,
  "Beobachtungsbereich"
);

cockpit = replaceOnce(
  cockpit,
  `    root.querySelectorAll<HTMLButtonElement>("[data-range]").forEach((button) => {
      button.addEventListener("click", () => render(button.dataset.range || ""));
    });

    const saved = localStorage.getItem("seo-cockpit-range");`,
  `    root.querySelectorAll<HTMLButtonElement>("[data-range]").forEach((button) => {
      button.addEventListener("click", () => render(button.dataset.range || ""));
    });

    const postJson = async (url: string, body: Record<string, unknown>) => {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", "accept": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || `HTTP ${response.status}`);
      }
      return payload;
    };

    root.querySelectorAll<HTMLButtonElement>("[data-opportunity-mark]").forEach((button) => {
      button.addEventListener("click", async () => {
        const page = button.dataset.page || "";
        const originalLabel = button.textContent || "Bearbeitet";
        button.disabled = true;
        button.textContent = "Speichere…";
        try {
          await postJson("/api/admin/seo/opportunities/mark", {
            page,
            observeDays: 21,
            baseline: {
              clicks: Number(button.dataset.clicks || 0),
              impressions: Number(button.dataset.impressions || 0),
              ctr: Number(button.dataset.ctr || 0),
              position: Number(button.dataset.position || 0),
            },
          });
          window.location.reload();
        } catch (error) {
          button.disabled = false;
          button.textContent = originalLabel;
          window.alert(error instanceof Error ? error.message : String(error));
        }
      });
    });

    root.querySelectorAll<HTMLButtonElement>("[data-opportunity-reopen]").forEach((button) => {
      button.addEventListener("click", async () => {
        const page = button.dataset.page || "";
        const originalLabel = button.textContent || "Wieder öffnen";
        button.disabled = true;
        button.textContent = "Öffne…";
        try {
          await postJson("/api/admin/seo/opportunities/reopen", { page });
          window.location.reload();
        } catch (error) {
          button.disabled = false;
          button.textContent = originalLabel;
          window.alert(error instanceof Error ? error.message : String(error));
        }
      });
    });

    const saved = localStorage.getItem("seo-cockpit-range");`,
  "Cockpit Client Actions"
);

atomicWrite(files.cockpit, cockpit);

const finalRouter = read(files.router);
const finalCockpit = read(files.cockpit);

for (const token of [
  "/api/admin/seo/opportunities/mark",
  "/api/admin/seo/opportunities/reopen",
  "../seo/opportunity-state.mjs",
]) {
  if (!finalRouter.includes(token)) fail(`Router-Sicherheitscheck fehlgeschlagen: ${token}`);
}

for (const token of [
  "data-opportunity-mark",
  "Optimierungen beobachten",
  "data-opportunity-reopen",
  "activeOpportunityCount",
  "../../../lib/seo/opportunity-state.mjs",
]) {
  if (!finalCockpit.includes(token)) fail(`Cockpit-Sicherheitscheck fehlgeschlagen: ${token}`);
}

log("Google-Opportunity Feedback Loop installiert.");
log("Cooldown: 21 Tage.");
log("State-Datei wird beim ersten Klick unter reports/seo-recovery/opportunity-state.json erzeugt.");
log("Keine .bak-Dateien angelegt.");
console.log("");
console.log("Jetzt prüfen:");
console.log("  npm --workspace apps/pfotentechnik run build");
console.log("  git diff -- apps/pfotentechnik/src/lib/admin/operations-router.mjs");
console.log("  git diff -- apps/pfotentechnik/src/pages/admin/seo/cockpit.astro");
console.log("  git diff -- apps/pfotentechnik/src/lib/seo/opportunity-state.mjs");
