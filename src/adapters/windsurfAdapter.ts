import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

export const windsurfAdapter: AgentAdapter = {
  id: 'windsurf',
  displayName: 'Windsurf',
  async detectInstalled(root) {
    return await pathExists(path.join(root, '.windsurf'));
  },
  async writeSkill({ root, name, body }) {
    return [await writeText(path.join(root, '.windsurf', 'rules', `${name}.md`), body)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.windsurf', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, '.windsurfrules'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.windsurf', 'rules', `${name}.md`));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.windsurf', 'commands', `${name}.md`));
  },
};
