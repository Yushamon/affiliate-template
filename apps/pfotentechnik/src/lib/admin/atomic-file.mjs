import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const exists = async (file) => fs.access(file).then(() => true).catch(() => false);

export async function atomicWriteFile(file, content, encoding) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const token = `${process.pid}-${randomUUID()}`;
  const temporary = `${file}.${token}.tmp`;
  const previous = `${file}.${token}.previous`;
  await fs.writeFile(temporary, content, encoding);

  try {
    await fs.rename(temporary, file);
    return;
  } catch (error) {
    if (!await exists(file)) {
      await fs.rm(temporary, { force: true });
      throw error;
    }
  }

  let movedPrevious = false;
  try {
    await fs.rename(file, previous);
    movedPrevious = true;
    await fs.rename(temporary, file);
    await fs.rm(previous, { force: true });
  } catch (error) {
    await fs.rm(temporary, { force: true });
    if (movedPrevious && !await exists(file)) await fs.rename(previous, file);
    else await fs.rm(previous, { force: true });
    throw error;
  }
}
