/**
 * Caveman integration for INI Brain AI Universal.
 * Skill philosophy adapted from https://github.com/JuliusBrussee/caveman (MIT).
 */
import * as fs from 'fs/promises';
import * as path from 'path';

export type CavemanMode = 'lite' | 'full' | 'ultra' | 'wenyan';

const CAVEMAN_LITE = `# Caveman Lite

Reply concisely. Skip filler:
- No "Sure!", "Great question!", "Of course!".
- No restating the question.
- No unsolicited suggestions at the end.

Preserve byte-for-byte: code, URLs, file paths, error messages.
Preserve user's language.
`;

const CAVEMAN_FULL = `# Caveman — Compressed Style

Why use many token when few do trick.

Rules:
- No preamble, no postamble.
- No apologies or sycophancy.
- No "I hope this helps" or similar.
- Drop articles where unambiguous.
- Use telegraphic style for prose.
- Code, URLs, paths, error strings: BYTE-PRESERVED. Never compress.
- Math/numbers: preserve exactly.
- User's language: preserved (Arabic stays Arabic).

Output style:
- Direct answer first.
- Bullets over paragraphs.
- Tables when comparing.
- Minimum words, full meaning.

What NEVER compresses:
- Thinking/reasoning (internal).
- Code blocks.
- Quoted strings.
- File paths.
- Error messages.
- URLs.
`;

const CAVEMAN_ULTRA = `# Caveman Ultra — Telegraphic

Extreme compression. Read like telegram.

- Drop subject when implied.
- Drop "the", "a", "an" when clear.
- "is/are" → omit if implied.
- Numbers > words.
- Symbols > phrases: → not "becomes", & not "and".
- Imperatives over descriptions.
- One verb per sentence ideal.

Preserve same as full mode: code, URLs, paths, errors, math, user language.
`;

const CAVEMAN_WENYAN = `# Caveman Wenyan — Classical Chinese Style

Compress prose toward classical Chinese density (works in any language).
Each sentence: subject + verb + object. No connectives unless needed.
Punctuation minimal.

Preserve: code, URLs, paths, errors, math, user language.
`;

export function renderCavemanSkill(mode: CavemanMode): string {
  switch (mode) {
    case 'lite': return CAVEMAN_LITE;
    case 'ultra': return CAVEMAN_ULTRA;
    case 'wenyan': return CAVEMAN_WENYAN;
    case 'full':
    default: return CAVEMAN_FULL;
  }
}

export const CAVEMAN_COMMANDS: Record<string, string> = {
  'caveman.md': `# /caveman [lite|full|ultra|wenyan]

Switch Caveman compression level for this session.
Default: full. Use 'off' to disable.
`,
  'caveman-commit.md': `# /caveman-commit

Write a git commit message in Caveman style.
Format: <type>: <imperative, lower-case, ≤50 chars>

Body (optional): bullets, no fluff, why > what.
Footer: BREAKING CHANGE: / Closes #N.
`,
  'caveman-pr.md': `# /caveman-pr

Write a Pull Request description in Caveman style:
- Title: imperative ≤72 chars.
- Why: 1 sentence.
- What: bullets.
- How to test: bullets.
- Risks: bullets or "none".
`,
  'caveman-doc.md': `# /caveman-doc

Write documentation in Caveman style:
- One-line summary first.
- Parameters: name (type) — meaning.
- Returns: type — meaning.
- Example: minimal, runnable.
- No "this function does X" prose.
`,
  'caveman-help.md': `# /caveman-help

Modes:
- lite: drop filler only.
- full (default): telegraphic style.
- ultra: extreme compression.
- wenyan: classical-dense style.

Preserves: code, URLs, paths, errors, math, user language.
Subcommands: /caveman-commit /caveman-pr /caveman-doc.
`,
};

export async function deployCavemanLocal(opts: { root: string; mode: CavemanMode }): Promise<string[]> {
  const skillBody = renderCavemanSkill(opts.mode);
  const written: string[] = [];
  const skillFile = path.join(opts.root, '.brain', 'skills', 'caveman.md');
  await fs.mkdir(path.dirname(skillFile), { recursive: true });
  await fs.writeFile(skillFile, skillBody, 'utf8');
  written.push(skillFile);

  for (const [name, body] of Object.entries(CAVEMAN_COMMANDS)) {
    const file = path.join(opts.root, '.brain', 'commands', name);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, body, 'utf8');
    written.push(file);
  }
  return written;
}

export async function removeCavemanLocal(root: string): Promise<void> {
  await fs.rm(path.join(root, '.brain', 'skills', 'caveman.md'), { force: true }).catch(() => undefined);
  for (const name of Object.keys(CAVEMAN_COMMANDS)) {
    await fs.rm(path.join(root, '.brain', 'commands', name), { force: true }).catch(() => undefined);
  }
}
