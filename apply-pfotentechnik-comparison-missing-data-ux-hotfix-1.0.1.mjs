#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ID = "pfotentechnik-comparison-missing-data-ux-hotfix-1.0.1";
const CHECK = process.argv.includes("--check");
const SKIP_BUILD = process.argv.includes("--skip-build");

const COMPONENT =
  "packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro";

const CSS =
  "packages/affiliate-core/src/components/comparison/comparison.css";

const COMPONENT_MARKER =
  "data-missing-data-ux=\"1.0.1\"";

const CSS_MARKER =
  "/* PT comparison missing-data UX hotfix 1.0.1 */";

const NEW_BLOCK = `        {(() => {
          const mobileRows = rows.map((row) => {
            const cell = row.cells.find(
              (entry) => entry.productSlug === product.slug
            );

            const value =
              cell?.value && cell.value !== "–"
                ? cell.value
                : "Nicht dokumentiert";

            return {
              row,
              value,
              isMissing:
                value === "Nicht dokumentiert" ||
                value === "Keine Angabe"
            };
          });

          const documentedRows = mobileRows.filter(
            (entry) => !entry.isMissing
          );

          const missingRows = mobileRows.filter(
            (entry) => entry.isMissing
          );

          const groupMissing = missingRows.length >= 3;

          const visibleRows = groupMissing
            ? documentedRows
            : mobileRows;

          return (
            <dl
              class="comparison-mobile-product__values"
              data-missing-data-ux="1.0.1"
            >
              {visibleRows.map(({ row, value, isMissing }) => (
                <div
                  data-mobile-criterion
                  data-has-differences={String(row.hasDifferences)}
                  data-missing={String(isMissing)}
                >
                  <dt>{row.criterion.label}</dt>
                  <dd>
                    {isMissing ? (
                      <span
                        class="comparison-missing-value"
                        title="Diese Angabe liegt derzeit nicht verlässlich vor."
                      >
                        Keine verlässliche Angabe
                      </span>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}

              {groupMissing && (
                <div
                  class="comparison-mobile-product__missing-group"
                  data-mobile-missing-group
                >
                  <dt>Weitere Angaben</dt>
                  <dd>
                    <details>
                      <summary>
                        {missingRows.length} Angaben nicht dokumentiert
                      </summary>

                      <p>
                        Für diese Kriterien liegt derzeit keine
                        verlässliche Angabe vor:
                      </p>

                      <ul>
                        {missingRows.map(({ row }) => (
                          <li>{row.criterion.label}</li>
                        ))}
                      </ul>
                    </details>
                  </dd>
                </div>
              )}
            </dl>
          );
        })()}`;

const CSS_BLOCK = `
${CSS_MARKER}

.comparison-mobile-product__values [data-missing="true"] dd {
  color: var(--comparison-muted);
}

.comparison-missing-value {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
  color: var(--comparison-muted);
  font-size: 0.9em;
  font-style: italic;
  line-height: 1.4;
}

.comparison-missing-value::before {
  display: inline-grid;
  width: 1.05rem;
  height: 1.05rem;
  flex: 0 0 1.05rem;
  place-items: center;
  border: 1px solid color-mix(
    in srgb,
    var(--comparison-muted) 38%,
    transparent
  );
  border-radius: 999px;
  content: "i";
  font-size: 0.68rem;
  font-style: normal;
  font-weight: 800;
  line-height: 1;
}

.comparison-mobile-product__missing-group {
  align-items: start;
  background: color-mix(
    in srgb,
    var(--comparison-muted) 4%,
    var(--comparison-surface)
  );
}

.comparison-mobile-product__missing-group dd,
.comparison-mobile-product__missing-group details {
  width: 100%;
  min-width: 0;
}

.comparison-mobile-product__missing-group summary {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  color: var(--comparison-muted);
  font-size: 0.91rem;
  font-weight: 750;
  line-height: 1.35;
  cursor: pointer;
  list-style: none;
}

.comparison-mobile-product__missing-group summary::-webkit-details-marker {
  display: none;
}

.comparison-mobile-product__missing-group summary::after {
  content: "+";
  font-size: 1.1rem;
}

.comparison-mobile-product__missing-group details[open] summary::after {
  content: "−";
}

.comparison-mobile-product__missing-group p {
  margin: 0.7rem 0 0.45rem;
  color: var(--comparison-muted);
  font-size: 0.8rem;
  line-height: 1.45;
  text-align: left;
}

.comparison-mobile-product__missing-group ul {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.comparison-mobile-product__missing-group li {
  padding: 0.3rem 0.48rem;
  border: 1px solid var(--comparison-line);
  border-radius: 999px;
  color: var(--comparison-muted);
  background: var(--comparison-surface);
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.2;
}

@media (max-width: 480px) {
  .comparison-mobile-product__missing-group summary {
    font-size: 0.86rem;
  }

  .comparison-mobile-product__missing-group ul {
    justify-content: flex-start;
  }
}
`;

