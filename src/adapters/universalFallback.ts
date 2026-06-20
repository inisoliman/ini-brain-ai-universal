import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, removeIfExists } from './_helpers';

export const universalFallback: AgentAdapter = {
  id: 'universal',
  displayName: 'Universal (AGENTS.md + .brain/)',
  async detectInstalled() { return true; },
  async writeSkill({ root, name, body }) {
    return [await writeText(path.join(root, '.brain', 'skills', `${name}.md`), body)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.brain', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, 'AGENTS.md'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.brain', 'skills', `${name}.md`));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.brain', 'commands', `${name}.md`));
  },
};
