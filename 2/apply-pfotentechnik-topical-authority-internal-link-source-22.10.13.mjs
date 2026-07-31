#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-topical-authority-internal-link-source-22.10.13";
const SKIP_BUILD = process.argv.includes("--skip-build");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PAGE = path.join(APP, "src", "pages", "admin", "seo", "topical-authority.astro");
const LOADER = path.join(APP, "src", "lib", "seo", "topical-authority", "loadInternalLinkAdvisories.ts");
const TEST = path.join(APP, "test", "topical-authority-internal-link-source.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const REPORT = path.join(APP, "reports", "seo-copilot", "topical-authority-internal-link-source-22.10.13.md");
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"),
);

const log = (message) => console.log("[" + NAME + "] " + message);

function quoteCmdArg(value) {
  const text = String(value);
  if (!/[\s"&|<>^()%!]/.test(text)) return text;
  return '"' + text.replace(/"/g, '""') + '"';
}

function runNpm(args) {
  if (process.platform === "win32") {
    const command = ["npm", ...args].map(quoteCmdArg).join(" ");
    execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", command], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
      windowsHide: true,
    });
    return;
  }

  execFileSync("npm", args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
}

for (const file of [PAGE, PACKAGE]) {
  if (!fs.existsSync(file)) {
    throw new Error("Erforderliche Datei fehlt: " + path.relative(ROOT, file));
  }
}

let page = fs.readFileSync(PAGE, "utf8");

const loaderImport =
  'import { loadInternalLinkAdvisories } from "../../../lib/seo/topical-authority/loadInternalLinkAdvisories";';

if (!page.includes("loadInternalLinkAdvisories")) {
  const importAnchor =
    'import { loadTopicalAuthority } from "../../../lib/seo/topical-authority/loadTopicalAuthority";';

  if (!page.includes(importAnchor)) {
    throw new Error("Topical-Authority-Importanker wurde nicht gefunden.");
  }

  page = page.replace(importAnchor, `${importAnchor}\n${loaderImport}`);
}

if (!page.includes("const internalLinkReport = loadInternalLinkAdvisories();")) {
  const dataEnd = `};\n\nconst typeLabels =`;

  if (!page.includes(dataEnd)) {
    throw new Error("Datenblock in topical-authority.astro wurde nicht gefunden.");
  }

  page = page.replace(
    dataEnd,
    `};\n\nconst internalLinkReport = loadInternalLinkAdvisories();\nconst documentByRoute = new Map(\n  data.clusters.flatMap((cluster) =>\n    (Array.isArray(cluster?.documents) ? cluster.documents : []).map((document) => [\n      document?.route,\n      document,\n    ]),\n  ),\n);\n\nconst typeLabels =`,
  );
}

const linkHeading = '<p class="ta-eyebrow">Linkprüfung</p>';
const headingIndex = page.indexOf(linkHeading);
if (headingIndex < 0) {
  throw new Error("Linkprüfungsbereich wurde nicht gefunden.");
}

const sectionStart = page.lastIndexOf('<section class="ta-section">', headingIndex);
const mainEnd = page.indexOf("</main>", headingIndex);
const sectionEndStart = page.lastIndexOf("</section>", mainEnd);

if (sectionStart < 0 || sectionEndStart < sectionStart) {
  throw new Error("Linkprüfungsbereich konnte nicht sicher abgegrenzt werden.");
}

const sectionEnd = sectionEndStart + "</section>".length;

const newSection = `<section class="ta-section">
      <div class="ta-section-head">
        <div>
          <p class="ta-eyebrow">Internal-Link-Health-Audit</p>
          <h2>Hinweise ohne eingehenden Hauptinhaltslink</h2>
        </div>
        <span>{internalLinkReport.total} aktive Hinweise</span>
      </div>

      <div class:list={["ta-audit-source", { "ta-audit-source--stale": internalLinkReport.stale }]}>
        <strong>
          {internalLinkReport.available
            ? internalLinkReport.stale
              ? "Audit veraltet"
              : "Audit aktuell"
            : "Audit nicht verfügbar"}
        </strong>
        <span>
          Quelle: <code>{internalLinkReport.source}</code>
          {internalLinkReport.generatedAt
            ? \` · Stand: \${new Date(internalLinkReport.generatedAt).toLocaleString("de-DE")}\`
            : ""}
        </span>
        {internalLinkReport.stale && (
          <p>
            Vor Entscheidungen zuerst den Internal-Link-Health-Audit erneut ausführen.
            Die Liste kann durch zwischenzeitliche Content- und Journey-Änderungen überholt sein.
          </p>
        )}
      </div>

      <p class="ta-muted">
        Diese Einträge sind redaktionelle Hinweise, keine automatisch bestätigten
        technischen Fehler. Links werden nur ergänzt, wenn sie zur Suchintention und
        zum nächsten Entscheidungsschritt passen.
      </p>

      {internalLinkReport.advisories.length ? (
        <div class="ta-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Typ</th>
                <th>Inhalt</th>
                <th>Route</th>
                <th>Bewertung</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {internalLinkReport.advisories.map((advisory) => {
                const document = documentByRoute.get(advisory.route);
                return (
                  <tr>
                    <td>{typeLabels[document?.type] ?? document?.type ?? "Route"}</td>
                    <td>{document?.title ?? advisory.message}</td>
                    <td><code>{advisory.route}</code></td>
                    <td>
                      <span class="ta-priority ta-priority--medium">
                        {advisory.classification}
                      </span>
                      <small class="ta-advisory-rationale">{advisory.rationale}</small>
                    </td>
                    <td>
                      <details class="ta-remediation">
                        <summary>Aktion öffnen</summary>
                        <p>{advisory.action}</p>
                        <button
                          type="button"
                          class="ta-copy-prompt"
                          data-copy-prompt={advisory.codexPrompt}
                        >
                          Codex-Prompt kopieren
                        </button>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p class="ta-empty">
          {internalLinkReport.available
            ? "Keine aktiven NO_INCOMING_INTERNAL_LINK-Hinweise vorhanden."
            : "Der Internal-Link-Health-Report konnte nicht gelesen werden."}
        </p>
      )}
    </section>`;

page = page.slice(0, sectionStart) + newSection + page.slice(sectionEnd);

if (!page.includes("navigator.clipboard.writeText")) {
  const styleAnchor = "\n<style>";
  if (!page.includes(styleAnchor)) {
    throw new Error("Style-Anker in topical-authority.astro fehlt.");
  }

  page = page.replace(
    styleAnchor,
    `\n<script is:inline>
  document.addEventListener("click", async (event) => {
    const button = event.target instanceof Element
      ? event.target.closest("[data-copy-prompt]")
      : null;
    if (!(button instanceof HTMLButtonElement)) return;

    const prompt = button.dataset.copyPrompt || "";
    if (!prompt) return;

    try {
      await navigator.clipboard.writeText(prompt);
      const previous = button.textContent;
      button.textContent = "Kopiert";
      window.setTimeout(() => { button.textContent = previous; }, 1600);
    } catch {
      window.prompt("Codex-Prompt kopieren:", prompt);
    }
  });
</script>

<style>`,
  );
}

if (!page.includes(".ta-audit-source")) {
  const cssAnchor =
    ".ta-empty,.ta-muted{color:var(--seo-text-muted,#5f6875)}";

  if (!page.includes(cssAnchor)) {
    throw new Error("CSS-Anker in topical-authority.astro wurde nicht gefunden.");
  }

  page = page.replace(
    cssAnchor,
    `${cssAnchor}
  .ta-audit-source{display:grid;gap:.35rem;margin-bottom:1rem;padding:.85rem 1rem;border:1px solid var(--seo-border,#d9dee7);border-radius:.8rem;background:var(--seo-surface-subtle,#f3f5f8)}
  .ta-audit-source--stale{border-color:color-mix(in srgb,#b7791f 50%,var(--seo-border,#d9dee7));background:color-mix(in srgb,#b7791f 9%,var(--seo-surface,Canvas))}
  .ta-audit-source p{margin:.2rem 0 0}
  .ta-advisory-rationale{display:block;max-width:32rem;margin-top:.4rem;color:var(--seo-text-muted,#5f6875);line-height:1.45}
  .ta-remediation summary{cursor:pointer;font-weight:700}
  .ta-remediation p{max-width:34rem;line-height:1.5}
  .ta-copy-prompt{min-height:2.5rem;padding:.55rem .75rem;border:1px solid var(--seo-border,#d9dee7);border-radius:.65rem;background:var(--seo-surface,Canvas);color:inherit;font-weight:700;cursor:pointer}`,
  );
}

const testContent = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const app = path.join(ROOT, "apps", "pfotentechnik");
const page = fs.readFileSync(
  path.join(app, "src", "pages", "admin", "seo", "topical-authority.astro"),
  "utf8",
);
const loader = fs.readFileSync(
  path.join(
    app,
    "src",
    "lib",
    "seo",
    "topical-authority",
    "loadInternalLinkAdvisories.ts",
  ),
  "utf8",
);

test("Topical Authority nutzt den Internal-Link-Health-Report als Quelle", () => {
  assert.ok(page.includes("loadInternalLinkAdvisories"));
  assert.ok(loader.includes("internal-link-health-audit.json"));
  assert.ok(loader.includes('finding?.code !== "NO_INCOMING_INTERNAL_LINK"'));
});

test("alte eigene 50er-Orphan-Darstellung wird nicht mehr gerendert", () => {
  assert.ok(!page.includes("Mögliche verwaiste Inhalte"));
  assert.ok(!page.includes("data.orphanCandidates.length"));
  assert.ok(!page.includes("50 Kandidaten"));
});

test("Auditstatus und Alter werden transparent angezeigt", () => {
  assert.ok(page.includes("Audit veraltet"));
  assert.ok(page.includes("Internal-Link-Health-Audit erneut ausführen"));
  assert.ok(loader.includes("ageHours > 24"));
});

test("jeder Hinweis besitzt eine konkrete Codex-Remediation", () => {
  assert.ok(page.includes("data-copy-prompt"));
  assert.ok(page.includes("Codex-Prompt kopieren"));
  assert.ok(loader.includes("buildCodexPrompt"));
  assert.ok(loader.includes("Keine Footer-, Boilerplate- oder Keyword-Links"));
});

test("Loader begrenzt Ergebnisse nicht künstlich auf 50", () => {
  assert.ok(!loader.includes(".slice(0, 50)"));
  assert.ok(loader.includes("const advisories = [...byRoute.values()]"));
});
`;

const packageJson = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
packageJson.scripts ||= {};
packageJson.scripts["test:topical-authority:internal-link-source"] =
  "node --test test/topical-authority-internal-link-source.test.mjs";
const packageAfter = JSON.stringify(packageJson, null, 2) + "\n";

const reportContent = `# Topical Authority Internal-Link Source 22.10.13

Topical Authority verwendet aktive NO_INCOMING_INTERNAL_LINK-Findings aus dem
Internal-Link-Health-Report als einzige UI-Quelle.

Die alte eigene, auf 50 Einträge begrenzte Orphan-Darstellung wird entfernt.
Angezeigt werden Quelle, Stand, Veraltungsstatus, Klassifikation, Begründung
und eine konkrete Codex-Remediation pro Route.
`;

const desired = new Map([
  [LOADER, "import fs from \"node:fs\";\nimport path from \"node:path\";\nimport { fileURLToPath } from \"node:url\";\n\nexport type InternalLinkAdvisory = {\n  route: string;\n  message: string;\n  severity: string;\n  classification: string;\n  rationale: string;\n  action: string;\n  codexPrompt: string;\n};\n\nexport type InternalLinkAdvisoryReport = {\n  available: boolean;\n  generatedAt: string | null;\n  ageHours: number | null;\n  stale: boolean;\n  total: number;\n  source: string;\n  advisories: InternalLinkAdvisory[];\n};\n\nconst appRoot = path.resolve(\n  path.dirname(fileURLToPath(import.meta.url)),\n  \"../../../..\",\n);\n\nconst reportPath = path.join(\n  appRoot,\n  \"reports\",\n  \"internal-linking\",\n  \"internal-link-health-audit.json\",\n);\n\nconst normalizeRoute = (value: unknown): string => {\n  if (typeof value !== \"string\" || !value.trim()) return \"\";\n  const clean = value.trim().split(/[?#]/, 1)[0];\n  const route = clean.startsWith(\"/\") ? clean : `/${clean}`;\n  return route.endsWith(\"/\") ? route : `${route}/`;\n};\n\nconst buildAction = (route: string) =>\n  `Passende indexierbare Quellseiten im selben Themencluster ermitteln, den fachlich stärksten natürlichen Link ergänzen und anschließend den Internal-Link-Health-Audit erneut ausführen. Zielroute: ${route}`;\n\nconst buildCodexPrompt = (route: string, message: string) => `Du arbeitest direkt im Repository Yushamon/affiliate-template.\n\nProjekt:\napps/pfotentechnik\n\nAufgabe:\nBehebe das Internal-Linking-Finding für ${route}.\n\nFinding:\n- Typ: NO_INCOMING_INTERNAL_LINK\n- Befund: ${message}\n- Klassifikation: advisory\n\nVorgehen:\n1. Ermittle die fachlich passendsten indexierbaren Quellseiten anhand von Themencluster, Suchintention und Decision Journey.\n2. Prüfe vorhandene Links, Selbstlinks, Redirects und Canonicals.\n3. Ergänze genau dort natürliche redaktionelle Links, wo sie dem Nutzer tatsächlich helfen.\n4. Keine Footer-, Boilerplate- oder Keyword-Links nur zur Erfüllung des Audits.\n5. Keine medizinisch oder fachlich unpassenden Produktverlinkungen.\n6. Führe danach den zuständigen Internal-Link-Health-Audit erneut aus.\n7. Dokumentiere geänderte Dateien, Linktexte, Zielroute und Validierung.\n\nAkzeptanz:\n- ${route} besitzt mindestens einen fachlich sinnvollen eingehenden Hauptinhaltslink.\n- Kein Selbstlink, kein kaputtes Ziel und keine künstliche Überoptimierung.\n- Das Finding ist im erneut erzeugten Report nicht mehr aktiv.`;\n\nexport function loadInternalLinkAdvisories(\n  now = new Date(),\n): InternalLinkAdvisoryReport {\n  const source = path.relative(appRoot, reportPath).replaceAll(\"\\\\\", \"/\");\n\n  if (!fs.existsSync(reportPath)) {\n    return {\n      available: false,\n      generatedAt: null,\n      ageHours: null,\n      stale: true,\n      total: 0,\n      source,\n      advisories: [],\n    };\n  }\n\n  try {\n    const parsed = JSON.parse(fs.readFileSync(reportPath, \"utf8\"));\n    const generatedAt =\n      typeof parsed?.generatedAt === \"string\" ? parsed.generatedAt : null;\n    const generatedTime = generatedAt ? Date.parse(generatedAt) : Number.NaN;\n    const ageHours = Number.isFinite(generatedTime)\n      ? Math.max(0, (now.getTime() - generatedTime) / 3_600_000)\n      : null;\n\n    const findings = Array.isArray(parsed?.findings) ? parsed.findings : [];\n    const byRoute = new Map<string, InternalLinkAdvisory>();\n\n    for (const finding of findings) {\n      if (finding?.code !== \"NO_INCOMING_INTERNAL_LINK\") continue;\n      if (finding?.suppressed === true || finding?.status === \"resolved\") continue;\n\n      const route = normalizeRoute(\n        finding?.targetRoute ?? finding?.route ?? finding?.normalizedTarget,\n      );\n      if (!route) continue;\n\n      const message =\n        typeof finding?.message === \"string\" && finding.message.trim()\n          ? finding.message.trim()\n          : `${route} besitzt im geprüften Linkgraph keinen eingehenden Link.`;\n\n      byRoute.set(route, {\n        route,\n        message,\n        severity:\n          String(finding?.effectiveSeverity ?? finding?.severity ?? \"warning\"),\n        classification: String(finding?.classification ?? \"advisory\"),\n        rationale: String(\n          finding?.rationale ??\n            \"Redaktioneller Hinweis ohne nachgewiesenen Fehler im gebauten HTML.\",\n        ),\n        action: buildAction(route),\n        codexPrompt: buildCodexPrompt(route, message),\n      });\n    }\n\n    const advisories = [...byRoute.values()].sort((a, b) =>\n      a.route.localeCompare(b.route, \"de\"),\n    );\n\n    return {\n      available: true,\n      generatedAt,\n      ageHours,\n      stale: ageHours === null || ageHours > 24,\n      total: advisories.length,\n      source,\n      advisories,\n    };\n  } catch {\n    return {\n      available: false,\n      generatedAt: null,\n      ageHours: null,\n      stale: true,\n      total: 0,\n      source,\n      advisories: [],\n    };\n  }\n}\n"],
  [PAGE, page],
  [TEST, testContent],
  [PACKAGE, packageAfter],
  [REPORT, reportContent],
]);

const changes = [];
for (const [file, content] of desired) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (current !== content) changes.push({ file, current, content });
}

fs.mkdirSync(BACKUP, { recursive: true });

try {
  for (const change of changes) {
    const relative = path.relative(ROOT, change.file);

    if (change.current !== null) {
      const backupFile = path.join(BACKUP, relative);
      fs.mkdirSync(path.dirname(backupFile), { recursive: true });
      fs.writeFileSync(backupFile, change.current);
    }

    fs.mkdirSync(path.dirname(change.file), { recursive: true });
    fs.writeFileSync(change.file, change.content);
    log("Geschrieben: " + relative);
  }

  runNpm([
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "test:topical-authority:internal-link-source",
  ]);

  for (const script of [
    "test:topical-authority:journey-model",
    "test:seo-copilot",
    "test:css-admin-architecture",
  ]) {
    if (packageJson.scripts?.[script]) {
      runNpm(["--workspace", "apps/pfotentechnik", "run", script]);
    }
  }

  if (!SKIP_BUILD) {
    runNpm(["--workspace", "apps/pfotentechnik", "run", "build"]);
  }

  log("BESTANDEN.");
  log("Report: " + path.relative(ROOT, REPORT));
  log("Backup: " + path.relative(ROOT, BACKUP));
} catch (error) {
  log("FEHLER: " + error.message);
  log("Rollback wird ausgeführt.");

  for (const change of [...changes].reverse()) {
    if (change.current === null) {
      if (fs.existsSync(change.file)) fs.unlinkSync(change.file);
    } else {
      fs.mkdirSync(path.dirname(change.file), { recursive: true });
      fs.writeFileSync(change.file, change.current);
    }
  }

  process.exitCode = 1;
}
