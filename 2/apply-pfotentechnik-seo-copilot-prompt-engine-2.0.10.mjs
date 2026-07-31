#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-seo-copilot-prompt-engine-2.0.10";
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps/pfotentechnik");
const PAYLOAD = path.join(import.meta.dirname, "payload");

const FILES = [
  "src/lib/seo-copilot/prompt-engine.ts",
  "src/lib/seo-copilot/prompts.ts",
  "src/lib/seo-copilot/finding-ai.ts",
  "test/seo-copilot-prompt-engine.test.mjs",
  "test/seo-copilot.test.mjs",
  "package.json",
];

const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

const log = (message) => console.log(`[${NAME}] ${message}`);

const copy = (source, target) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
};

const restore = () => {
  for (const file of FILES) {
    const backup = path.join(BACKUP, file);
    const target = path.join(APP, file);

    if (fs.existsSync(backup)) {
      copy(backup, target);
    } else if (file !== "package.json" && fs.existsSync(target)) {
      fs.rmSync(target);
    }
  }
};

const quoteWindowsArg = (value) => {
  const text = String(value);
  if (!/[\s"&|<>^()]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
};

const run = (label, command, args) => {
  log(`Prüfe: ${label}`);

  if (process.platform === "win32") {
    const commandLine = [command, ...args].map(quoteWindowsArg).join(" ");

    execFileSync(
      process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe",
      ["/d", "/s", "/c", commandLine],
      {
        cwd: ROOT,
        stdio: "inherit",
        env: process.env,
        windowsHide: false,
      },
    );
  } else {
    execFileSync(command, args, {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
  }

  log(`BESTANDEN: ${label}`);
};

try {
  if (!fs.existsSync(APP)) {
    throw new Error(`Projektpfad fehlt: ${APP}`);
  }

  if (!fs.existsSync(PAYLOAD)) {
    throw new Error(`Payload fehlt: ${PAYLOAD}`);
  }

  for (const file of FILES) {
    const target = path.join(APP, file);
    if (fs.existsSync(target)) {
      copy(target, path.join(BACKUP, file));
    }
  }
  log(`Backup: ${path.relative(ROOT, BACKUP)}`);

  for (const file of [
    "src/lib/seo-copilot/prompt-engine.ts",
    "src/lib/seo-copilot/prompts.ts",
    "src/lib/seo-copilot/finding-ai.ts",
    "test/seo-copilot-prompt-engine.test.mjs",
  ]) {
    const source = path.join(PAYLOAD, file);
    if (!fs.existsSync(source)) {
      throw new Error(`Payload-Datei fehlt: ${source}`);
    }

    copy(source, path.join(APP, file));
    log(`Geschrieben: apps/pfotentechnik/${file}`);
  }

  const packagePath = path.join(APP, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  packageJson.scripts ??= {};

  const promptTest = "test/seo-copilot-prompt-engine.test.mjs";
  const current = String(packageJson.scripts["test:seo-copilot"] ?? "");

  if (!current.includes(promptTest)) {
    packageJson.scripts["test:seo-copilot"] = `${current} ${promptTest}`.trim();
  }

  packageJson.scripts["test:seo-copilot:prompts"] =
    "node --experimental-strip-types --test test/seo-copilot-prompt-engine.test.mjs";

  fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
  log("Aktualisiert: apps/pfotentechnik/package.json");

  const seoCopilotTestPath = path.join(APP, "test/seo-copilot.test.mjs");
  const seoCopilotTestSource = fs.readFileSync(seoCopilotTestPath, "utf8");

  const legacyMarketSignalAssertion =
    /assert\.match\(\s*prompt,\s*\/Marktsignale,\s*nicht als Verkaufszahlen\/i\s*\);/m;

  if (!legacyMarketSignalAssertion.test(seoCopilotTestSource)) {
    throw new Error(
      "Erwarteter veralteter Marktsignal-Test wurde nicht gefunden. Repository-Stand manuell prüfen.",
    );
  }

  const semanticMarketSignalAssertion = [
    '  assert.match(prompt, /Herstellerangaben/i);',
    '  assert.match(prompt, /Händlerangaben/i);',
    '  assert.match(prompt, /Marktsignale/i);',
    '  assert.match(prompt, /nicht als Verkaufszahlen/i);',
  ].join("\\n");

  const updatedSeoCopilotTest = seoCopilotTestSource.replace(
    legacyMarketSignalAssertion,
    semanticMarketSignalAssertion,
  );

  fs.writeFileSync(seoCopilotTestPath, updatedSeoCopilotTest, "utf8");
  log("Gepatcht: apps/pfotentechnik/test/seo-copilot.test.mjs");

  const smokeTestPath = path.join(BACKUP, "prompt-engine-import-smoke.mjs");
  fs.mkdirSync(path.dirname(smokeTestPath), { recursive: true });
  fs.writeFileSync(
    smokeTestPath,
    [
      'import { buildChatGptPrompt, buildCodexPrompt } from "../../apps/pfotentechnik/src/lib/seo-copilot/prompts.ts";',
      'if (typeof buildChatGptPrompt !== "function" || typeof buildCodexPrompt !== "function") {',
      '  process.exitCode = 1;',
      '}',
      "",
    ].join("\n"),
    "utf8",
  );

  run("Prompt Engine Import Smoke Test", "node", [
    "--experimental-strip-types",
    smokeTestPath,
  ]);

  run("Prompt Engine Tests", "npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "test:seo-copilot:prompts",
  ]);

  run("SEO-Copilot Test Syntax", "node", [
    "--check",
    path.join(APP, "test/seo-copilot.test.mjs"),
  ]);

  run("SEO-Copilot Tests", "npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "test:seo-copilot",
  ]);

  run("Quality Operations Sync", "npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "quality-ops:sync",
  ]);

  run("Design System", "npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "design-system:check",
  ]);

  run("Astro Build", "npm", ["run", "build:pfotentechnik"]);

  const report = {
    patch: NAME,
    generatedAt: new Date().toISOString(),
    platform: process.platform,
    commandRunner:
      process.platform === "win32"
        ? `${process.env.ComSpec || "cmd.exe"} /d /s /c`
        : "execFileSync",
    files: FILES.map((file) => `apps/pfotentechnik/${file}`),
    validation: {
      promptEngineTests: "passed",
      seoCopilotTests: "passed",
      qualityOperationsSync: "passed",
      designSystemCheck: "passed",
      astroBuild: "passed",
    },
  };

  const reportPath = path.join(
    APP,
    "reports/seo-copilot/prompt-engine-validation-latest.json",
  );

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  log(`Report: ${path.relative(ROOT, reportPath)}`);
  log("Abgeschlossen.");
} catch (error) {
  console.error(
    `[${NAME}] FEHLER: ${error instanceof Error ? error.message : String(error)}`,
  );

  try {
    restore();
    console.error(`[${NAME}] Änderungen wurden zurückgerollt.`);
  } catch (rollbackError) {
    console.error(
      `[${NAME}] ROLLBACK FEHLGESCHLAGEN: ${
        rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
      }`,
    );
  }

  process.exitCode = 1;
}
