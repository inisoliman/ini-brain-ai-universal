/**
 * Superpowers Skills Engine — composable skills.
 * Inspired by https://github.com/obra/superpowers (MIT).
 */
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Skill {
  id: string;
  title: string;
  body: string;
  references: string[];
}

const BOOTSTRAP_BODY = `# Using Superpowers

You are an agent with access to composable skills. Before any non-trivial task:

1. Check available skills in \`.brain/skills/\`.
2. If a skill matches your task, follow it.
3. Skills can reference other skills via \`@skill-name\` — resolve transitively.
4. If no skill matches, ask: "Would you like me to create a skill for this?".

Skills are version-controlled and shared across the team.
Always prefer reusing an existing skill over reinventing the workflow.
`;

export async function deployBootstrap(root: string): Promise<string[]> {
  const file = path.join(root, '.brain', 'skills', 'using-superpowers.md');
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, BOOTSTRAP_BODY, 'utf8');
  return [file];
}

const REFERENCE_REGEX = /@([a-z][a-z0-9-]*)/gi;

export function extractReferences(body: string): string[] {
  const refs = new Set<string>();
  let m;
  while ((m = REFERENCE_REGEX.exec(body)) !== null) {
    refs.add(m[1]);
  }
  return [...refs];
}

export async function loadSkill(root: string, id: string): Promise<Skill | null> {
  const file = path.join(root, '.brain', 'skills', `${id}.md`);
  try {
    const body = await fs.readFile(file, 'utf8');
    const titleMatch = body.match(/^#\s+(.+)$/m);
    return {
      id,
      title: titleMatch?.[1]?.trim() ?? id,
      body,
      references: extractReferences(body),
    };
  } catch {
    return null;
  }
}

export async function resolveSkillChain(root: string, startId: string, maxDepth = 5): Promise<Skill[]> {
  const visited = new Set<string>();
  const chain: Skill[] = [];
  async function visit(id: string, depth: number): Promise<void> {
    if (depth >= maxDepth || visited.has(id)) return;
    visited.add(id);
    const skill = await loadSkill(root, id);
    if (!skill) return;
    chain.push(skill);
    for (const ref of skill.references) {
      await visit(ref, depth + 1);
    }
  }
  await visit(startId, 0);
  return chain;
}

export async function listSkills(root: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(path.join(root, '.brain', 'skills'));
    return entries.filter(e => e.endsWith('.md')).map(e => e.replace(/\.md$/, ''));
  } catch {
    return [];
  }
}
