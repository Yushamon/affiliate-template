import fs from "node:fs";
import path from "node:path";
import { normalizeResearchStore } from "../../src/lib/seo/research/schema.ts";

const APP = path.resolve(import.meta.dirname, "../..");
const STORE = path.join(APP, "research", "research.json");
const args = process.argv.slice(2);
const input = args.find((argument) => !argument.startsWith("--"));
const check = args.includes("--check");

const resolveInputFile = () => {
  if (input) return path.resolve(process.cwd(), input);
  if (check) return STORE;
  return null;
};

const file = resolveInputFile();

if (!file) {
  console.error(
    "Nutzung: npm --workspace apps/pfotentechnik run research:import -- ./research-import.json"
  );
  process.exit(1);
}

if (!fs.existsSync(file)) {
  console.error(
    check && file === STORE
      ? `Research-Store fehlt: ${STORE}`
      : `Importdatei fehlt: ${file}`
  );
  process.exit(1);
}

try {
  const normalized = normalizeResearchStore(
    JSON.parse(fs.readFileSync(file, "utf8"))
  );

  if (check) {
    const label = file === STORE ? "Research-Store" : "Research-Import";
    console.log(`${label} gültig: ${normalized.items.length} Einträge.`);
    process.exit(0);
  }

  const previous = fs.existsSync(STORE)
    ? JSON.parse(fs.readFileSync(STORE, "utf8"))
    : { items: [] };

  const byId = new Map(
    (Array.isArray(previous.items) ? previous.items : []).map((item) => [
      item.id,
      item
    ])
  );

  const merged = {
    ...normalized,
    updatedAt: new Date().toISOString(),
    items: normalized.items.map((item) => {
      const old = byId.get(item.id);
      return old
        ? {
            ...item,
            discoveredAt: old.discoveredAt ?? item.discoveredAt,
            status: ["implemented", "rejected"].includes(old.status)
              ? old.status
              : item.status
          }
        : item;
    })
  };

  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  fs.writeFileSync(STORE, JSON.stringify(merged, null, 2) + "\n");
  console.log(`Research importiert: ${merged.items.length} Einträge.`);
} catch (error) {
  console.error(
    `Research-${check ? "Prüfung" : "Import"} fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
}
