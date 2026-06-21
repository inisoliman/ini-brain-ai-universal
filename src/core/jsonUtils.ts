import * as fs from 'fs/promises';
import * as path from 'path';

export function stripJsonBom(text: string): string {
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
}

export function parseJsonText<T>(text: string): T {
  return JSON.parse(stripJsonBom(text)) as T;
}

export async function readJsonFile<T>(file: string, fallback: T): Promise<T> {
  try {
    return parseJsonText<T>(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if (isErrorCode(error, 'ENOENT')) return fallback;
    throw error;
  }
}

export async function writeJsonFile(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8' });
}

function isErrorCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === code;
}
