import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

export const openCodeAdapter: AgentAdapter = {
  id: 'opencode',
  displayName: 'OpenCode',
  async detectInstalled(root) {
    return (await pathExists(path.join(root, '.opencode'))) ||
           (await pathExists(path.join(root, 'opencode.json')));
  },
  async writeSkill({ root, name, body }) {
    return [await writeText(path.join(root, '.opencode', 'skills', `${name}.md`), body)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.opencode', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, '.opencode', 'AGENTS.md'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.opencode', 'skills', `${name}.md`));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.opencode', 'commands', `${name}.md`));
  },
};
