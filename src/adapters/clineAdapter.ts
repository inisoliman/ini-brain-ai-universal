import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

export const clineAdapter: AgentAdapter = {
  id: 'cline',
  displayName: 'Cline',
  async detectInstalled(root) {
    return (await pathExists(path.join(root, '.clinerules'))) ||
           (await pathExists(path.join(root, '.cline')));
  },
  async writeSkill({ root, name, body }) {
    return [
      await writeText(path.join(root, '.clinerules', 'skills', `${name}.md`), body),
      await writeText(path.join(root, '.cline', 'skills', `${name}.md`), body),
    ];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.clinerules', 'workflows', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [
      await writeText(path.join(root, '.clinerules', 'AGENTS.md'), body),
      await writeText(path.join(root, 'AGENTS.md'), body),
    ];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.clinerules', 'skills', `${name}.md`));
    await removeIfExists(path.join(root, '.cline', 'skills', `${name}.md`));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.clinerules', 'workflows', `${name}.md`));
  },
};
