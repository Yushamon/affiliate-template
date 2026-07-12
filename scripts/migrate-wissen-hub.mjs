import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const directory = path.join(root, "apps/pfotentechnik/src/content/pages");
const files = (await readdir(directory)).filter((file) => file.endsWith(".md")).sort();

const readField = (source, field) => {
  const match = source.match(new RegExp(`^${field}:\\s*(.+)$`, "m"));
  if (!match) return "";
  const value = match[1].trim();
  if (value.startsWith('"') && value.endsWith('"')) return JSON.parse(value);
  return value;
};

for (const [index, file] of files.entries()) {
  const filePath = path.join(directory, file);
  let source = await readFile(filePath, "utf8");
  const frontmatterEnd = source.indexOf("\n---", 4);
  const frontmatter = source.slice(0, frontmatterEnd);

  if (/^\s+-\s+["']?wissen["']?\s*$/m.test(frontmatter)) continue;

  if (/^hub:\s*$/m.test(frontmatter)) {
    source = source.replace(
      /(^hub:\s*\r?\n\s+sections:\s*\r?\n(?:\s+-.*\r?\n)+)/m,
      (block) => `${block}    - "wissen"\n`
    );
  } else {
    const title = readField(frontmatter, "title");
    const description = readField(frontmatter, "description") || `Mehr über ${title} erfahren.`;
    const hub = [
      "hub:",
      "  sections:",
      '    - "wissen"',
      `  title: ${JSON.stringify(title)}`,
      `  description: ${JSON.stringify(description)}`,
      '  icon: "📖"',
      `  order: ${100 + index * 10}`,
      ""
    ].join("\n");

    const updatedPattern = /(^updatedAt:\s*.*\r?\n)/m;
    const publishedPattern = /(^publishedAt:\s*.*\r?\n)/m;

    if (updatedPattern.test(source)) source = source.replace(updatedPattern, `$1${hub}`);
    else if (publishedPattern.test(source)) source = source.replace(publishedPattern, `$1${hub}`);
    else throw new Error(`Kein Datumsfeld in ${file}`);
  }

  await writeFile(filePath, source, "utf8");
  console.log(`Wissen zugeordnet: ${file}`);
}
