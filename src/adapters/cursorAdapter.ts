import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

export const cursorAdapter: AgentAdapter = {
  id: 'cursor',
  displayName: 'Cursor',
  async detectInstalled(root) {
    return (await pathExists(path.join(root, '.cursor'))) ||
           (await pathExists(path.join(root, '.cursorrules')));
  },
  async writeSkill({ root, name, body }) {
    const mdcBody = `---\ndescription: ${name} skill\nalwaysApply: false\n---\n\n${body}`;
    return [await writeText(path.join(root, '.cursor', 'rules', `${name}.mdc`), mdcBody)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.cursor', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, '.cursorrules'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.cursor', 'rules', `${name}.mdc`));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.cursor', 'commands', `${name}.md`));
  },
};
