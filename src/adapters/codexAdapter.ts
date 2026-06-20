import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

export const codexAdapter: AgentAdapter = {
  id: 'codex',
  displayName: 'Codex CLI / App',
  async detectInstalled(root) {
    return (await pathExists(path.join(root, '.codex'))) ||
           (await pathExists(path.join(root, '.codex-plugin')));
  },
  async writeSkill({ root, name, body }) {
    return [await writeText(path.join(root, '.codex', 'skills', name, 'SKILL.md'), body)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.codex', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, '.codex', 'AGENTS.md'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.codex', 'skills', name));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.codex', 'commands', `${name}.md`));
  },
};
