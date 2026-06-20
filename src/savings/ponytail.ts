/**
 * Ponytail integration for INI Brain AI Universal.
 * Skill text adapted from https://github.com/DietrichGebert/ponytail (MIT © Dietrich Gebert).
 */
import * as fs from 'fs/promises';
import * as path from 'path';

export type PonytailMode = 'lite' | 'full' | 'ultra';

const PONYTAIL_CORE = `# Ponytail — Lazy Senior Dev Mode

You are a lazy senior developer. Lazy means efficient, not careless.
The best code is the code never written.

Before writing any code, stop at the first rung that holds:

1. Does this need to be built at all? (YAGNI)
2. Does the standard library already do this? Use it.
3. Does a native platform feature cover it? Use it.
4. Does an already-installed dependency solve it? Use it.
5. Can this be one line? Make it one line.
6. Only then: write the minimum code that works.

## Rules

- No abstractions that weren't explicitly requested.
- No new dependency if it can be avoided.
- No boilerplate nobody asked for.
- Deletion over addition. Boring over clever. Fewest files possible.
- Question complex requests: "Do you actually need X, or does Y cover it?"
- Mark intentional simplifications with a \`ponytail:\` comment.

## Never Lazy About

- Input validation at trust boundaries.
- Error handling that prevents data loss.
- Security and authentication.
- Accessibility (a11y).
- Anything explicitly requested by the user.

Non-trivial logic leaves ONE runnable check behind
(assert-based self-check or one small test file).
`;

const PONYTAIL_ULTRA_SUFFIX = `

## Ultra Mode (aggressive)

- If a function is under 5 lines, inline it at the call site.
- If a file exports one thing, prefer co-locating it.
- Prefer expression-bodied returns over multi-statement blocks.
- Delete dead branches the moment they're spotted.
`;

const PONYTAIL_LITE_BODY = `# Ponytail Lite — YAGNI Only

Before writing code, ask: "Does this need to exist?"
If no, skip it. If yes, keep it minimal.

Never compromise on: validation, error handling, security, accessibility.
`;

export function renderPonytailSkill(mode: PonytailMode): string {
  if (mode === 'lite') return PONYTAIL_LITE_BODY;
  if (mode === 'ultra') return PONYTAIL_CORE + PONYTAIL_ULTRA_SUFFIX;
  return PONYTAIL_CORE;
}

export const PONYTAIL_COMMANDS: Record<string, string> = {
  'ponytail-review.md': `# /ponytail-review

Review the current file under Ponytail rules. Output:
- Lines that can be deleted with no behavior change.
- Abstractions that have only one caller.
- Dependencies imported but barely used.
- Boilerplate that adds no value.

End with: total LOC before → estimated LOC after.
`,
  'ponytail-audit.md': `# /ponytail-audit

Walk the workspace and produce JSON:
{
  "unused_dependencies": [...],
  "single_caller_abstractions": [...],
  "files_under_3_lines": [...],
  "estimated_savings_loc": number
}
`,
  'ponytail-debt.md': `# /ponytail-debt

Find technical debt that violates the lazy ladder:
- New wrappers around stdlib.
- Polyfills for features the runtime already has.
- Custom utilities duplicating dep functionality.

Output: priority-ranked list with suggested deletion path.
`,
  'ponytail-gain.md': `# /ponytail-gain

Before any new feature, run this checklist:
1. Will the user actually use this within 30 days?
2. Is there a one-line stdlib/platform alternative?
3. Can it be a comment in existing code instead?
4. What is the deletion cost if requirements change?

Only proceed if answers justify the cost.
`,
  'ponytail-help.md': `# /ponytail-help

Ponytail commands: /ponytail-review, /ponytail-audit, /ponytail-debt, /ponytail-gain.
Modes: lite, full, ultra. Toggle via INI Brain settings.
`,
};

export interface PonytailDeployOptions {
  root: string;
  mode: PonytailMode;
}

export async function deployPonytailLocal(opts: PonytailDeployOptions): Promise<string[]> {
  const skillBody = renderPonytailSkill(opts.mode);
  const written: string[] = [];
  const skillFile = path.join(opts.root, '.brain', 'skills', 'ponytail.md');
  await fs.mkdir(path.dirname(skillFile), { recursive: true });
  await fs.writeFile(skillFile, skillBody, 'utf8');
  written.push(skillFile);

  for (const [name, body] of Object.entries(PONYTAIL_COMMANDS)) {
    const file = path.join(opts.root, '.brain', 'commands', name);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, body, 'utf8');
    written.push(file);
  }
  return written;
}

export async function removePonytailLocal(root: string): Promise<void> {
  await fs.rm(path.join(root, '.brain', 'skills', 'ponytail.md'), { force: true }).catch(() => undefined);
  for (const name of Object.keys(PONYTAIL_COMMANDS)) {
    await fs.rm(path.join(root, '.brain', 'commands', name), { force: true }).catch(() => undefined);
  }
}
