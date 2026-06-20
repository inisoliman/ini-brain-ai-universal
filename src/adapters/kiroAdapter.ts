import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

export const kiroAdapter: AgentAdapter = {
  id: 'kiro',
  displayName: 'Kiro',
  async detectInstalled(root) {
    return await pathExists(path.join(root, '.kiro'));
  },
  async writeSkill({ root, name, body }) {
    return [await writeText(path.join(root, '.kiro', 'steering', `${name}.md`), body)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.kiro', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, '.kiro', 'AGENTS.md'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.kiro', 'steering', `${name}.md`));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.kiro', 'commands', `${name}.md`));
  },
};
