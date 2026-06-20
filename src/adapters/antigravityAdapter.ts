import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

export const antigravityAdapter: AgentAdapter = {
  id: 'antigravity',
  displayName: 'Antigravity (Gemini CLI 2)',
  async detectInstalled(root) {
    return await pathExists(path.join(root, '.agents'));
  },
  async writeSkill({ root, name, body }) {
    return [await writeText(path.join(root, '.agents', 'skills', `${name}.md`), body)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.agents', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, '.agents', 'rules', 'agents.md'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.agents', 'skills', `${name}.md`));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.agents', 'commands', `${name}.md`));
  },
};
