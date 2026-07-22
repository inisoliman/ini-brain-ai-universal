import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

/**
 * Kilo Code adapter. Kilo reads project configuration from `.kilo/`
 * (commands in `.kilo/command/`, agents in `.kilo/agent/`, `kilo.json`) and
 * the shared root `AGENTS.md`. Skills are mirrored into `.kilo/skills/` so
 * Kilo sessions load the same guidance as every other agent without keeping
 * a separate brain.
 */
export const kiloCodeAdapter: AgentAdapter = {
  id: 'kilo-code',
  displayName: 'Kilo Code',
  async detectInstalled(root) {
    return (await pathExists(path.join(root, '.kilo'))) ||
           (await pathExists(path.join(root, 'kilo.json')));
  },
  async writeSkill({ root, name, body }) {
    return [
      await writeText(path.join(root, '.kilo', 'skills', `${name}.md`), body),
    ];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.kilo', 'command', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [
      await writeText(path.join(root, 'AGENTS.md'), body),
    ];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.kilo', 'skills', `${name}.md`));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.kilo', 'command', `${name}.md`));
  },
};
