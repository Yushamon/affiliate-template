#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PATCH = "pfotentechnik-product-data-research-audit-fix-1.0.0";
const root = process.cwd();
const appRoot = path.join(root, "apps", "pfotentechnik");
const files = {
  audit: path.join(appRoot, "scripts", "audit-product-data.mjs"),
  surefeed: path.join(appRoot, "src", "content", "products", "surefeed-microchip-pet-feeder.md"),
  dog6: path.join(appRoot, "src", "content", "products", "tractive-dog-6.md"),
  dog6xl: path.join(appRoot, "src", "content", "products", "tractive-dog-6-xl.md"),
};

function fail(message) { throw new Error(`[${PATCH}] ${message}`); }
function read(file) {
  if (!fs.existsSync(file)) fail(`Datei fehlt: ${path.relative(root, file)}`);
  return fs.readFileSync(file, "utf8");
}
function writeAtomic(file, content) {
  const temp = `${file}.${PATCH}.tmp`;
  fs.writeFileSync(temp, content, "utf8");
  fs.renameSync(temp, file);
}
function replaceOne(source, search, replacement, label) {
  const count = source.split(search).length - 1;
  if (count !== 1) fail(`${label}: Erwartet 1 Treffer, gefunden ${count}.`);
  return source.replace(search, replacement);
}
function backup(file) {
  const target = path.join(root, ".patch-backups", PATCH, path.relative(root, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

const originals = new Map(Object.values(files).map((file) => [file, read(file)]));

try {
  let audit = originals.get(files.audit);
  let surefeed = originals.get(files.surefeed);
  let dog6 = originals.get(files.dog6);
  let dog6xl = originals.get(files.dog6xl);

  if (audit.includes("UNKNOWN_VALUE_PATTERNS") && surefeed.includes("bis zu 6 Monate laut Hersteller")) {
    console.log(`[${PATCH}] Bereits installiert.`);
    process.exit(0);
  }

  audit = replaceOne(
    audit,
    "const CATEGORY_RULES = {",
    `const UNKNOWN_VALUE_PATTERNS = [
  /^nicht (?:vom hersteller )?(?:konkret )?ausgewiesen$/i,
  /^vom hersteller nicht veröffentlicht$/i,
  /^nicht dokumentiert$/i,
  /^unbekannt$/i,
  /^keine angabe$/i,
  /^keine herstellerangabe$/i,
  /^offen$/i,
  /^n\\/a$/i
];

const CATEGORY_RULES = {`,
    "Unbekannt-Werte"
  );

  audit = replaceOne(
    audit,
    `["stromversorgung", "betrieb"],
      ["geeignet für", "geeignet fuer", "zielgruppe"],
      ["befestigung", "halsband"]`,
    `["stromversorgung", "betrieb", "akku", "laden"],
      ["geeignet für", "geeignet fuer", "zielgruppe"],
      ["befestigung", "halsband"]`,
    "GPS-Stromversorgungs-Aliase"
  );

  audit = replaceOne(
    audit,
    `["material"]
    ]
  }
};`,
    `["material", "gehäuse", "gehaeuse"]
    ]
  }
};`,
    "GPS-Material-Aliase"
  );

  audit = replaceOne(
    audit,
    `    for (const aliases of rules.requiredSpecs) {
      if (!hasSpec(product.specs, aliases)) {
        errors.push(\`Vergleichsfeld fehlt: \${aliases[0]}\`);
      }
    }

    for (const aliases of rules.recommendedSpecs) {
      if (!hasSpec(product.specs, aliases)) {
        warnings.push(\`Empfohlenes Feld fehlt: \${aliases[0]}\`);
      }
    }`,
    `    for (const aliases of rules.requiredSpecs) {
      const status = getSpecStatus(product.specs, aliases);
      if (status === "missing") {
        errors.push(\`Vergleichsfeld fehlt: \${aliases[0]}\`);
      } else if (status === "unknown") {
        warnings.push(\`Vergleichsfeld unbestätigt: \${aliases[0]}\`);
      }
    }

    for (const aliases of rules.recommendedSpecs) {
      const status = getSpecStatus(product.specs, aliases);
      if (status === "missing") {
        warnings.push(\`Empfohlenes Feld fehlt: \${aliases[0]}\`);
      } else if (status === "unknown") {
        warnings.push(\`Empfohlenes Feld unbestätigt: \${aliases[0]}\`);
      }
    }`,
    "Audit-Regelschleifen"
  );

  audit = replaceOne(
    audit,
    `    warnings,
    specs: product.specs,
    completeness: calculateCompleteness(errors, warnings)
  };`,
    `    warnings,
    specs: product.specs,
    unknownSpecs: product.specs
      .filter((spec) => isUnknownSpecValue(spec.value))
      .map((spec) => spec.label),
    structuralCompleteness: calculateStructuralCompleteness(product, rules),
    confirmedCompleteness: calculateConfirmedCompleteness(product, rules),
    completeness: calculateCompleteness(errors, warnings)
  };`,
    "Audit-Ergebnis"
  );

  audit = replaceOne(
    audit,
    `function hasSpec(specs, aliases) {
  const normalizedAliases = aliases.map(normalize);
  return specs.some((spec) => {
    const label = normalize(spec.label);
    return normalizedAliases.some(
      (alias) => label === alias || label.includes(alias)
    );
  });
}`,
    `function matchingSpecs(specs, aliases) {
  const normalizedAliases = aliases.map(normalize);
  return specs.filter((spec) => {
    const label = normalize(spec.label);
    return normalizedAliases.some(
      (alias) => label === alias || label.includes(alias)
    );
  });
}

function isUnknownSpecValue(value) {
  const normalized = String(value ?? "").trim();
  return !normalized || UNKNOWN_VALUE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function getSpecStatus(specs, aliases) {
  const matches = matchingSpecs(specs, aliases);
  if (matches.length === 0) return "missing";
  return matches.some((spec) => !isUnknownSpecValue(spec.value))
    ? "confirmed"
    : "unknown";
}

function hasSpec(specs, aliases) {
  return matchingSpecs(specs, aliases).length > 0;
}

function calculateStructuralCompleteness(product, rules) {
  if (!rules) return 100;
  const groups = [...rules.requiredSpecs, ...rules.recommendedSpecs];
  if (groups.length === 0) return 100;
  const present = groups.filter((aliases) =>
    getSpecStatus(product.specs, aliases) !== "missing"
  ).length;
  return Math.round((present / groups.length) * 100);
}

function calculateConfirmedCompleteness(product, rules) {
  if (!rules) return 100;
  const groups = [...rules.requiredSpecs, ...rules.recommendedSpecs];
  if (groups.length === 0) return 100;
  const confirmed = groups.filter((aliases) =>
    getSpecStatus(product.specs, aliases) === "confirmed"
  ).length;
  return Math.round((confirmed / groups.length) * 100);
}`,
    "Audit-Hilfsfunktionen"
  );

  surefeed = surefeed.replace(/^updatedAt:\s*".*?"$/m, 'updatedAt: "2026-07-25"');
  surefeed = replaceOne(
    surefeed,
    `  - { label: "Napf", value: "Nicht vom Hersteller ausgewiesen" }
  - { label: "Reinigung", value: "Nicht vom Hersteller ausgewiesen" }
  - { label: "WLAN", value: "Nicht vom Hersteller ausgewiesen" }
  - { label: "Batterie", value: "Nicht vom Hersteller ausgewiesen" }
  - { label: "Maße", value: "Nicht vom Hersteller ausgewiesen" }
  - { label: "Gewicht", value: "Nicht vom Hersteller ausgewiesen" }`,
    `  - { label: "Napf", value: "Ein grauer Einzelnapf und ein grauer geteilter Napf enthalten; Edelstahl-Näpfe separat erhältlich" }
  - { label: "Napfmaße", value: "Innenmaß etwa 105 × 160 × 30 mm (B × H × T)" }
  - { label: "Reinigung", value: "Näpfe und Matte entnehmbar; bewegliche Mechanik gemäß Herstelleranleitung reinigen und trocken halten" }
  - { label: "WLAN", value: "Nein; die Standardversion arbeitet lokal ohne App oder Hub" }
  - { label: "Batterie", value: "4 C-Batterien; bis zu 6 Monate laut Hersteller; Batterien nicht enthalten" }
  - { label: "Maße", value: "200 × 230 × 320 mm (H × B × T)" }
  - { label: "Öffnung", value: "210 × 155 mm (B × H)" }
  - { label: "Gewicht", value: "Vom Hersteller nicht veröffentlicht" }`,
    "SureFeed-Specs"
  );

  surefeed = replaceOne(
    surefeed,
    `  methodology: "Redaktionelle Einordnung anhand der offiziellen Sure-Petcare-Produktinformationen; kein eigener Langzeittest."`,
    `  methodology: "Redaktionelle Einordnung anhand der offiziellen Sure-Petcare-Produkt- und Supportinformationen, zuletzt geprüft am 25.07.2026; kein eigener Langzeittest."`,
    "SureFeed-Methodik"
  );

  dog6 = dog6.replace(/^updatedAt:\s*".*?"$/m, 'updatedAt: "2026-07-25"');
  dog6 = replaceOne(
    dog6,
    `  - { label: "Akku", value: "Integrierter Akku, laut Support 930 mAh" }
  - { label: "Laden", value: "Mitgeliefertes USB-C-Ladekabel" }`,
    `  - { label: "Stromversorgung", value: "Integrierter Akku; Laden über das mitgelieferte USB-C-Ladekabel" }
  - { label: "Akku", value: "Integrierter Akku, laut Support 930 mAh" }
  - { label: "Laden", value: "Mitgeliefertes USB-C-Ladekabel" }
  - { label: "Material", value: "Glasfaserverstärktes Gehäuse laut Hersteller" }`,
    "DOG-6-Specs"
  );

  dog6xl = dog6xl.replace(/^updatedAt:\s*".*?"$/m, 'updatedAt: "2026-07-25"');
  dog6xl = replaceOne(
    dog6xl,
    `  - { label: "Laden", value: "Integrierter Akku, mitgeliefertes USB-C-Ladekabel" }`,
    `  - { label: "Stromversorgung", value: "Integrierter Akku; Laden über das mitgelieferte USB-C-Ladekabel" }
  - { label: "Laden", value: "Integrierter Akku, mitgeliefertes USB-C-Ladekabel" }`,
    "DOG-6-XL-Stromversorgung"
  );
  dog6xl = replaceOne(
    dog6xl,
    `  - { label: "Abmessungen", value: "Etwa 84 × 48 × 20 mm" }`,
    `  - { label: "Abmessungen", value: "83 × 47 × 20 mm" }`,
    "DOG-6-XL-Abmessungen"
  );
  dog6xl = replaceOne(
    dog6xl,
    `  - { label: "Gehäuse", value: "Verstärktes, laut Hersteller glasfaserverstärktes Design" }`,
    `  - { label: "Gehäuse", value: "Verstärktes, laut Hersteller glasfaserverstärktes Design" }
  - { label: "Material", value: "Glasfaserverstärktes Gehäuse laut Hersteller" }`,
    "DOG-6-XL-Material"
  );

  for (const file of Object.values(files)) backup(file);
  writeAtomic(files.audit, audit);
  writeAtomic(files.surefeed, surefeed);
  writeAtomic(files.dog6, dog6);
  writeAtomic(files.dog6xl, dog6xl);

  console.log(`[${PATCH}] Installiert.`);
  console.log("Geänderte Dateien:");
  for (const file of Object.values(files)) console.log(`- ${path.relative(root, file)}`);
  console.log("");
  console.log("Validierung:");
  console.log("npm --workspace apps/pfotentechnik run lint:content");
  console.log("npm --workspace apps/pfotentechnik run audit:products:strict");
  console.log("npm --workspace apps/pfotentechnik run comparison:audit");
  console.log("npm run build:pfotentechnik");
} catch (error) {
  for (const [file, content] of originals) {
    try { if (fs.existsSync(file)) writeAtomic(file, content); } catch {}
  }
  console.error(`[${PATCH}] Fehlgeschlagen; alle Dateien wurden zurückgesetzt.`);
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
