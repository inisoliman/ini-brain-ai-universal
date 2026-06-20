import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

export const claudeAdapter: AgentAdapter = {
  id: 'claude',
  displayName: 'Claude Code',
  async detectInstalled(root) {
    return (await pathExists(path.join(root, '.claude'))) ||
           (await pathExists(path.join(root, 'CLAUDE.md')));
  },
  async writeSkill({ root, name, body }) {
    return [await writeText(path.join(root, '.claude', 'skills', name, 'SKILL.md'), body)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.claude', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, 'CLAUDE.md'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.claude', 'skills', name));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.claude', 'commands', `${name}.md`));
  },
};
