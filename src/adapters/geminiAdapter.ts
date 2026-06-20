import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

export const geminiAdapter: AgentAdapter = {
  id: 'gemini',
  displayName: 'Gemini CLI',
  async detectInstalled(root) {
    return (await pathExists(path.join(root, '.gemini'))) ||
           (await pathExists(path.join(root, 'gemini-extension.json')));
  },
  async writeSkill({ root, name, body }) {
    return [await writeText(path.join(root, '.gemini', 'skills', `${name}.md`), body)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.gemini', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, '.gemini', 'GEMINI.md'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.gemini', 'skills', `${name}.md`));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.gemini', 'commands', `${name}.md`));
  },
};
