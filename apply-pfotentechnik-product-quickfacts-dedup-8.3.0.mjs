#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PATCH_NAME = "pfotentechnik-product-quickfacts-dedup-8.3.0";
const TARGET_RELATIVE = path.join(
  "apps",
  "pfotentechnik",
  "src",
  "components",
  "product-standard-2",
  "ProductRenderer.astro"
);

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

function findRepositoryRoot(startDirectory) {
  let current = path.resolve(startDirectory);

  while (true) {
    if (fs.existsSync(path.join(current, TARGET_RELATIVE))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function fail(message) {
  console.error(`\n[${PATCH_NAME}] ${message}`);
  process.exitCode = 1;
}

const repositoryRoot =
  findRepositoryRoot(process.cwd()) ??
  findRepositoryRoot(scriptDirectory);

if (!repositoryRoot) {
  fail(
    `Repository nicht gefunden. Starte den Installer im Repository oder lege ihn in einen Unterordner des Repositorys. Erwartete Datei: ${TARGET_RELATIVE}`
  );
} else {
  const targetPath = path.join(repositoryRoot, TARGET_RELATIVE);
  const original = fs.readFileSync(targetPath, "utf8");

  const marker = "const quickFactSemanticKey = (label: unknown) =>";

  if (original.includes(marker)) {
    console.log(`\n[${PATCH_NAME}] Bereits installiert. Es wurde nichts verändert.`);
    console.log(`[${PATCH_NAME}] Datei: ${targetPath}`);
    process.exit(0);
  }

  const quickFactsPattern = /const quickFacts = \(\s*[\s\S]*?\)\.filter\(Boolean\)\.filter\(\(fact: any\) => fact\.label && fact\.value\)\.slice\(0,\s*8\);/m;
  const match = original.match(quickFactsPattern);

  if (!match) {
    fail(
      "Der Quick-Facts-Block wurde nicht eindeutig gefunden. Es wurde nichts verändert."
    );
  } else {
    const eol = original.includes("\r\n") ? "\r\n" : "\n";

    const replacement = `const normalizeQuickFactLabel = (input: unknown) =>
  asText(input)
    .toLocaleLowerCase("de-DE")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[-_]/g, " ")
    .replace(/\\s+/g, " ")
    .trim();

const quickFactSemanticKey = (label: unknown) => {
  const normalized = normalizeQuickFactLabel(label);

  if (/^(kapazitaet|volumen|fassungsvermoegen)$/.test(normalized)) {
    return "capacity";
  }

  if (/^(einsatz|geeignet fuer|eignung|anwendungsfall|use case)$/.test(normalized)) {
    return "use-case";
  }

  if (/^(app|app steuerung|appsteuerung)$/.test(normalized)) {
    return "app";
  }

  if (/^(stromversorgung|energieversorgung)$/.test(normalized)) {
    return "power";
  }

  return "label:" + normalized;
};

const rawQuickFacts = (
  explicitQuickFacts.length
    ? explicitQuickFacts.map((fact: any) => ({
        label: asText(fact?.label ?? fact?.title ?? fact?.name, "Merkmal"),
        value: asText(fact?.value ?? fact?.text ?? fact?.description ?? fact),
        note: asText(fact?.note)
      }))
    : [
        value.capacity
          ? { label: "Kapazität", value: asText(value.capacity), note: "" }
          : null,
        value.useCase
          ? { label: "Einsatz", value: asText(value.useCase), note: "" }
          : null,
        ...specEntries.slice(0, 6)
      ]
);

const quickFacts = rawQuickFacts
  .filter(Boolean)
  .filter((fact: any) => fact.label && fact.value)
  .filter((fact: any, index: number, facts: any[]) => {
    const semanticKey = quickFactSemanticKey(fact.label);

    return facts.findIndex(
      (candidate: any) => quickFactSemanticKey(candidate?.label) === semanticKey
    ) === index;
  })
  .slice(0, 8);`.split("\n").join(eol);

    const updated = original.replace(quickFactsPattern, replacement);

    const postconditions = [
      updated !== original,
      updated.includes(marker),
      updated.includes("const rawQuickFacts = ("),
      !quickFactsPattern.test(updated)
    ];

    if (postconditions.some((condition) => !condition)) {
      fail("Interne Prüfung fehlgeschlagen. Es wurde nichts verändert.");
    } else {
      const backupRoot = path.join(
        repositoryRoot,
        ".patch-backups",
        `${PATCH_NAME}-${timestamp()}`
      );
      const backupPath = path.join(backupRoot, TARGET_RELATIVE);
      const temporaryPath = `${targetPath}.${PATCH_NAME}.tmp`;

      try {
        fs.mkdirSync(path.dirname(backupPath), { recursive: true });
        fs.copyFileSync(targetPath, backupPath);

        fs.writeFileSync(temporaryPath, updated, "utf8");
        fs.renameSync(temporaryPath, targetPath);

        const written = fs.readFileSync(targetPath, "utf8");
        if (!written.includes(marker)) {
          throw new Error("Nachprüfung der geschriebenen Datei fehlgeschlagen.");
        }

        const reportPath = path.join(
          repositoryRoot,
          "apps",
          "pfotentechnik",
          "reports",
          `${PATCH_NAME}-report.json`
        );

        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(
          reportPath,
          `${JSON.stringify(
            {
              patch: PATCH_NAME,
              generatedAt: new Date().toISOString(),
              target: TARGET_RELATIVE.replaceAll(path.sep, "/"),
              backup: path.relative(repositoryRoot, backupPath).replaceAll(path.sep, "/"),
              changes: [
                "Kapazität, Volumen und Fassungsvermögen werden als ein Quick Fact behandelt.",
                "Einsatz, Geeignet für, Eignung und Anwendungsfall werden als ein Quick Fact behandelt.",
                "Explizite Werte wie capacity und useCase behalten Vorrang vor gleichartigen Specs.",
                "Exakte und semantische Dopplungen werden zentral im ProductRenderer entfernt."
              ]
            },
            null,
            2
          )}${eol}`,
          "utf8"
        );

        console.log(`\n[${PATCH_NAME}] Installation erfolgreich.`);
        console.log(`[${PATCH_NAME}] Geändert: ${targetPath}`);
        console.log(`[${PATCH_NAME}] Backup:   ${backupPath}`);
        console.log(`[${PATCH_NAME}] Report:   ${reportPath}`);
        console.log(`\nDanach ausführen:`);
        console.log(`npm run build:pfotentechnik`);
      } catch (error) {
        try {
          if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath, { force: true });
          if (fs.existsSync(backupPath)) fs.copyFileSync(backupPath, targetPath);
        } catch {
          // Die ursprüngliche Fehlermeldung ist aussagekräftiger.
        }

        fail(
          `Patch fehlgeschlagen; die Originaldatei wurde wiederhergestellt. ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }
}
