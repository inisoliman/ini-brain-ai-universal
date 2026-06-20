import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

export const kimiAdapter: AgentAdapter = {
  id: 'kimi',
  displayName: 'Kimi / Pi',
  async detectInstalled(root) {
    return (await pathExists(path.join(root, '.kimi'))) ||
           (await pathExists(path.join(root, 'pi-extension')));
  },
  async writeSkill({ root, name, body }) {
    return [await writeText(path.join(root, '.kimi', 'skills', `${name}.md`), body)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.kimi', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, '.kimi', 'AGENTS.md'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.kimi', 'skills', `${name}.md`));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.kimi', 'commands', `${name}.md`));
  },
};
