import * as fs from 'fs/promises';
import * as path from 'path';

export interface UpstreamState {
  [sourceId: string]: {
    lastSha: string;
    lastCheck: string;
    lastApply?: string;
  };
}

const FILE = '.brain/upstream-state.json';

export async function readState(root: string): Promise<UpstreamState> {
  try {
    return JSON.parse(await fs.readFile(path.join(root, FILE), 'utf8'));
  } catch { return {}; }
}

export async function writeState(root: string, state: UpstreamState): Promise<void> {
  const file = path.join(root, FILE);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(state, null, 2), 'utf8');
}
