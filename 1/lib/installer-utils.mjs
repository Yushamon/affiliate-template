import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const packageRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const stateDirectoryName = ".pfotentechnik-platform-2.0";
const stateFileName = "state.json";

const exists = async (file) => fs.access(file).then(() => true).catch(() => false);
const normalize = (value) => value.replaceAll("\\", "/");
const stamp = () => new Date().toISOString().replace(/[:.]/g, "-");

async function atomicWrite(target, content) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  const token = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const temporary = `${target}.${token}.tmp`;
  const previous = `${target}.${token}.previous`;
  await fs.writeFile(temporary, content, "utf8");
  try {
    await fs.rename(temporary, target);
    return;
  } catch (error) {
    if (!await exists(target)) {
      await fs.rm(temporary, { force: true });
      throw error;
    }
  }
  let movedPrevious = false;
  try {
    await fs.rename(target, previous);
    movedPrevious = true;
    await fs.rename(temporary, target);
    await fs.rm(previous, { force: true });
  } catch (error) {
    await fs.rm(temporary, { force: true });
    if (movedPrevious && !await exists(target)) await fs.rename(previous, target);
    else await fs.rm(previous, { force: true });
    throw error;
  }
}

async function recordCreatedDirectories(repoRoot, target, module, save) {
  const missing = [];
  let current = path.dirname(target);
  while (current.startsWith(`${repoRoot}${path.sep}`) && current !== repoRoot) {
    if (await exists(current)) break;
    missing.push(normalize(path.relative(repoRoot, current)));
    current = path.dirname(current);
  }
  module.directories = module.directories ?? [];
  let changed = false;
  for (const directory of missing) {
    if (!module.directories.includes(directory)) {
      module.directories.push(directory);
      changed = true;
    }
  }
  if (changed) await save();
}

async function removeRecordedDirectories(repoRoot, module) {
  const directories = [...(module.directories ?? [])]
    .sort((left, right) => right.split("/").length - left.split("/").length);
  for (const directory of directories) {
    try {
      await fs.rmdir(path.join(repoRoot, directory));
    } catch (error) {
      if (!["ENOENT", "ENOTEMPTY", "EEXIST"].includes(error?.code)) throw error;
    }
  }
}

