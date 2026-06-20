/**
 * Claude Lean rules for INI Brain AI Universal.
 * Inspired by https://github.com/drona23/claude-token-efficient (MIT).
 */
import * as fs from 'fs/promises';
import * as path from 'path';

const CLAUDE_LEAN_RULES = `# Claude Lean Mode

Output cost dominates at scale. Apply these rules to every response:

1. No preamble. Answer the question first.
2. No sycophancy: drop "Sure!", "Great question!", "Absolutely!".
3. No closing wrap-up: drop "I hope this helps!", "Let me know if...".
4. Don't restate the question.
5. No unsolicited suggestions or alternatives.
6. No smart quotes (' ' " "). Use ASCII quotes.
7. No em-dashes (—). Use commas, periods, or parens.
8. No "the user", refer directly: "you".
9. Code first when code is asked. Explanation second, only if requested.
10. Lists over paragraphs when applicable.

What you DO keep:
- Necessary clarifications when ambiguous.
- Warnings when proposing destructive actions.
- Citations when claiming facts.

When the user prefers verbose: they override; comply.
`;

export async function deployClaudeLeanLocal(root: string): Promise<string[]> {
  const written: string[] = [];
  const targets = [
    path.join(root, '.brain', 'skills', 'claude-lean.md'),
    path.join(root, 'CLAUDE.md'),
  ];
  for (const target of targets) {
    await fs.mkdir(path.dirname(target), { recursive: true });
    // For CLAUDE.md, append if exists to preserve user content
    if (target.endsWith('CLAUDE.md')) {
      try {
        const existing = await fs.readFile(target, 'utf8');
        if (!existing.includes('# Claude Lean Mode')) {
          await fs.writeFile(target, existing.trimEnd() + '\n\n' + CLAUDE_LEAN_RULES, 'utf8');
        }
      } catch {
        await fs.writeFile(target, CLAUDE_LEAN_RULES, 'utf8');
      }
    } else {
      await fs.writeFile(target, CLAUDE_LEAN_RULES, 'utf8');
    }
    written.push(target);
  }
  return written;
}

export async function removeClaudeLeanLocal(root: string): Promise<void> {
  await fs.rm(path.join(root, '.brain', 'skills', 'claude-lean.md'), { force: true }).catch(() => undefined);
  // CLAUDE.md: only remove the appended section
  try {
    const file = path.join(root, 'CLAUDE.md');
    const content = await fs.readFile(file, 'utf8');
    const idx = content.indexOf('# Claude Lean Mode');
    if (idx >= 0) {
      const before = content.slice(0, idx).trimEnd();
      if (before.length === 0) {
        await fs.rm(file, { force: true });
      } else {
        await fs.writeFile(file, before + '\n', 'utf8');
      }
    }
  } catch {
    // ignore
  }
}

export function getClaudeLeanRules(): string {
  return CLAUDE_LEAN_RULES;
}
