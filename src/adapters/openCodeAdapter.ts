import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { AgentAdapter } from './types';
import { pathExists } from './_helpers';

const MARKER = '<!-- INI Brain managed sha256:';

function validateName(name: string): void {
  if (name.length > 64 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) throw new Error('Invalid OpenCode name: use 1-64 lowercase alphanumeric characters with single hyphens.');
}

function managedBody(body: string): string {
  return `${body.trimEnd()}\n\n${MARKER}${createHash('sha256').update(body.trimEnd()).digest('hex')} -->\n`;
}

function isUnmodifiedManaged(body: string): boolean {
  const match = /\n\n<!-- INI Brain managed sha256:([a-f0-9]{64}) -->\n$/.exec(body);
  return Boolean(match && createHash('sha256').update(body.slice(0, match.index)).digest('hex') === match[1]);
}

async function writeManaged(file: string, body: string): Promise<string[]> {
  const current = await fs.readFile(file, 'utf8').catch(error => { if (error.code === 'ENOENT') return undefined; throw error; });
  const next = managedBody(body);
  if (current === next) return [file];
  if (current !== undefined && !isUnmodifiedManaged(current)) throw new Error('Refusing to overwrite a user-owned OpenCode file. Merge manually.');
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, next, 'utf8');
  return [file];
}

async function removeManaged(file: string): Promise<void> {
  const current = await fs.readFile(file, 'utf8').catch(error => { if (error.code === 'ENOENT') return ''; throw error; });
  if (isUnmodifiedManaged(current)) await fs.unlink(file);
}

function frontmatter(name: string, body: string, skill: boolean): string {
  validateName(name);
  // Shared source skills may already carry YAML. Keep their body, emit the two
  // documented scalar fields deterministically rather than forwarding invalid YAML.
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(body);
  const rawDescription = match?.[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  let description = rawDescription || body.replace(/^---[\s\S]*?---\s*/, '').split(/\r?\n/).find(line => line.trim())?.replace(/^#+\s*/, '') || `INI Brain ${name}`;
  if (description.startsWith('"')) { try { description = JSON.parse(description); } catch { throw new Error('Invalid OpenCode description.'); } }
  else if (description.startsWith("'") && description.endsWith("'")) description = description.slice(1, -1).replace(/''/g, "'");
  if (!description.trim() || description.length > 1024 || description === '|' || description === '>') throw new Error('OpenCode description must be a 1-1024 character scalar.');
  const declaredName = match?.[1].match(/^name:\s*(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  if (skill && declaredName && declaredName !== name) throw new Error('OpenCode skill name must match its directory.');
  return `---\n${skill ? `name: ${name}\n` : ''}description: ${JSON.stringify(description)}\n---\n${match ? body.slice(match[0].length) : body}`;
}

export const openCodeAdapter: AgentAdapter = {
  id: 'opencode',
  displayName: 'OpenCode',
  async detectInstalled(root) {
    return (await pathExists(path.join(root, '.opencode'))) || (await pathExists(path.join(root, 'opencode.json'))) || (await pathExists(path.join(root, 'opencode.jsonc')));
  },
  async writeSkill({ root, name, body }) {
    const rendered = frontmatter(name, body, true);
    return writeManaged(path.join(root, '.opencode', 'skills', name, 'SKILL.md'), rendered);
  },
  async writeCommand({ root, name, body }) {
    return writeManaged(path.join(root, '.opencode', 'commands', `${name}.md`), frontmatter(name, body, false));
  },
  async writeAgentsFile({ root, body }) {
    const file = path.join(root, 'AGENTS.md');
    // Root AGENTS is shared with other agents; its owner controls existing text.
    if (await pathExists(file)) return [file];
    return writeManaged(file, body);
  },
  async removeSkill(root, name) {
    validateName(name);
    await removeManaged(path.join(root, '.opencode', 'skills', name, 'SKILL.md'));
    // Legacy flat files are user-owned: never delete them during migration.
  },
  async removeCommand(root, name) {
    validateName(name);
    await removeManaged(path.join(root, '.opencode', 'commands', `${name}.md`));
  }
};