export async function resolveRepoRoot(input = process.cwd()) {
  let current = path.resolve(input);
  for (let depth = 0; depth < 5; depth += 1) {
    if (await exists(path.join(current, "package.json")) && await exists(path.join(current, "apps", "pfotentechnik", "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden. Erwartet werden package.json und apps/pfotentechnik/package.json.");
}

export function command(commandLine, { cwd, label = commandLine, allowFailure = false } = {}) {
  console.log(`\n[check] ${label}`);
  const result = spawnSync(commandLine, { cwd, shell: true, stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  const code = result.status ?? 1;
  if (code !== 0 && !allowFailure) throw new Error(`${label} ist mit Exit-Code ${code} fehlgeschlagen.`);
  return code;
}

export async function createContext(repoRoot, options = {}) {
  const stateDir = path.join(repoRoot, stateDirectoryName);
  const runId = options.runId ?? stamp();
  const backupRoot = path.join(repoRoot, ".patch-backups", "pfotentechnik-platform-2.0", runId);
  await fs.mkdir(stateDir, { recursive: true });
  await fs.mkdir(backupRoot, { recursive: true });
  const statePath = path.join(stateDir, stateFileName);
  const state = { schemaVersion: 1, packageVersion: "2.0.0", runId, repoRoot, backupRoot, startedAt: new Date().toISOString(), completedAt: null, modules: [] };
  await atomicWrite(statePath, `${JSON.stringify(state, null, 2)}\n`);

  let currentModule = null;
  const save = () => atomicWrite(statePath, `${JSON.stringify(state, null, 2)}\n`);
  const ensureModule = () => { if (!currentModule) throw new Error("Kein Installationsmodul aktiv."); return currentModule; };

  async function backup(relativePath) {
    const module = ensureModule();
    const relative = normalize(relativePath);
    const existing = module.files.find((item) => item.path === relative);
    if (existing) return existing;
    const target = path.join(repoRoot, relative);
    const existed = await exists(target);
    const backupPath = path.join(backupRoot, module.id, relative);
    if (existed) {
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      await fs.copyFile(target, backupPath);
    }
    const record = { path: relative, existed, backupPath: existed ? normalize(path.relative(repoRoot, backupPath)) : null };
    module.files.push(record);
    await save();
    return record;
  }

  async function write(relativePath, content) {
    const relative = normalize(relativePath);
    await backup(relative);
    const target = path.join(repoRoot, relative);
    await recordCreatedDirectories(repoRoot, target, ensureModule(), save);
    await atomicWrite(target, content);
  }

  async function copyPayload(relativePath, targetPath = relativePath) {
    const source = path.join(packageRoot, "payload", relativePath);
    if (!await exists(source)) throw new Error(`Payload fehlt: ${relativePath}`);
    await write(targetPath, await fs.readFile(source, "utf8"));
  }

  async function copyExternal(sourceRelative, targetPath) {
    const source = path.join(packageRoot, sourceRelative);
    if (!await exists(source)) throw new Error(`Moduldatei fehlt: ${sourceRelative}`);
    await write(targetPath, await fs.readFile(source, "utf8"));
  }

  async function edit(relativePath, transform) {
    const target = path.join(repoRoot, relativePath);
    if (!await exists(target)) throw new Error(`Zu bearbeitende Datei fehlt: ${relativePath}`);
    const before = await fs.readFile(target, "utf8");
    const after = await transform(before);
    if (typeof after !== "string") throw new Error(`${relativePath}: Transformation lieferte keinen Text.`);
    if (after === before) return false;
    await write(relativePath, after);
    return true;
  }

  async function updateJson(relativePath, updater) {
    return edit(relativePath, (source) => {
      const data = JSON.parse(source);
      const result = updater(data) ?? data;
      return `${JSON.stringify(result, null, 2)}\n`;
    });
  }

  async function rollbackModule(module = currentModule) {
    if (!module) return;
    for (const file of [...module.files].reverse()) {
      const target = path.join(repoRoot, file.path);
      if (file.existed) {
        const backupPath = path.join(repoRoot, file.backupPath);
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.copyFile(backupPath, target);
      } else {
        await fs.rm(target, { force: true });
      }
    }
    await removeRecordedDirectories(repoRoot, module);
    module.status = "rolled-back";
    module.finishedAt = new Date().toISOString();
    await save();
    currentModule = null;
  }

  return {
    repoRoot, state, statePath, backupRoot, options,
    async beginModule(id, title) {
      if (currentModule) throw new Error(`Modul ${currentModule.id} ist noch aktiv.`);
      currentModule = { id, title, status: "running", startedAt: new Date().toISOString(), finishedAt: null, files: [], directories: [], checks: [] };
      state.modules.push(currentModule);
      await save();
      console.log(`\n=== ${id}: ${title} ===`);
      return currentModule;
    },
    async finishModule() { const module = ensureModule(); module.status = "installed"; module.finishedAt = new Date().toISOString(); await save(); currentModule = null; },
    async failModule(error) { const module = ensureModule(); module.error = error instanceof Error ? error.message : String(error); await rollbackModule(module); },
    async complete() { state.completedAt = new Date().toISOString(); await save(); },
    backup, write, edit, updateJson, copyPayload, copyExternal, rollbackModule,
    get currentModule() { return currentModule; },
    async check(commandLine, label = commandLine) { const module = ensureModule(); const startedAt = new Date().toISOString(); try { command(commandLine, { cwd: repoRoot, label }); module.checks.push({ label, command: commandLine, status: "passed", startedAt, finishedAt: new Date().toISOString() }); await save(); } catch (error) { module.checks.push({ label, command: commandLine, status: "failed", error: error.message, startedAt, finishedAt: new Date().toISOString() }); await save(); throw error; } }
  };
}

export async function loadState(repoRoot) {
  const file = path.join(repoRoot, stateDirectoryName, stateFileName);
  if (!await exists(file)) throw new Error("Kein Installationsstatus gefunden.");
  return { file, state: JSON.parse(await fs.readFile(file, "utf8")) };
}

export async function rollbackRecordedModule(repoRoot, state, module) {
  for (const file of [...module.files].reverse()) {
    const target = path.join(repoRoot, file.path);
    if (file.existed) {
      const backup = path.join(repoRoot, file.backupPath);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.copyFile(backup, target);
    } else await fs.rm(target, { force: true });
  }
  await removeRecordedDirectories(repoRoot, module);
  module.status = "rolled-back";
  module.finishedAt = new Date().toISOString();
}

export const appendOnce = (source, marker, block) => source.includes(marker) ? source : `${source.replace(/\s*$/, "")}\n\n${block.trim()}\n`;
export function replaceRequired(source, search, replacement, label) {
  if (typeof search === "string") {
    if (!source.includes(search)) throw new Error(`Anker nicht gefunden: ${label}`);
    return source.replace(search, replacement);
  }
  if (!search.test(source)) throw new Error(`Anker nicht gefunden: ${label}`);
  return source.replace(search, replacement);
}