function fail(message) {
  throw new Error(message);
}

function findRoot() {
  let current = process.cwd();

  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(current, "packages", "affiliate-core"))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  fail("Repository-Hauptverzeichnis nicht gefunden.");
}

function run(root, command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    fail(result.error.message);
  }

  if (result.status !== 0) {
    fail(
      `${command} ${args.join(" ")} fehlgeschlagen ` +
      `(Exit ${result.status}).`
    );
  }
}

function findMobileValuesBlock(source) {
  const classPatterns = [
    '<dl class="comparison-mobile-product__values">',
    '<dl\n              class="comparison-mobile-product__values"',
    '<dl\n            class="comparison-mobile-product__values"',
    '<dl\n          class="comparison-mobile-product__values"'
  ];

  let start = -1;

  for (const pattern of classPatterns) {
    start = source.indexOf(pattern);
    if (start >= 0) break;
  }

  if (start < 0) {
    const classIndex = source.indexOf(
      'comparison-mobile-product__values'
    );

    if (classIndex >= 0) {
      start = source.lastIndexOf("<dl", classIndex);
    }
  }

  if (start < 0) {
    fail(
      "Mobiler Vergleichswerteblock wurde nicht gefunden."
    );
  }

  const end = source.indexOf("</dl>", start);

  if (end < 0) {
    fail(
      "Schließendes </dl> des mobilen Vergleichswerteblocks fehlt."
    );
  }

  return {
    start,
    end: end + "</dl>".length
  };
}

function replaceMobileValuesBlock(source) {
  if (source.includes(COMPONENT_MARKER)) {
    return source;
  }

  const block = findMobileValuesBlock(source);
  const current = source.slice(block.start, block.end);

  if (
    !current.includes("rows.map") &&
    !current.includes("mobileRows.map")
  ) {
    fail(
      "Gefundener Werteblock enthält keine erwartete Zeilenlogik."
    );
  }

  return (
    source.slice(0, block.start) +
    NEW_BLOCK +
    source.slice(block.end)
  );
}

const root = findRoot();
const componentFile = path.join(root, COMPONENT);
const cssFile = path.join(root, CSS);

if (!fs.existsSync(componentFile)) {
  fail(`Komponente fehlt: ${COMPONENT}`);
}

if (!fs.existsSync(cssFile)) {
  fail(`Stylesheet fehlt: ${CSS}`);
}

const originalComponent =
  fs.readFileSync(componentFile, "utf8");

const originalCss =
  fs.readFileSync(cssFile, "utf8");

const nextComponent =
  replaceMobileValuesBlock(originalComponent);

const nextCss =
  originalCss.includes(CSS_MARKER)
    ? originalCss
    : `${originalCss.trimEnd()}\n\n${CSS_BLOCK.trim()}\n`;

console.log(`[${ID}] Repository: ${root}`);

console.log(
  `[${ID}] ${
    nextComponent === originalComponent ? "OK" : "ÄNDERN"
  }: ${COMPONENT}`
);

console.log(
  `[${ID}] ${
    nextCss === originalCss ? "OK" : "ÄNDERN"
  }: ${CSS}`
);

if (CHECK) {
  console.log(`[${ID}] Strukturelle Vorprüfung erfolgreich.`);
  process.exit(0);
}

const backup = path.join(
  root,
  ".patch-backups",
  `${ID}-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`
);

for (const file of [componentFile, cssFile]) {
  const destination = path.join(
    backup,
    path.relative(root, file)
  );

  fs.mkdirSync(path.dirname(destination), {
    recursive: true
  });

  fs.copyFileSync(file, destination);
}

try {
  fs.writeFileSync(
    componentFile,
    nextComponent,
    "utf8"
  );

  fs.writeFileSync(
    cssFile,
    nextCss,
    "utf8"
  );

  if (!SKIP_BUILD) {
    run(root, "npm", [
      "run",
      "build:pfotentechnik"
    ]);
  }

  console.log(`[${ID}] Hotfix erfolgreich.`);
} catch (error) {
  console.error(`[${ID}] Rollback ...`);

  for (const file of [componentFile, cssFile]) {
    const backupFile = path.join(
      backup,
      path.relative(root, file)
    );

    if (!fs.existsSync(backupFile)) continue;

    fs.mkdirSync(path.dirname(file), {
      recursive: true
    });

    fs.copyFileSync(backupFile, file);
  }

  console.error(`[${ID}] Rollback abgeschlossen.`);
  throw error;
}
