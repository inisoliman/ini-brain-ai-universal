import * as fs from 'fs/promises';
import * as path from 'path';

export async function writeText(file: string, body: string): Promise<string> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, body, 'utf8');
  return file;
}

export async function pathExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

export async function removeIfExists(p: string): Promise<void> {
  await fs.rm(p, { force: true, recursive: true }).catch(() => undefined);
}
