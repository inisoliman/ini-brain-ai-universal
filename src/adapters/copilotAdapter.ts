import * as path from 'path';
import * as fs from 'fs/promises';
import { AgentAdapter } from './types';
import { writeText, pathExists } from './_helpers';

export const copilotAdapter: AgentAdapter = {
  id: 'copilot',
  displayName: 'GitHub Copilot',
  async detectInstalled(root) {
    return await pathExists(path.join(root, '.github'));
  },
  async writeSkill({ root, name, body }) {
    const file = path.join(root, '.github', 'copilot-instructions.md');
    await fs.mkdir(path.dirname(file), { recursive: true });
    let existing = '';
    try { existing = await fs.readFile(file, 'utf8'); } catch {}
    const marker = `<!-- ini-brain:skill:${name} -->`;
    const endMarker = `<!-- /ini-brain:skill:${name} -->`;
    const section = `\n\n${marker}\n${body}\n${endMarker}\n`;
    if (existing.includes(marker)) {
      const re = new RegExp(`${marker}[\\s\\S]*?${endMarker}\n?`, 'g');
      existing = existing.replace(re, '');
    }
    await fs.writeFile(file, existing.trimEnd() + section, 'utf8');
    return [file];
  },
  async writeCommand({ root, name, body }) {
    return this.writeSkill({ root, name: `command-${name}`, body });
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, '.github', 'copilot-instructions.md'), body)];
  },
  async removeSkill(root, name) {
    const file = path.join(root, '.github', 'copilot-instructions.md');
    try {
      let existing = await fs.readFile(file, 'utf8');
      const marker = `<!-- ini-brain:skill:${name} -->`;
      const endMarker = `<!-- /ini-brain:skill:${name} -->`;
      const re = new RegExp(`${marker}[\\s\\S]*?${endMarker}\n?`, 'g');
      existing = existing.replace(re, '').trimEnd() + '\n';
      await fs.writeFile(file, existing, 'utf8');
    } catch {}
  },
  async removeCommand(root, name) {
    return this.removeSkill(root, `command-${name}`);
  },
};
