#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ID = "pfotentechnik-comparison-missing-data-ux-1.0.0";
const CHECK = process.argv.includes("--check");
const SKIP_BUILD = process.argv.includes("--skip-build");
const COMPONENT = "packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro";
const CSS = "packages/affiliate-core/src/components/comparison/comparison.css";

const OLD = `        <dl class="comparison-mobile-product__values">
          {rows.map((row) => {
            const cell = row.cells.find(
              (entry) => entry.productSlug === product.slug
            );

            const value =
              cell?.value && cell.value !== "–"
                ? cell.value
                : "Keine Angabe";

            return (
              <div
                data-mobile-criterion
                data-has-differences={String(row.hasDifferences)}
              >
                <dt>{row.criterion.label}</dt>
                <dd>{value}</dd>
              </div>
            );
          })}
        </dl>`;

const NEW = `        {(() => {
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
            <dl class="comparison-mobile-product__values">
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

const MARKER = "/* PT comparison missing-data UX 1.0.0 */";
const CSS_BLOCK = `
${MARKER}
.comparison-mobile-product__values [data-missing="true"] dd {
  color: var(--comparison-muted);
}
.comparison-missing-value {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: .4rem;
  color: var(--comparison-muted);
  font-size: .9em;
  font-style: italic;
  line-height: 1.4;
}
.comparison-missing-value::before {
  display: inline-grid;
  width: 1.05rem;
  height: 1.05rem;
  flex: 0 0 1.05rem;
  place-items: center;
  border: 1px solid color-mix(in srgb,var(--comparison-muted) 38%,transparent);
  border-radius: 999px;
  content: "i";
  font-size: .68rem;
  font-style: normal;
  font-weight: 800;
  line-height: 1;
}
.comparison-mobile-product__missing-group {
  align-items: start;
  background: color-mix(in srgb,var(--comparison-muted) 4%,var(--comparison-surface));
}
.comparison-mobile-product__missing-group dd,
.comparison-mobile-product__missing-group details {
  min-width: 0;
  width: 100%;
}
.comparison-mobile-product__missing-group summary {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  justify-content: flex-end;
  gap: .45rem;
  color: var(--comparison-muted);
  font-size: .91rem;
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
  margin: .7rem 0 .45rem;
  color: var(--comparison-muted);
  font-size: .8rem;
  line-height: 1.45;
  text-align: left;
}
.comparison-mobile-product__missing-group ul {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: .35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.comparison-mobile-product__missing-group li {
  padding: .3rem .48rem;
  border: 1px solid var(--comparison-line);
  border-radius: 999px;
  color: var(--comparison-muted);
  background: var(--comparison-surface);
  font-size: .7rem;
  font-weight: 700;
  line-height: 1.2;
}
`;

function fail(message) { throw new Error(message); }

function root() {
  let current = process.cwd();
  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps/pfotentechnik")) &&
      fs.existsSync(path.join(current, "packages/affiliate-core"))
    ) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  fail("Repository-Hauptverzeichnis nicht gefunden.");
}

function run(cwd, command, args) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) {
    fail(`${command} ${args.join(" ")} fehlgeschlagen (Exit ${result.status}).`);
  }
}

const repo = root();
const componentFile = path.join(repo, COMPONENT);
const cssFile = path.join(repo, CSS);
if (!fs.existsSync(componentFile)) fail(`Fehlt: ${COMPONENT}`);
if (!fs.existsSync(cssFile)) fail(`Fehlt: ${CSS}`);

const component = fs.readFileSync(componentFile, "utf8");
const css = fs.readFileSync(cssFile, "utf8");

let nextComponent = component;
if (!component.includes(NEW)) {
  const count = component.split(OLD).length - 1;
  if (count !== 1) fail(`Komponenten-Anker ${count} Mal gefunden.`);
  nextComponent = component.replace(OLD, NEW);
}

const nextCss = css.includes(MARKER)
  ? css
  : `${css.trimEnd()}\n\n${CSS_BLOCK.trim()}\n`;

console.log(`[${ID}] Repository: ${repo}`);
console.log(`[${ID}] ${nextComponent === component ? "OK" : "ÄNDERN"}: ${COMPONENT}`);
console.log(`[${ID}] ${nextCss === css ? "OK" : "ÄNDERN"}: ${CSS}`);

if (CHECK) {
  console.log(`[${ID}] Vorprüfung erfolgreich.`);
  process.exit(0);
}

const backup = path.join(
  repo,
  ".patch-backups",
  `${ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

for (const file of [componentFile, cssFile]) {
  const target = path.join(backup, path.relative(repo, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

try {
  fs.writeFileSync(componentFile, nextComponent, "utf8");
  fs.writeFileSync(cssFile, nextCss, "utf8");
  if (!SKIP_BUILD) run(repo, "npm", ["run", "build:pfotentechnik"]);
  console.log(`[${ID}] UI-Patch erfolgreich.`);
} catch (error) {
  console.error(`[${ID}] Rollback ...`);
  for (const file of [componentFile, cssFile]) {
    const source = path.join(backup, path.relative(repo, file));
    if (fs.existsSync(source)) fs.copyFileSync(source, file);
  }
  console.error(`[${ID}] Rollback abgeschlossen.`);
  throw error;
}
