import fs from "node:fs";
import path from "node:path";

export const walkFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    return entry.isDirectory() ? walkFiles(target) : [target];
  });
};

const scalar = (value = "") => {
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === "true";
  if (/^(null|~)$/i.test(trimmed)) return null;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^(["'])([\s\S]*)\1$/, "$2");
};

const inlineArray = (value) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;
  return trimmed.slice(1, -1).split(",").map(scalar).filter((item) => item !== "");
};

/** Konservativer Frontmatter-Parser für die von den Audits benötigten Felder. */
export const parseFrontmatter = (source) => {
  const match = String(source).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { data: {}, body: String(source), raw: "" };
  const lines = match[1].split(/\r?\n/);
  const root = {};
  const stack = [{ indent: -1, value: root }];

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    if (!raw.trim() || raw.trimStart().startsWith("#")) continue;
    const indent = raw.match(/^\s*/)?.[0].length ?? 0;
    const line = raw.trim();
    while (stack.length > 1 && indent <= stack.at(-1).indent) stack.pop();
    const parent = stack.at(-1).value;

    const list = line.match(/^-\s*(.*)$/);
    if (list) {
      if (Array.isArray(parent)) parent.push(scalar(list[1]));
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!pair || Array.isArray(parent)) continue;
    const [, key, rawValue = ""] = pair;
    if (rawValue) {
      parent[key] = inlineArray(rawValue) ?? scalar(rawValue);
      continue;
    }

    const next = lines.slice(index + 1).find((candidate) => candidate.trim() && !candidate.trimStart().startsWith("#"));
    const child = next && (next.match(/^\s*/)?.[0].length ?? 0) > indent && next.trimStart().startsWith("-") ? [] : {};
    parent[key] = child;
    stack.push({ indent, value: child });
  }

  return { data: root, body: source.slice(match[0].length).trim(), raw: match[1] };
};

export const asStringArray = (value) => {
  if (Array.isArray(value)) return value.flatMap(asStringArray).filter(Boolean);
  if (value == null || typeof value === "object") return [];
  const text = String(value).trim();
  return text ? [text] : [];
};

export const normalizeSlug = (value = "") => String(value)
  .trim().toLocaleLowerCase("de-DE").normalize("NFKD")
  .replace(/\p{Diacritic}/gu, "").replace(/ß/g, "ss")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const stripMarkdown = (value = "") => String(value)
  .replace(/```[\s\S]*?```/g, " ")
  .replace(/`[^`]*`/g, " ")
  .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
  .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
  .replace(/<[^>]+>/g, " ")
  .replace(/^#{1,6}\s+.*$/gm, " ")
  .replace(/\s+/g, " ").trim();
