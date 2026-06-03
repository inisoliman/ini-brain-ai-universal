import * as fs from 'fs/promises';
import * as path from 'path';
import { MemoryStore } from './memoryStore';

export class ContextBuilder {
  constructor(private readonly root: string) {}

  async build(task: string, budgetChars = 12000): Promise<string> {
    const brainDir = path.join(this.root, '.brain');
    const compact = await readText(path.join(brainDir, 'compact_context.md'), 'No compact context found. Run INI Brain: Scan Project first.');
    const workflow = await readText(path.join(brainDir, 'workflow.md'), '');
    const skills = await readText(path.join(brainDir, 'skills.md'), '');
    const quality = await readText(path.join(brainDir, 'quality_gates.md'), '');
    const decisions = await readText(path.join(brainDir, 'decisions.md'), '');
    const tasks = await readText(path.join(brainDir, 'tasks.md'), '');
    const memory = await new MemoryStore(this.root).buildContext(task, Math.floor(budgetChars / 3));
    const combined = [
      '<ini-brain-context>',
      `Task: ${task}`,
      '',
      '## Runtime Memory',
      memory || '- No relevant runtime memories found.',
      '',
      '## Compact Project Context',
      compact,
      '',
      workflow ? `## Workflow\n${workflow.slice(0, 2200)}` : '',
      skills ? `## Skills\n${skills.slice(0, 2200)}` : '',
      quality ? `## Quality Gates\n${quality.slice(0, 1600)}` : '',
      decisions ? `## Decisions\n${decisions.slice(0, 1600)}` : '',
      tasks ? `## Tasks\n${tasks.slice(0, 1200)}` : '',
      '</ini-brain-context>',
      '',
      'Agent instruction: use this context before editing, verify current files, and save durable discoveries with ini_brain_save_memory.'
    ].filter(Boolean).join('\n');
    return combined.length <= budgetChars ? combined : `${combined.slice(0, budgetChars)}\n<!-- ini brain context truncated -->`;
  }
}

async function readText(file: string, fallback: string): Promise<string> {
  try {
    return await fs.readFile(file, 'utf8');
  } catch {
    return fallback;
  }
}
