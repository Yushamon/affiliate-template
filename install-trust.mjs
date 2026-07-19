#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const schemaPath = path.join(
  root,
  "apps/pfotentechnik/src/content/schema/product.ts"
);
const pagePath = path.join(
  root,
  "apps/pfotentechnik/src/pages/produkt/[product].astro"
);
const componentPath = path.join(
  root,
  "apps/pfotentechnik/src/components/ProductTrustPanel.astro"
);
const sourceComponentPath = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "ProductTrustPanel.astro"
);

for (const required of [schemaPath, pagePath, sourceComponentPath]) {
  if (!fs.existsSync(required)) {
    console.error(`Abbruch: Datei nicht gefunden: ${required}`);
    process.exit(1);
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, `.conversion-trust-backup-${stamp}`);

const backup = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  const relative = path.relative(root, filePath);
  const target = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(filePath, target);
};

backup(schemaPath);
backup(pagePath);
backup(componentPath);

let schema = fs.readFileSync(schemaPath, "utf8");
let page = fs.readFileSync(pagePath, "utf8");

const editorialSchema = `
const productEditorialSchema =
  z.object({
    assessmentType: z
      .enum([
        "hands-on-test",
        "editorial-review",
        "data-review"
      ])
      .default("editorial-review"),

    evidence: z
      .array(
        z.enum([
          "hands-on-testing",
          "manufacturer-documentation",
          "technical-specifications",
          "comparative-analysis",
          "user-feedback"
        ])
      )
      .default([
        "manufacturer-documentation",
        "technical-specifications",
        "comparative-analysis"
      ]),

    testedHandsOn: z
      .boolean()
      .default(false),

    lastVerifiedAt: z
      .coerce
      .date()
      .optional(),

    note: z
      .string()
      .optional()
  })
  .optional();

`;

if (!schema.includes("const productEditorialSchema")) {
  const decisionAnchor = "const productDecisionSchema =";

  if (!schema.includes(decisionAnchor)) {
    console.error(
      "Abbruch: productDecisionSchema-Anker nicht gefunden."
    );
    process.exit(1);
  }

  schema = schema.replace(
    decisionAnchor,
    editorialSchema + decisionAnchor
  );
  console.log("ergänzt: productEditorialSchema");
} else {
  console.log("übersprungen: productEditorialSchema bereits vorhanden");
}

if (!schema.includes("editorial:\n      productEditorialSchema")) {
  const conversionPattern =
    /(\n\s{4}conversion:\s*\n\s{6}productConversionSchema,\s*\n)/;

  if (conversionPattern.test(schema)) {
    schema = schema.replace(
      conversionPattern,
      `$1\n    editorial:\n      productEditorialSchema,\n`
    );
  } else {
    const ratingAnchor = "\n    rating: z";

    if (!schema.includes(ratingAnchor)) {
      console.error(
        "Abbruch: Weder Conversion- noch Rating-Anker gefunden."
      );
      process.exit(1);
    }

    schema = schema.replace(
      ratingAnchor,
      "\n    editorial:\n      productEditorialSchema,\n" +
      ratingAnchor
    );
  }

  console.log("ergänzt: editorial-Feld im Produktschema");
} else {
  console.log("übersprungen: editorial-Feld bereits vorhanden");
}

const importLine =
  'import ProductTrustPanel from "../../components/ProductTrustPanel.astro";';

if (!page.includes(importLine)) {
  const relatedImport =
    'import RelatedArticles from "@affiliate-core/components/RelatedArticles.astro";';

  if (!page.includes(relatedImport)) {
    console.error(
      "Abbruch: RelatedArticles-Importanker nicht gefunden."
    );
    process.exit(1);
  }

  page = page.replace(
    relatedImport,
    `${relatedImport}\n${importLine}`
  );

  console.log("ergänzt: ProductTrustPanel-Import");
} else {
  console.log("übersprungen: ProductTrustPanel-Import bereits vorhanden");
}

const trustBlock = `    <ProductTrustPanel
      assessmentType={contentProduct.editorial?.assessmentType}
      evidence={contentProduct.editorial?.evidence}
      testedHandsOn={contentProduct.editorial?.testedHandsOn}
      lastVerifiedAt={contentProduct.editorial?.lastVerifiedAt ?? updatedAt}
      note={contentProduct.editorial?.note}
    />`;

if (!page.includes("<ProductTrustPanel")) {
  const oldBlockPattern =
    /\n\s{4}<section\s*\n\s{6}class="pt-review-method"[\s\S]*?\n\s{4}<\/section>/;

  if (!oldBlockPattern.test(page)) {
    console.error(
      "Abbruch: Bestehender pt-review-method-Block nicht gefunden."
    );
    process.exit(1);
  }

  page = page.replace(oldBlockPattern, `\n${trustBlock}`);
  console.log("ersetzt: pt-review-method durch ProductTrustPanel");
} else {
  console.log("übersprungen: ProductTrustPanel bereits eingebunden");
}

fs.mkdirSync(path.dirname(componentPath), { recursive: true });
fs.copyFileSync(sourceComponentPath, componentPath);
fs.writeFileSync(schemaPath, schema, "utf8");
fs.writeFileSync(pagePath, page, "utf8");

const manifest = {
  installedAt: new Date().toISOString(),
  backupRoot,
  files: [
    path.relative(root, schemaPath),
    path.relative(root, pagePath),
    path.relative(root, componentPath)
  ]
};

fs.writeFileSync(
  path.join(root, ".conversion-framework-trust.json"),
  JSON.stringify(manifest, null, 2),
  "utf8"
);

console.log(`\nBackup erstellt: ${backupRoot}`);
console.log("Trust-Modul installiert.");
console.log("Jetzt ausführen: npm run build:pfotentechnik");
