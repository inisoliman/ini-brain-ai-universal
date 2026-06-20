# 🎯 PLAN v4.0.0 — Part 2 (Phases 3 to 11)

> **متابعة لملف `PLAN-v4-FINAL-self-contained.md`.**
> يحتوي هذا الجزء على المراحل 3 إلى 11 + قائمة الفحص النهائية.
> الوكيل المنفّذ يقرأ Part 1 أولاً، ثم Part 2 هنا.

---

## المرحلة 3: Methodology Layer

**الزمن المتوقع:** 60 دقيقة.

### 3.1 أنشئ `src/methodology/specKit.ts`

```typescript
/**
 * Spec-Kit Lite — Local Spec-Driven Development.
 * Workflow concept from https://github.com/github/spec-kit (MIT © GitHub).
 * Independent TypeScript implementation; no upstream code copied.
 */
import * as fs from 'fs/promises';
import * as path from 'path';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

async function ensureConstitution(root: string): Promise<string> {
  const file = path.join(root, '.specify', 'memory', 'constitution.md');
  try { await fs.access(file); return file; } catch {}
  await fs.mkdir(path.dirname(file), { recursive: true });
  const body = `# Project Constitution

> Governing principles for this project. All specs/plans must comply.

## Principles

1. **Quality first.** No feature ships without input validation and error handling.
2. **Minimal surface.** Prefer stdlib > platform > existing dep > new code.
3. **Reversibility.** Every change must be revertible in one commit.
4. **Documentation.** Public APIs require a one-line docstring.
5. **Testing.** Non-trivial logic ships with at least one runnable check.

## Out of Scope

- Auto-deploying to production without human approval.
- Storing secrets in repository files.
- Modifying \`.git/\` or \`.brain/backups/\`.

_Edit this file to match your project's actual standards._
`;
  await fs.writeFile(file, body, 'utf8');
  return file;
}

export async function createSpec(opts: {
  root: string; featureName: string; description: string;
}): Promise<{ specPath: string; slug: string }> {
  await ensureConstitution(opts.root);
  const slug = slugify(opts.featureName);
  const dir = path.join(opts.root, '.specify', 'specs', slug);
  await fs.mkdir(dir, { recursive: true });
  const specPath = path.join(dir, 'spec.md');
  const body = `# Spec: ${opts.featureName}

**Slug:** \`${slug}\`
**Status:** draft
**Created:** ${new Date().toISOString()}

## What & Why

${opts.description}

## User Stories

- [ ] As a user, I can ...

## Acceptance Criteria

- [ ] Given ... when ... then ...

## Non-Functional

- Performance: ...
- Security: ...
- Accessibility: ...

## Out of Scope

- ...

## Open Questions

- [ ] ...
`;
  await fs.writeFile(specPath, body, 'utf8');
  return { specPath, slug };
}

export async function createPlan(opts: {
  root: string; specSlug: string; techStack: string;
}): Promise<string> {
  const planPath = path.join(opts.root, '.specify', 'specs', opts.specSlug, 'plan.md');
  const body = `# Plan: ${opts.specSlug}

**Created:** ${new Date().toISOString()}

## Tech Stack

${opts.techStack}

## Architecture

\`\`\`
[describe modules, data flow, boundaries]
\`\`\`

## Data Model

| Entity | Fields | Notes |
|--------|--------|-------|
|        |        |       |

## Risks

- [ ] ...

## Verification Strategy

- Unit: ...
- Integration: ...
- Manual: ...
`;
  await fs.writeFile(planPath, body, 'utf8');
  return planPath;
}

export async function createTasks(opts: { root: string; specSlug: string }): Promise<string> {
  const tasksPath = path.join(opts.root, '.specify', 'specs', opts.specSlug, 'tasks.md');
  const body = `# Tasks: ${opts.specSlug}

**Created:** ${new Date().toISOString()}

> Mark tasks \`[x]\` as they complete. Keep each under 30 minutes.

## Setup

- [ ] T001 Scaffold module folder structure.
- [ ] T002 Add config entries.

## Implementation

- [ ] T010 ...
- [ ] T011 ...

## Verification

- [ ] T100 Add self-check.
- [ ] T101 Manual smoke test.

## Wrap-up

- [ ] T200 Update README.
- [ ] T201 Update \`.brain/decisions.md\` if architecture changed.
`;
  await fs.writeFile(tasksPath, body, 'utf8');
  return tasksPath;
}

export async function listSpecs(root: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(path.join(root, '.specify', 'specs'), { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(e => e.name);
  } catch { return []; }
}

export async function readSpec(root: string, slug: string): Promise<{
  spec?: string; plan?: string; tasks?: string;
}> {
  const dir = path.join(root, '.specify', 'specs', slug);
  const read = async (name: string) => {
    try { return await fs.readFile(path.join(dir, name), 'utf8'); }
    catch { return undefined; }
  };
  return { spec: await read('spec.md'), plan: await read('plan.md'), tasks: await read('tasks.md') };
}
```

### 3.2 أنشئ `src/methodology/superpowers.ts`

```typescript
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
```

### 3.3 تحقق و احفظ
```powershell
npm run compile
```
```
ini_brain_save_memory: "v4 progress: phase 3 complete. Methodology layer (SpecKit + Superpowers)."
```

---

## المرحلة 4: Universal Agent Adapter (12 Adapter)

**الزمن المتوقع:** 90 دقيقة.

### 4.1 `src/adapters/types.ts`

```typescript
export interface AgentAdapter {
  id: string;
  displayName: string;
  detectInstalled(root: string): Promise<boolean>;
  writeSkill(opts: { root: string; name: string; body: string }): Promise<string[]>;
  writeCommand(opts: { root: string; name: string; body: string }): Promise<string[]>;
  writeAgentsFile(opts: { root: string; body: string }): Promise<string[]>;
  removeSkill(root: string, name: string): Promise<void>;
  removeCommand(root: string, name: string): Promise<void>;
}

export interface DeploymentResult {
  adapter: string;
  files: string[];
  errors?: string[];
}
```

### 4.2 `src/adapters/_helpers.ts`

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

export async function writeText(file: string, body: string): Promise<string> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, body, 'utf8');
  return file;
}

export async function pathExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

export async function removeIfExists(p: string): Promise<void> {
  await fs.rm(p, { force: true, recursive: true }).catch(() => undefined);
}
```

### 4.3 `src/adapters/claudeAdapter.ts`

```typescript
import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

export const claudeAdapter: AgentAdapter = {
  id: 'claude',
  displayName: 'Claude Code',
  async detectInstalled(root) {
    return (await pathExists(path.join(root, '.claude'))) ||
           (await pathExists(path.join(root, 'CLAUDE.md')));
  },
  async writeSkill({ root, name, body }) {
    return [await writeText(path.join(root, '.claude', 'skills', name, 'SKILL.md'), body)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.claude', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, 'CLAUDE.md'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.claude', 'skills', name));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.claude', 'commands', `${name}.md`));
  },
};
```

### 4.4 `src/adapters/codexAdapter.ts`

```typescript
import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

export const codexAdapter: AgentAdapter = {
  id: 'codex',
  displayName: 'Codex CLI / App',
  async detectInstalled(root) {
    return (await pathExists(path.join(root, '.codex'))) ||
           (await pathExists(path.join(root, '.codex-plugin')));
  },
  async writeSkill({ root, name, body }) {
    return [await writeText(path.join(root, '.codex', 'skills', name, 'SKILL.md'), body)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.codex', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, '.codex', 'AGENTS.md'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.codex', 'skills', name));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.codex', 'commands', `${name}.md`));
  },
};
```

### 4.5 `src/adapters/clineAdapter.ts`

```typescript
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
```

### 4.6 `src/adapters/cursorAdapter.ts`

```typescript
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
    const mdcBody = `---\ndescription: ${name} skill\nalwaysApply: true\n---\n\n${body}`;
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
```

### 4.7 `src/adapters/windsurfAdapter.ts`

```typescript
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
```

### 4.8 `src/adapters/antigravityAdapter.ts`

```typescript
import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

export const antigravityAdapter: AgentAdapter = {
  id: 'antigravity',
  displayName: 'Antigravity (Gemini CLI 2)',
  async detectInstalled(root) {
    return await pathExists(path.join(root, '.agents'));
  },
  async writeSkill({ root, name, body }) {
    return [await writeText(path.join(root, '.agents', 'skills', `${name}.md`), body)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.agents', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, '.agents', 'rules', 'agents.md'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.agents', 'skills', `${name}.md`));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.agents', 'commands', `${name}.md`));
  },
};
```

### 4.9 `src/adapters/geminiAdapter.ts`

```typescript
import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

export const geminiAdapter: AgentAdapter = {
  id: 'gemini',
  displayName: 'Gemini CLI',
  async detectInstalled(root) {
    return (await pathExists(path.join(root, '.gemini'))) ||
           (await pathExists(path.join(root, 'gemini-extension.json')));
  },
  async writeSkill({ root, name, body }) {
    return [await writeText(path.join(root, '.gemini', 'skills', `${name}.md`), body)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.gemini', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, '.gemini', 'GEMINI.md'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.gemini', 'skills', `${name}.md`));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.gemini', 'commands', `${name}.md`));
  },
};
```

### 4.10 `src/adapters/copilotAdapter.ts`

```typescript
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
```

### 4.11 `src/adapters/openCodeAdapter.ts`

```typescript
import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

export const openCodeAdapter: AgentAdapter = {
  id: 'opencode',
  displayName: 'OpenCode',
  async detectInstalled(root) {
    return (await pathExists(path.join(root, '.opencode'))) ||
           (await pathExists(path.join(root, 'opencode.json')));
  },
  async writeSkill({ root, name, body }) {
    return [await writeText(path.join(root, '.opencode', 'skills', `${name}.md`), body)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.opencode', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, '.opencode', 'AGENTS.md'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.opencode', 'skills', `${name}.md`));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.opencode', 'commands', `${name}.md`));
  },
};
```

### 4.12 `src/adapters/kimiAdapter.ts`

```typescript
import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

export const kimiAdapter: AgentAdapter = {
  id: 'kimi',
  displayName: 'Kimi / Pi',
  async detectInstalled(root) {
    return (await pathExists(path.join(root, '.kimi'))) ||
           (await pathExists(path.join(root, 'pi-extension')));
  },
  async writeSkill({ root, name, body }) {
    return [await writeText(path.join(root, '.kimi', 'skills', `${name}.md`), body)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.kimi', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, '.kimi', 'AGENTS.md'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.kimi', 'skills', `${name}.md`));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.kimi', 'commands', `${name}.md`));
  },
};
```

### 4.13 `src/adapters/kiroAdapter.ts`

```typescript
import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, pathExists, removeIfExists } from './_helpers';

export const kiroAdapter: AgentAdapter = {
  id: 'kiro',
  displayName: 'Kiro',
  async detectInstalled(root) {
    return await pathExists(path.join(root, '.kiro'));
  },
  async writeSkill({ root, name, body }) {
    return [await writeText(path.join(root, '.kiro', 'steering', `${name}.md`), body)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.kiro', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, '.kiro', 'AGENTS.md'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.kiro', 'steering', `${name}.md`));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.kiro', 'commands', `${name}.md`));
  },
};
```

### 4.14 `src/adapters/universalFallback.ts`

```typescript
import * as path from 'path';
import { AgentAdapter } from './types';
import { writeText, removeIfExists } from './_helpers';

export const universalFallback: AgentAdapter = {
  id: 'universal',
  displayName: 'Universal (AGENTS.md + .brain/)',
  async detectInstalled() { return true; },
  async writeSkill({ root, name, body }) {
    return [await writeText(path.join(root, '.brain', 'skills', `${name}.md`), body)];
  },
  async writeCommand({ root, name, body }) {
    return [await writeText(path.join(root, '.brain', 'commands', `${name}.md`), body)];
  },
  async writeAgentsFile({ root, body }) {
    return [await writeText(path.join(root, 'AGENTS.md'), body)];
  },
  async removeSkill(root, name) {
    await removeIfExists(path.join(root, '.brain', 'skills', `${name}.md`));
  },
  async removeCommand(root, name) {
    await removeIfExists(path.join(root, '.brain', 'commands', `${name}.md`));
  },
};
```

### 4.15 `src/adapters/registry.ts`

```typescript
import { AgentAdapter, DeploymentResult } from './types';
import { claudeAdapter } from './claudeAdapter';
import { codexAdapter } from './codexAdapter';
import { clineAdapter } from './clineAdapter';
import { cursorAdapter } from './cursorAdapter';
import { windsurfAdapter } from './windsurfAdapter';
import { antigravityAdapter } from './antigravityAdapter';
import { geminiAdapter } from './geminiAdapter';
import { copilotAdapter } from './copilotAdapter';
import { openCodeAdapter } from './openCodeAdapter';
import { kimiAdapter } from './kimiAdapter';
import { kiroAdapter } from './kiroAdapter';
import { universalFallback } from './universalFallback';

export const ALL_ADAPTERS: AgentAdapter[] = [
  claudeAdapter, codexAdapter, clineAdapter, cursorAdapter,
  windsurfAdapter, antigravityAdapter, geminiAdapter, copilotAdapter,
  openCodeAdapter, kimiAdapter, kiroAdapter, universalFallback,
];

export async function detectInstalledAdapters(root: string): Promise<AgentAdapter[]> {
  const detected: AgentAdapter[] = [];
  for (const a of ALL_ADAPTERS) {
    if (await a.detectInstalled(root)) detected.push(a);
  }
  return detected;
}

export interface DeploySkillOpts {
  root: string;
  skillName: string;
  skillBody: string;
  commands?: Array<{ name: string; body: string }>;
  agentsFileBody?: string;
  onlyInstalled?: boolean;
}

export async function deployToAllAgents(opts: DeploySkillOpts): Promise<DeploymentResult[]> {
  const targets = opts.onlyInstalled
    ? await detectInstalledAdapters(opts.root)
    : ALL_ADAPTERS;
  const results: DeploymentResult[] = [];
  for (const adapter of targets) {
    const files: string[] = [];
    const errors: string[] = [];
    try {
      files.push(...await adapter.writeSkill({
        root: opts.root, name: opts.skillName, body: opts.skillBody
      }));
      if (opts.commands) {
        for (const cmd of opts.commands) {
          files.push(...await adapter.writeCommand({
            root: opts.root, name: cmd.name, body: cmd.body
          }));
        }
      }
      if (opts.agentsFileBody) {
        files.push(...await adapter.writeAgentsFile({
          root: opts.root, body: opts.agentsFileBody
        }));
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
    results.push({ adapter: adapter.id, files, errors: errors.length ? errors : undefined });
  }
  return results;
}

export async function removeFromAllAgents(root: string, skillName: string): Promise<void> {
  for (const adapter of ALL_ADAPTERS) {
    try {
      await adapter.removeSkill(root, skillName);
      await adapter.removeCommand(root, skillName);
    } catch { /* ignore */ }
  }
}

export { AgentAdapter, DeploymentResult } from './types';
```

### 4.16 تحقق و احفظ
```powershell
npm run compile
```
```
ini_brain_save_memory: "v4 progress: phase 4 complete. 12 agent adapters."
```

---

## المرحلة 5: Knowledge Graph

**الزمن المتوقع:** 60 دقيقة.

### 5.1 `src/graph/knowledgeGraph.ts`

```typescript
/**
 * Knowledge Graph builder.
 * Inspired by https://github.com/safishamsi/graphify (MIT) — TypeScript Lite version.
 */
import * as fs from 'fs/promises';
import * as path from 'path';

export type EdgeKind = 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';

export interface GraphNode {
  id: string;
  type: 'file' | 'function' | 'class' | 'concept' | 'memory';
  label: string;
  metadata?: Record<string, string | number>;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: EdgeKind;
  label?: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  generatedAt: string;
}

const IMPORT_REGEX_TS = /import\s+(?:[\s\S]+?\s+from\s+)?['"](\.[^'"]+)['"]/g;
const IMPORT_REGEX_PY = /^\s*(?:from|import)\s+([\w.]+)/gm;

function nodeId(prefix: string, value: string): string {
  return `${prefix}:${value.replace(/[\\/]/g, '_').slice(0, 80)}`;
}

export async function buildCodeGraph(root: string): Promise<KnowledgeGraph> {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  async function walk(dir: string): Promise<string[]> {
    const out: string[] = [];
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'dist') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        out.push(...await walk(full));
      } else if (/\.(ts|tsx|js|jsx|py|go|rs|java|rb|php)$/.test(e.name)) {
        out.push(full);
      }
    }
    return out;
  }

  const files = await walk(root);

  for (const file of files) {
    const rel = path.relative(root, file).replace(/\\/g, '/');
    const id = nodeId('file', rel);
    nodes.set(id, { id, type: 'file', label: rel });

    let content: string;
    try { content = await fs.readFile(file, 'utf8'); } catch { continue; }

    if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      IMPORT_REGEX_TS.lastIndex = 0;
      let m;
      while ((m = IMPORT_REGEX_TS.exec(content)) !== null) {
        const target = path.resolve(path.dirname(file), m[1]);
        const targetRel = path.relative(root, target).replace(/\\/g, '/');
        const targetId = nodeId('file', targetRel);
        if (!nodes.has(targetId)) {
          nodes.set(targetId, { id: targetId, type: 'file', label: targetRel });
        }
        edges.push({ from: id, to: targetId, kind: 'EXTRACTED', label: 'imports' });
      }
    } else if (/\.py$/.test(file)) {
      IMPORT_REGEX_PY.lastIndex = 0;
      let m;
      while ((m = IMPORT_REGEX_PY.exec(content)) !== null) {
        const targetId = nodeId('module', m[1]);
        if (!nodes.has(targetId)) {
          nodes.set(targetId, { id: targetId, type: 'concept', label: m[1] });
        }
        edges.push({ from: id, to: targetId, kind: 'INFERRED', label: 'imports' });
      }
    }
  }

  return {
    nodes: [...nodes.values()],
    edges,
    generatedAt: new Date().toISOString(),
  };
}

export async function saveGraph(root: string, graph: KnowledgeGraph): Promise<string> {
  const file = path.join(root, '.brain', 'knowledge-graph.json');
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(graph, null, 2), 'utf8');
  return file;
}

export async function loadGraph(root: string): Promise<KnowledgeGraph | null> {
  const file = path.join(root, '.brain', 'knowledge-graph.json');
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch { return null; }
}

export function computeImpact(graph: KnowledgeGraph, fileRelPath: string): {
  direct: string[]; transitive: string[];
} {
  const targetId = nodeId('file', fileRelPath);
  const direct = graph.edges
    .filter(e => e.to === targetId)
    .map(e => graph.nodes.find(n => n.id === e.from)?.label)
    .filter((x): x is string => !!x);

  const visited = new Set<string>([targetId]);
  const transitive: string[] = [];
  function visit(id: string) {
    for (const e of graph.edges) {
      if (e.to === id && !visited.has(e.from)) {
        visited.add(e.from);
        const node = graph.nodes.find(n => n.id === e.from);
        if (node) transitive.push(node.label);
        visit(e.from);
      }
    }
  }
  visit(targetId);
  return { direct, transitive: transitive.filter(t => !direct.includes(t)) };
}
```

### 5.2 `src/graph/mermaidRenderer.ts`

```typescript
import { KnowledgeGraph, EdgeKind } from './knowledgeGraph';

const KIND_STYLES: Record<EdgeKind, string> = {
  EXTRACTED: '-->|extracted|',
  INFERRED: '-.->|inferred|',
  AMBIGUOUS: '~~>|?|',
};

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 60);
}

export function renderMermaid(graph: KnowledgeGraph, opts: { maxNodes?: number } = {}): string {
  const maxNodes = opts.maxNodes ?? 50;
  const nodes = graph.nodes.slice(0, maxNodes);
  const nodeIds = new Set(nodes.map(n => n.id));
  const edges = graph.edges.filter(e => nodeIds.has(e.from) && nodeIds.has(e.to));

  const lines: string[] = ['graph LR'];
  for (const n of nodes) {
    const id = sanitizeId(n.id);
    const label = n.label.replace(/"/g, "'").slice(0, 40);
    const shape = n.type === 'file' ? `["${label}"]` : `(${label})`;
    lines.push(`  ${id}${shape}`);
  }
  for (const e of edges) {
    const arrow = KIND_STYLES[e.kind] ?? '-->';
    lines.push(`  ${sanitizeId(e.from)} ${arrow} ${sanitizeId(e.to)}`);
  }
  return lines.join('\n');
}

export function renderMermaidHtml(mermaidSource: string, title = 'Knowledge Graph'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>
  body { font-family: system-ui, sans-serif; padding: 20px; background: #1e1e1e; color: #ddd; }
  .mermaid { background: #2d2d2d; padding: 20px; border-radius: 8px; }
  h1 { color: #4fc3f7; }
  .meta { color: #888; font-size: 0.9em; }
</style>
</head>
<body>
  <h1>🧬 ${title}</h1>
  <div class="meta">Generated by INI Brain AI Universal · ${new Date().toLocaleString()}</div>
  <div class="mermaid">
${mermaidSource}
  </div>
  <script>mermaid.initialize({ startOnLoad: true, theme: 'dark' });</script>
</body>
</html>`;
}
```

### 5.3 احفظ
```
ini_brain_save_memory: "v4 progress: phase 5 complete. Knowledge graph + Mermaid."
```

---

## المرحلة 6: Auto-Update System

**الزمن المتوقع:** 60 دقيقة.

### 6.1 `src/updater/upstreamSources.ts`

```typescript
export interface UpstreamSource {
  id: string;
  owner: string;
  name: string;
  branch: string;
  files: string[];
  description: string;
}

export const UPSTREAM_SOURCES: UpstreamSource[] = [
  { id: 'ponytail', owner: 'DietrichGebert', name: 'ponytail', branch: 'main',
    description: 'Lazy senior dev (code -54%)', files: ['AGENTS.md'] },
  { id: 'caveman', owner: 'JuliusBrussee', name: 'caveman', branch: 'main',
    description: 'Telegraphic compression (output -70%)', files: ['AGENTS.md'] },
  { id: 'claude-token-efficient', owner: 'drona23', name: 'claude-token-efficient', branch: 'main',
    description: 'Claude lean rules', files: ['CLAUDE.md'] },
  { id: 'spec-kit', owner: 'github', name: 'spec-kit', branch: 'main',
    description: 'SDD templates', files: ['README.md'] },
  { id: 'superpowers', owner: 'obra', name: 'superpowers', branch: 'main',
    description: 'Composable skills methodology', files: ['README.md'] },
  { id: 'graphify', owner: 'safishamsi', name: 'graphify', branch: 'main',
    description: 'Knowledge graph builder', files: ['README.md'] },
  { id: 'token-optimizer', owner: 'alexgreensh', name: 'token-optimizer', branch: 'main',
    description: 'Token measurement', files: ['README.md'] },
];
```

### 6.2 `src/updater/stateStore.ts`

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

export interface UpstreamState {
  [sourceId: string]: {
    lastSha: string;
    lastCheck: string;
    lastApply?: string;
  };
}

const FILE = '.brain/upstream-state.json';

export async function readState(root: string): Promise<UpstreamState> {
  try {
    return JSON.parse(await fs.readFile(path.join(root, FILE), 'utf8'));
  } catch { return {}; }
}

export async function writeState(root: string, state: UpstreamState): Promise<void> {
  const file = path.join(root, FILE);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(state, null, 2), 'utf8');
}
```

### 6.3 `src/updater/repoSync.ts`

```typescript
import * as https from 'https';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UpstreamSource, UPSTREAM_SOURCES } from './upstreamSources';
import { UpstreamState, readState, writeState } from './stateStore';

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'ini-brain-ai-updater/3.0' } }, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} ${url}`));
        return;
      }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

async function fetchJson<T = unknown>(url: string): Promise<T> {
  const text = await fetchText(url);
  return JSON.parse(text) as T;
}

export interface UpdateCheck {
  source: UpstreamSource;
  hasUpdate: boolean;
  latestSha: string;
  lastSha: string;
  latestMessage?: string;
}

export async function checkOne(source: UpstreamSource, state: UpstreamState): Promise<UpdateCheck> {
  const url = `https://api.github.com/repos/${source.owner}/${source.name}/commits/${source.branch}`;
  const data = await fetchJson<{ sha: string; commit?: { message?: string } }>(url);
  const latestSha = data.sha;
  const lastSha = state[source.id]?.lastSha ?? '';
  return {
    source,
    hasUpdate: latestSha !== lastSha,
    latestSha,
    lastSha,
    latestMessage: data.commit?.message,
  };
}

export async function checkAll(root: string): Promise<UpdateCheck[]> {
  const state = await readState(root);
  const checks: UpdateCheck[] = [];
  for (const source of UPSTREAM_SOURCES) {
    try {
      const check = await checkOne(source, state);
      state[source.id] = {
        ...state[source.id],
        lastCheck: new Date().toISOString(),
        lastSha: state[source.id]?.lastSha ?? '',
      };
      checks.push(check);
    } catch (e) {
      console.warn(`Failed to check ${source.id}:`, e);
    }
  }
  await writeState(root, state);
  return checks;
}

export async function applyOne(source: UpstreamSource, root: string, latestSha: string): Promise<string[]> {
  const written: string[] = [];
  for (const file of source.files) {
    const url = `https://raw.githubusercontent.com/${source.owner}/${source.name}/${source.branch}/${file}`;
    try {
      const content = await fetchText(url);
      const target = path.join(root, '.brain', 'upstream', source.id, file);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, content, 'utf8');
      written.push(target);
    } catch (e) {
      console.warn(`Failed to fetch ${source.id}/${file}:`, e);
    }
  }
  const state = await readState(root);
  state[source.id] = {
    ...state[source.id],
    lastSha: latestSha,
    lastApply: new Date().toISOString(),
    lastCheck: new Date().toISOString(),
  };
  await writeState(root, state);
  return written;
}

export async function applyAll(checks: UpdateCheck[], root: string): Promise<string[]> {
  const all: string[] = [];
  for (const c of checks.filter(x => x.hasUpdate)) {
    all.push(...await applyOne(c.source, root, c.latestSha));
  }
  return all;
}
```

### 6.4 احفظ
```
ini_brain_save_memory: "v4 progress: phase 6 complete. Auto-update system."
```

---

## المرحلة 7: MCP Tools الجديدة

**الزمن المتوقع:** 45 دقيقة.

### 7.1 `src/mcp/tools/savingsTools.ts`

```typescript
import { measureText, readSavingsHistory, summarizeSavings } from '../../savings/tokenMeter';

export const savingsTools = {
  ini_brain_savings_status: {
    description: 'Show current savings stats.',
    inputSchema: { type: 'object', properties: {} },
    handler: async (_args: unknown, root: string) => {
      const history = await readSavingsHistory(root);
      const summary = summarizeSavings(history);
      return {
        totalTokensSaved: summary.totalTokensSaved,
        totalCostSavedUsd: summary.totalCostSavedUsd,
        byMode: summary.byMode,
      };
    },
  },
  ini_brain_measure_tokens: {
    description: 'Count tokens for a given text.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
    },
    handler: async (args: { text: string }) => measureText(args.text),
  },
};
```

### 7.2 `src/mcp/tools/graphTools.ts`

```typescript
import { buildCodeGraph, loadGraph, saveGraph, computeImpact } from '../../graph/knowledgeGraph';

export const graphTools = {
  ini_brain_graph_build: {
    description: 'Build project knowledge graph.',
    inputSchema: { type: 'object', properties: {} },
    handler: async (_args: unknown, root: string) => {
      const graph = await buildCodeGraph(root);
      await saveGraph(root, graph);
      return { nodes: graph.nodes.length, edges: graph.edges.length };
    },
  },
  ini_brain_graph_impact: {
    description: 'Blast radius for a file.',
    inputSchema: {
      type: 'object',
      properties: { file: { type: 'string' } },
      required: ['file'],
    },
    handler: async (args: { file: string }, root: string) => {
      const graph = await loadGraph(root);
      if (!graph) return { error: 'No graph built yet.' };
      return computeImpact(graph, args.file);
    },
  },
};
```

### 7.3 `src/mcp/tools/methodologyTools.ts`

```typescript
import { listSpecs, readSpec, createSpec } from '../../methodology/specKit';
import { listSkills, resolveSkillChain } from '../../methodology/superpowers';

export const methodologyTools = {
  ini_brain_spec_list: {
    description: 'List all specs.',
    inputSchema: { type: 'object', properties: {} },
    handler: async (_args: unknown, root: string) => ({ specs: await listSpecs(root) }),
  },
  ini_brain_spec_read: {
    description: 'Read spec by slug.',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug'],
    },
    handler: async (args: { slug: string }, root: string) => readSpec(root, args.slug),
  },
  ini_brain_spec_create: {
    description: 'Create a new spec.',
    inputSchema: {
      type: 'object',
      properties: {
        featureName: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['featureName', 'description'],
    },
    handler: async (args: { featureName: string; description: string }, root: string) =>
      createSpec({ root, featureName: args.featureName, description: args.description }),
  },
  ini_brain_skills_list: {
    description: 'List skills.',
    inputSchema: { type: 'object', properties: {} },
    handler: async (_args: unknown, root: string) => ({ skills: await listSkills(root) }),
  },
  ini_brain_skills_resolve: {
    description: 'Resolve a skill and its @-references.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
    handler: async (args: { id: string }, root: string) => {
      const chain = await resolveSkillChain(root, args.id);
      return { chain: chain.map(s => ({ id: s.id, title: s.title, refs: s.references })) };
    },
  },
};
```

### 7.4 تكامل مع `src/mcp/server.ts`

**ملاحظة:** اقرأ `src/mcp/server.ts` الموجود واتبع نمط تسجيل الأدوات الحالي. أضف هذه الـimports وسجّل الأدوات الجديدة بنفس النمط:

```typescript
import { savingsTools } from './tools/savingsTools';
import { graphTools } from './tools/graphTools';
import { methodologyTools } from './tools/methodologyTools';

// عند تسجيل الأدوات في الـserver، أضف:
const allNewTools = { ...savingsTools, ...graphTools, ...methodologyTools };
for (const [name, tool] of Object.entries(allNewTools)) {
  // اتّبع النمط الحالي. مثال (قد يختلف حسب SDK):
  // server.setRequestHandler('tools/call', ...) أو ما يماثله
}
```

### 7.5 احفظ
```
ini_brain_save_memory: "v4 progress: phase 7 complete. MCP tools integrated."
```

---

## المرحلة 8: تعديل extension.ts

**الزمن المتوقع:** 60 دقيقة.

### 8.1 إضافة الـImports

في أعلى `src/extension.ts` أضف بعد الـimports الموجودة:

```typescript
import { deployCavemanLocal, removeCavemanLocal, CavemanMode } from './savings/caveman';
import { deployPonytailLocal, removePonytailLocal, PonytailMode } from './savings/ponytail';
import { deployClaudeLeanLocal, removeClaudeLeanLocal } from './savings/claudeLean';
import { measureText, readSavingsHistory, summarizeSavings } from './savings/tokenMeter';
import { removeAllSavings } from './savings';
import { createSpec, createPlan, createTasks, listSpecs } from './methodology/specKit';
import { buildCodeGraph, loadGraph, saveGraph, computeImpact } from './graph/knowledgeGraph';
import { renderMermaid, renderMermaidHtml } from './graph/mermaidRenderer';
import { deployToAllAgents, removeFromAllAgents, detectInstalledAdapters } from './adapters/registry';
import { checkAll, applyOne } from './updater/repoSync';
```

### 8.2 الـCommands الجديدة

أضف هذه الكتلة داخل `context.subscriptions.push(...)` الحالي (مع الـcommands الحالية):

```typescript
// === Savings ===
vscode.commands.registerCommand('iniBrain.enableCaveman', async () => {
  const cfg = vscode.workspace.getConfiguration('iniBrain');
  const mode = (cfg.get<string>('caveman.mode') ?? 'full') as CavemanMode;
  await deployCavemanLocal({ root, mode });
  await cfg.update('caveman.enabled', true, vscode.ConfigurationTarget.Workspace);
  if (cfg.get<boolean>('adapter.installOnEnable', true)) {
    const cavemanFile = path.join(root, '.brain', 'skills', 'caveman.md');
    try {
      const body = await fs.readFile(cavemanFile, 'utf8');
      await deployToAllAgents({ root, skillName: 'caveman', skillBody: body, onlyInstalled: true });
    } catch {}
  }
  vscode.window.showInformationMessage(`Caveman enabled (${mode}). Output tokens -~70%.`);
}),
vscode.commands.registerCommand('iniBrain.disableCaveman', async () => {
  await removeCavemanLocal(root);
  await removeFromAllAgents(root, 'caveman');
  await vscode.workspace.getConfiguration('iniBrain').update('caveman.enabled', false, vscode.ConfigurationTarget.Workspace);
  vscode.window.showInformationMessage('Caveman disabled.');
}),
vscode.commands.registerCommand('iniBrain.enablePonytail', async () => {
  const cfg = vscode.workspace.getConfiguration('iniBrain');
  const mode = (cfg.get<string>('ponytail.mode') ?? 'full') as PonytailMode;
  await deployPonytailLocal({ root, mode });
  await cfg.update('ponytail.enabled', true, vscode.ConfigurationTarget.Workspace);
  if (cfg.get<boolean>('adapter.installOnEnable', true)) {
    const f = path.join(root, '.brain', 'skills', 'ponytail.md');
    try {
      const body = await fs.readFile(f, 'utf8');
      await deployToAllAgents({ root, skillName: 'ponytail', skillBody: body, onlyInstalled: true });
    } catch {}
  }
  vscode.window.showInformationMessage(`Ponytail enabled (${mode}). Code -~54%.`);
}),
vscode.commands.registerCommand('iniBrain.disablePonytail', async () => {
  await removePonytailLocal(root);
  await removeFromAllAgents(root, 'ponytail');
  await vscode.workspace.getConfiguration('iniBrain').update('ponytail.enabled', false, vscode.ConfigurationTarget.Workspace);
  vscode.window.showInformationMessage('Ponytail disabled.');
}),
vscode.commands.registerCommand('iniBrain.enableClaudeLean', async () => {
  await deployClaudeLeanLocal(root);
  await vscode.workspace.getConfiguration('iniBrain').update('claudeLean.enabled', true, vscode.ConfigurationTarget.Workspace);
  vscode.window.showInformationMessage('Claude Lean enabled.');
}),
vscode.commands.registerCommand('iniBrain.disableClaudeLean', async () => {
  await removeClaudeLeanLocal(root);
  await vscode.workspace.getConfiguration('iniBrain').update('claudeLean.enabled', false, vscode.ConfigurationTarget.Workspace);
  vscode.window.showInformationMessage('Claude Lean disabled.');
}),
vscode.commands.registerCommand('iniBrain.enableAllSavings', async () => {
  await vscode.commands.executeCommand('iniBrain.enableCaveman');
  await vscode.commands.executeCommand('iniBrain.enablePonytail');
  await vscode.commands.executeCommand('iniBrain.enableClaudeLean');
  vscode.window.showInformationMessage('All savings enabled. Expected ~60-80% token reduction.');
}),
vscode.commands.registerCommand('iniBrain.disableAllSavings', async () => {
  await removeAllSavings(root);
  await removeFromAllAgents(root, 'caveman');
  await removeFromAllAgents(root, 'ponytail');
  const cfg = vscode.workspace.getConfiguration('iniBrain');
  await cfg.update('caveman.enabled', false, vscode.ConfigurationTarget.Workspace);
  await cfg.update('ponytail.enabled', false, vscode.ConfigurationTarget.Workspace);
  await cfg.update('claudeLean.enabled', false, vscode.ConfigurationTarget.Workspace);
  vscode.window.showInformationMessage('All savings disabled.');
}),
vscode.commands.registerCommand('iniBrain.switchSavingsLevel', async () => {
  const skill = await vscode.window.showQuickPick(['caveman', 'ponytail'], { placeHolder: 'Which skill?' });
  if (!skill) return;
  const levels = skill === 'caveman' ? ['lite', 'full', 'ultra', 'wenyan'] : ['lite', 'full', 'ultra'];
  const level = await vscode.window.showQuickPick(levels, { placeHolder: 'Level' });
  if (!level) return;
  await vscode.workspace.getConfiguration('iniBrain').update(`${skill}.mode`, level, vscode.ConfigurationTarget.Workspace);
  await vscode.commands.executeCommand(skill === 'caveman' ? 'iniBrain.enableCaveman' : 'iniBrain.enablePonytail');
}),
vscode.commands.registerCommand('iniBrain.showTokenDashboard', async () => {
  const history = await readSavingsHistory(root);
  const summary = summarizeSavings(history);
  const panel = vscode.window.createWebviewPanel(
    'iniBrainTokenDashboard', 'INI Brain — Token Savings', vscode.ViewColumn.One, {}
  );
  panel.webview.html = `<!DOCTYPE html><html><body style="font-family:system-ui;padding:20px;background:#1e1e1e;color:#ddd">
    <h1>💰 Token Savings Dashboard</h1>
    <h2>Total Saved: ${summary.totalTokensSaved.toLocaleString()} tokens</h2>
    <h2>Cost Saved: $${summary.totalCostSavedUsd.toFixed(2)}</h2>
    <h3>By Mode</h3><pre>${JSON.stringify(summary.byMode, null, 2)}</pre>
  </body></html>`;
}),
vscode.commands.registerCommand('iniBrain.measureFileTokens', async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { vscode.window.showWarningMessage('Open a file first.'); return; }
  const stats = measureText(editor.document.getText());
  vscode.window.showInformationMessage(
    `${path.basename(editor.document.fileName)}: ${stats.totalTokens} tokens, ~$${stats.estimatedCostUsd.toFixed(4)}`
  );
}),

// === Spec-Kit ===
vscode.commands.registerCommand('iniBrain.specCreate', async () => {
  const name = await vscode.window.showInputBox({ prompt: 'Feature name' });
  if (!name) return;
  const desc = await vscode.window.showInputBox({ prompt: 'What & why' });
  if (!desc) return;
  const { specPath } = await createSpec({ root, featureName: name, description: desc });
  await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(specPath));
}),
vscode.commands.registerCommand('iniBrain.specPlan', async () => {
  const specs = await listSpecs(root);
  if (!specs.length) { vscode.window.showWarningMessage('No specs.'); return; }
  const slug = await vscode.window.showQuickPick(specs, { placeHolder: 'Pick spec' });
  if (!slug) return;
  const tech = await vscode.window.showInputBox({ prompt: 'Tech stack' });
  if (!tech) return;
  const p = await createPlan({ root, specSlug: slug, techStack: tech });
  await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(p));
}),
vscode.commands.registerCommand('iniBrain.specTasks', async () => {
  const specs = await listSpecs(root);
  if (!specs.length) return;
  const slug = await vscode.window.showQuickPick(specs, { placeHolder: 'Pick spec' });
  if (!slug) return;
  const t = await createTasks({ root, specSlug: slug });
  await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(t));
}),
vscode.commands.registerCommand('iniBrain.specImplement', async () => {
  const specs = await listSpecs(root);
  if (!specs.length) return;
  const slug = await vscode.window.showQuickPick(specs, { placeHolder: 'Pick spec' });
  if (!slug) return;
  const tasksFile = path.join(root, '.specify', 'specs', slug, 'tasks.md');
  await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(tasksFile));
  vscode.window.showInformationMessage('Hand tasks.md to your AI: "Implement next unchecked task and mark [x]."');
}),

// === Graph ===
vscode.commands.registerCommand('iniBrain.buildKnowledgeGraph', () => runWithStatus(sidebar, 'Building graph', async () => {
  const graph = await buildCodeGraph(root);
  await saveGraph(root, graph);
  sidebar.log(`Graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges.`);
})),
vscode.commands.registerCommand('iniBrain.showKnowledgeGraph', async () => {
  let graph = await loadGraph(root);
  if (!graph) { graph = await buildCodeGraph(root); await saveGraph(root, graph); }
  const mermaid = renderMermaid(graph, { maxNodes: 60 });
  const html = renderMermaidHtml(mermaid);
  const panel = vscode.window.createWebviewPanel('iniBrainGraph', 'Knowledge Graph', vscode.ViewColumn.One, { enableScripts: true });
  panel.webview.html = html;
}),
vscode.commands.registerCommand('iniBrain.findImpact', async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { vscode.window.showWarningMessage('Open a file.'); return; }
  let graph = await loadGraph(root);
  if (!graph) { graph = await buildCodeGraph(root); await saveGraph(root, graph); }
  const rel = path.relative(root, editor.document.fileName).replace(/\\/g, '/');
  const impact = computeImpact(graph, rel);
  output.clear();
  output.appendLine(`# Impact of: ${rel}`);
  output.appendLine(`\n## Direct (${impact.direct.length})`);
  for (const f of impact.direct) output.appendLine(`- ${f}`);
  output.appendLine(`\n## Transitive (${impact.transitive.length})`);
  for (const f of impact.transitive) output.appendLine(`- ${f}`);
  output.show(true);
}),

// === Adapters ===
vscode.commands.registerCommand('iniBrain.installAllAgents', async () => {
  const detected = await detectInstalledAdapters(root);
  sidebar.log(`Detected: ${detected.map(d => d.id).join(', ')}`);
  const cfg = vscode.workspace.getConfiguration('iniBrain');
  if (cfg.get<boolean>('caveman.enabled')) await vscode.commands.executeCommand('iniBrain.enableCaveman');
  if (cfg.get<boolean>('ponytail.enabled')) await vscode.commands.executeCommand('iniBrain.enablePonytail');
  vscode.window.showInformationMessage(`Deployed to ${detected.length} agents.`);
}),
vscode.commands.registerCommand('iniBrain.removeAllAgents', async () => {
  const yes = await vscode.window.showWarningMessage('Remove all INI Brain skills from agents?', 'Yes', 'No');
  if (yes !== 'Yes') return;
  await removeFromAllAgents(root, 'caveman');
  await removeFromAllAgents(root, 'ponytail');
  await removeFromAllAgents(root, 'claude-lean');
  vscode.window.showInformationMessage('Removed.');
}),

// === Updater ===
vscode.commands.registerCommand('iniBrain.checkUpstream', () => runWithStatus(sidebar, 'Checking', async () => {
  const checks = await checkAll(root);
  const updates = checks.filter(c => c.hasUpdate);
  sidebar.log(`Checked ${checks.length}. ${updates.length} updates.`);
  if (!updates.length) { vscode.window.showInformationMessage('All up to date.'); return; }
  const list = updates.map(u => `• ${u.source.id}`).join('\n');
  const choice = await vscode.window.showInformationMessage(
    `${updates.length} updates:\n${list}`, 'Apply All', 'Skip'
  );
  if (choice === 'Apply All') {
    for (const u of updates) await applyOne(u.source, root, u.latestSha);
    vscode.window.showInformationMessage(`Applied ${updates.length}.`);
  }
})),
vscode.commands.registerCommand('iniBrain.applyUpstream', () =>
  vscode.commands.executeCommand('iniBrain.checkUpstream')),
vscode.commands.registerCommand('iniBrain.configureAutoUpdate', async () => {
  const cfg = vscode.workspace.getConfiguration('iniBrain');
  const enabled = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Enable auto-update?' });
  if (!enabled) return;
  await cfg.update('autoUpdate.enabled', enabled === 'Yes', vscode.ConfigurationTarget.Workspace);
  if (enabled === 'Yes') {
    const h = await vscode.window.showInputBox({ prompt: 'Hours between checks', value: String(cfg.get<number>('autoUpdate.intervalHours', 168)) });
    if (h) await cfg.update('autoUpdate.intervalHours', Number(h), vscode.ConfigurationTarget.Workspace);
  }
  vscode.window.showInformationMessage('Auto-update configured.');
}),
```

### 8.3 جدولة auto-update الخلفية

في آخر `activate` بعد:
```typescript
if (vscode.workspace.getConfiguration('iniBrain').get('autoScan', true)) {
  void runAutoOnboarding(onboarding, sidebar);
}
```

أضف:
```typescript
const autoUpdateCfg = vscode.workspace.getConfiguration('iniBrain');
if (autoUpdateCfg.get<boolean>('autoUpdate.enabled')) {
  const hours = autoUpdateCfg.get<number>('autoUpdate.intervalHours', 168);
  const interval = setInterval(async () => {
    try {
      const checks = await checkAll(root);
      const updates = checks.filter(c => c.hasUpdate);
      if (updates.length > 0) {
        const requireApproval = autoUpdateCfg.get<boolean>('autoUpdate.requireApproval', true);
        if (requireApproval) {
          vscode.window.showInformationMessage(
            `🆕 ${updates.length} upstream update(s). Run "INI Brain: Check Upstream Updates".`
          );
        } else {
          for (const u of updates) await applyOne(u.source, root, u.latestSha);
        }
      }
    } catch (e) {
      sidebar.log(`Auto-update failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, hours * 60 * 60 * 1000);
  context.subscriptions.push({ dispose: () => clearInterval(interval) });
}
```

### 8.4 تحقق و احفظ
```powershell
npm run compile
```
```
ini_brain_save_memory: "v4 progress: phase 8 complete. extension.ts updated with 24 new commands."
```

---

## المرحلة 9: UI Sidebar

**الزمن المتوقع:** 30 دقيقة.

اقرأ `src/ui/sidebarProvider.ts` الموجود. في دالة الـHTML render، أضف هذه الـcards قبل إغلاق الـ`<body>`:

```typescript
// Inside the HTML template literal in sidebarProvider:
const newCards = `
<style>
  .card { background:#252526; padding:10px; margin:8px 0; border-radius:6px; }
  .card h3 { margin:0 0 6px; font-size:14px; color:#4fc3f7; }
  .card button { background:#0e639c; color:#fff; border:0; padding:5px 8px; margin:2px; border-radius:3px; cursor:pointer; font-size:11px; }
  .card button:hover { background:#1177bb; }
</style>
<div class="card">
  <h3>💰 Token Savings</h3>
  <button onclick="cmd('iniBrain.enableAllSavings')">Enable All</button>
  <button onclick="cmd('iniBrain.disableAllSavings')">Disable All</button>
  <button onclick="cmd('iniBrain.showTokenDashboard')">Dashboard</button>
  <button onclick="cmd('iniBrain.switchSavingsLevel')">Switch Level</button>
</div>
<div class="card">
  <h3>🧬 Knowledge Graph</h3>
  <button onclick="cmd('iniBrain.buildKnowledgeGraph')">Build</button>
  <button onclick="cmd('iniBrain.showKnowledgeGraph')">View</button>
  <button onclick="cmd('iniBrain.findImpact')">Find Impact</button>
</div>
<div class="card">
  <h3>📋 Spec-Driven Dev</h3>
  <button onclick="cmd('iniBrain.specCreate')">New Spec</button>
  <button onclick="cmd('iniBrain.specPlan')">Plan</button>
  <button onclick="cmd('iniBrain.specTasks')">Tasks</button>
  <button onclick="cmd('iniBrain.specImplement')">Implement</button>
</div>
<div class="card">
  <h3>🔌 Adapters</h3>
  <button onclick="cmd('iniBrain.installAllAgents')">Install All</button>
  <button onclick="cmd('iniBrain.removeAllAgents')">Remove All</button>
</div>
<div class="card">
  <h3>🔄 Upstream Updates</h3>
  <button onclick="cmd('iniBrain.checkUpstream')">Check Now</button>
  <button onclick="cmd('iniBrain.configureAutoUpdate')">Configure</button>
</div>
<script>
  const vscode = acquireVsCodeApi();
  function cmd(id) { vscode.postMessage({ type: 'command', id }); }
</script>
`;
```

في الـclass `SidebarProvider`، تأكد من معالجة رسائل postMessage:

```typescript
webview.onDidReceiveMessage(msg => {
  if (msg.type === 'command') {
    vscode.commands.executeCommand(msg.id);
  }
});
```

احفظ:
```
ini_brain_save_memory: "v4 progress: phase 9 complete. Sidebar cards added."
```

---

## المرحلة 10: التوثيق ثنائي اللغة

**الزمن المتوقع:** 60 دقيقة.

### 10.1 إنشاء ملفات features

أنشئ هذه الملفات بنفس قالب الملفات أدناه. الوكيل يكتب 9 ملفات بالعربي و 9 بالإنجليزي.

#### `docs/features/ar/overview.md`

```markdown
# INI Brain AI Universal — نظرة عامة

## ما هي الإضافة؟
إضافة VS Code محلية تجمع 7 ميزات قوية:
1. **ذاكرة المشروع:** تحفظ القرارات والـ bugs والـworkflows.
2. **Caveman:** يضغط ردود الـAI ~70٪.
3. **Ponytail:** يقلّل الكود المولّد ~54٪.
4. **Claude Lean:** قواعد سلوك صارمة لـClaude.
5. **Spec-Kit Lite:** منهجية SDD محلية.
6. **Knowledge Graph:** رسم مرئي لتبعيات المشروع.
7. **Auto-Update:** يتابع تحديثات المصادر تلقائياً.

## يعمل مع 12 وكيل AI:
Claude Code, Codex, Cline, Cursor, Windsurf, Antigravity, Gemini, Copilot, OpenCode, Kimi, Kiro + أي MCP client.

## التوفير المتوقع: 60–80٪ من تكاليف الـAI.

## ابدأ:
1. ثبّت `.vsix`.
2. `INI Brain: Guided Setup`.
3. `INI Brain: Enable All Savings`.
4. `INI Brain: Install Skills for All Agents`.
```

#### `docs/features/en/overview.md`

```markdown
# INI Brain AI Universal — Overview

A local VS Code extension combining 7 powerful features:
1. **Project Memory** — decisions, bugs, workflows.
2. **Caveman** — compresses AI responses ~70%.
3. **Ponytail** — reduces generated code ~54%.
4. **Claude Lean** — strict behavior rules.
5. **Spec-Kit Lite** — local SDD workflow.
6. **Knowledge Graph** — visual project map.
7. **Auto-Update** — tracks upstream sources.

Works with 12 AI agents. Expected savings: 60-80% of AI API costs.

Quick start:
1. Install `.vsix`.
2. `INI Brain: Guided Setup`.
3. `INI Brain: Enable All Savings`.
4. `INI Brain: Install Skills for All Agents`.
```

#### `docs/features/ar/caveman.md` و `docs/features/en/caveman.md`

```markdown
# Caveman — ضاغط ردود الـAI

## الفائدة
~70٪ توفير في output tokens.

## التفعيل
`INI Brain: Enable Caveman Mode` أو `iniBrain.caveman.enabled = true`.

## الأوضاع
- `lite`: حذف الحشو.
- `full` (افتراضي): تلغرافي.
- `ultra`: ضغط أقصى.
- `wenyan`: كثافة كلاسيكية.

## الأوامر في الـChat
- `/caveman [lite|full|ultra|wenyan]`
- `/caveman-commit`
- `/caveman-pr`
- `/caveman-doc`

## ما لا يُضغط
كود، URLs، paths، error messages، math، لغة المستخدم.

## المصدر
github.com/JuliusBrussee/caveman (MIT).
```

> النسخة الإنجليزية: ترجمة مباشرة.

#### `docs/features/ar/ponytail.md`

```markdown
# Ponytail — كاتب الكود الكسول

## الفائدة
~54٪ توفير في الكود المولّد.

## الفلسفة (6 درجات)
1. هل يحتاج للوجود؟ (YAGNI)
2. stdlib؟
3. منصة أصلية؟
4. dependency موجود؟
5. سطر واحد؟
6. أقل ما يعمل.

## التفعيل
`INI Brain: Enable Ponytail Mode`.

## الأوضاع
lite / full / ultra.

## الأوامر
- `/ponytail-review` — راجع الملف.
- `/ponytail-audit` — راجع المشروع.
- `/ponytail-debt` — اعثر على debt.
- `/ponytail-gain` — checklist قبل feature.

## ما لا يُختصر أبداً
Validation, error handling, security, accessibility.

## المصدر
github.com/DietrichGebert/ponytail (MIT).
```

#### `docs/features/ar/spec-kit.md`

```markdown
# Spec-Kit Lite — تطوير موجّه بالمواصفات

## ما هو؟
نسخة TypeScript محلية من Spec-Driven Development بدون Python.

## الـworkflow
1. `INI Brain: Create Spec` — اكتب الـ"ماذا".
2. `INI Brain: Generate Plan` — أضف stack.
3. `INI Brain: Break into Tasks` — قسّم.
4. `INI Brain: Open Next Task` — نفّذ.

## الملفات
- `.specify/memory/constitution.md`
- `.specify/specs/<slug>/spec.md`
- `.specify/specs/<slug>/plan.md`
- `.specify/specs/<slug>/tasks.md`

## المصدر
github.com/github/spec-kit (MIT) — هذه نسخة TypeScript مستقلة.
```

#### `docs/features/ar/knowledge-graph.md`

```markdown
# Knowledge Graph — رسم تبعيات المشروع

## الفائدة
- فهم بصري للمشروع.
- معرفة تأثير تغيير أي ملف (blast radius).
- ~71x أقل توكنات للـqueries عن المشروع.

## التفعيل
- `INI Brain: Build Knowledge Graph` — يبني.
- `INI Brain: Show Knowledge Graph` — يعرض Mermaid.
- `INI Brain: Find Impact` — تأثير الملف الحالي.

## التصنيف
كل edge موسوم: `EXTRACTED` (من AST) / `INFERRED` (heuristic) / `AMBIGUOUS`.

## المصدر
github.com/safishamsi/graphify (MIT) — TypeScript Lite version.
```

#### `docs/features/ar/auto-update.md`

```markdown
# Auto-Update — تحديثات تلقائية

## ما يفعله
يفحص 7 ريبوهات GitHub أسبوعياً ويخبرك إذا تحدّثت.

## الـsources
- ponytail
- caveman
- claude-token-efficient
- spec-kit
- superpowers
- graphify
- token-optimizer

## الإعدادات
- `iniBrain.autoUpdate.enabled` (default: false)
- `iniBrain.autoUpdate.intervalHours` (default: 168 = أسبوع)
- `iniBrain.autoUpdate.requireApproval` (default: true)

## الأوامر
- `INI Brain: Check Upstream Updates`
- `INI Brain: Configure Auto-Update`

## ملاحظة
لا يحتاج API key. GitHub public API يسمح بـ60 req/h.
```

#### `docs/features/ar/superpowers.md`

```markdown
# Superpowers — Skills قابلة للتركيب

## ما هو؟
نظام skills يستدعي بعضه عبر `@skill-name`.

## كيف يعمل
- skill يكتب في `.brain/skills/name.md`.
- يمكن أن يحتوي `@other-skill` للإشارة.
- المحرّك يحلّ السلسلة تلقائياً.

## الأوامر MCP
- `ini_brain_skills_list` — قائمة الـskills.
- `ini_brain_skills_resolve` — حلّ السلسلة.

## المصدر
github.com/obra/superpowers (MIT).
```

#### `docs/features/ar/commands-reference.md`

```markdown
# مرجع الأوامر الشامل

## أوامر VS Code (Ctrl+Shift+P)

### Core
| الأمر | الوظيفة |
|------|---------|
| `INI Brain: Scan Project` | فحص المشروع |
| `INI Brain: Rebuild Brain` | إعادة بناء |
| `INI Brain: Guided Setup` | معالج إعداد |
| `INI Brain: Save Memory` | احفظ ذكرى |
| `INI Brain: Search Memory` | ابحث |
| `INI Brain: Show Project Profile` | ملف المشروع |
| `INI Brain: Copy MCP Config` | انسخ إعداد MCP |
| `INI Brain: Install Integrations` | تكامل مع وكيل |
| `INI Brain: Configure AI Provider` | إعداد API |

### Savings
| الأمر | الوظيفة |
|------|---------|
| `INI Brain: Enable Caveman Mode` | -70٪ output |
| `INI Brain: Disable Caveman Mode` | إيقاف Caveman |
| `INI Brain: Enable Ponytail Mode` | -54٪ code |
| `INI Brain: Disable Ponytail Mode` | إيقاف Ponytail |
| `INI Brain: Enable Claude Lean Rules` | قواعد Claude |
| `INI Brain: Enable All Savings` | الكل (موصى به) |
| `INI Brain: Disable All Savings` | إيقاف الكل |
| `INI Brain: Switch Savings Level` | lite/full/ultra |
| `INI Brain: Show Token Dashboard` | داشبورد |
| `INI Brain: Measure Current File Tokens` | حساب الملف |

### Methodology
| الأمر | الوظيفة |
|------|---------|
| `INI Brain: Create Spec (SDD)` | spec جديد |
| `INI Brain: Generate Plan from Spec` | خطة |
| `INI Brain: Break Spec into Tasks` | مهام |
| `INI Brain: Open Next Task to Implement` | المهمة التالية |

### Graph
| الأمر | الوظيفة |
|------|---------|
| `INI Brain: Build Knowledge Graph` | بناء |
| `INI Brain: Show Knowledge Graph` | عرض |
| `INI Brain: Find Impact (Blast Radius)` | تأثير |

### Adapters & Updates
| الأمر | الوظيفة |
|------|---------|
| `INI Brain: Install Skills for All Agents` | نشر شامل |
| `INI Brain: Remove Skills from All Agents` | إزالة شاملة |
| `INI Brain: Check Upstream Updates` | فحص upstream |
| `INI Brain: Apply Upstream Updates` | تطبيق |
| `INI Brain: Configure Auto-Update` | إعدادات |

## Slash Commands داخل الـAI Chat

### Cline
```
/caveman full
/ponytail-review
/spec-new feature-x
```

### Claude Code
```
/caveman ultra
/ponytail-audit
```

### Cursor
```
@caveman
@ponytail
```

### Codex
```
codex run /ponytail-debt
```

### Gemini CLI
```bash
gemini --skill caveman
```

## MCP Tools (تلقائية)

| الأداة | الوظيفة |
|------|---------|
| `ini_brain_status` | الحالة |
| `ini_brain_save_memory` | حفظ ذكرى |
| `ini_brain_search_memory` | بحث |
| `ini_brain_get_context` | سياق |
| `ini_brain_savings_status` | حالة التوفير |
| `ini_brain_measure_tokens` | عدّ توكنات |
| `ini_brain_graph_build` | بناء graph |
| `ini_brain_graph_impact` | تأثير |
| `ini_brain_spec_list` | قائمة specs |
| `ini_brain_spec_read` | قراءة spec |
| `ini_brain_spec_create` | إنشاء |
| `ini_brain_skills_list` | قائمة skills |
| `ini_brain_skills_resolve` | حلّ سلسلة |

## سيناريوهات الاستخدام

### مشروع جديد
1. `Guided Setup`.
2. `Enable All Savings`.
3. `Install Skills for All Agents`.

### feature جديد
1. `Create Spec` → ماذا.
2. `Generate Plan` → كيف.
3. `Break into Tasks` → قسّم.
4. وكيلك: `/spec-do`.

### مراجعة كود
1. افتح الملف.
2. وكيلك: `/ponytail-review`.

### فهم المشروع
1. `Build Knowledge Graph`.
2. `Show Knowledge Graph`.
3. `Find Impact` على ملف.

### متابعة upstream
1. `Configure Auto-Update` → فعّل.
2. كل أسبوع: إشعار → موافقتك → تطبيق.
```

### 10.2 النسخ الإنجليزية

أنشئ النسخة الإنجليزية لكل ملف من 10.1 (نفس المحتوى مترجم) في `docs/features/en/`.

### 10.3 حدّث `README.md` الرئيسي

أضف في أعلى `ini-brain-ai-universal/README.md`:

```markdown
## 🎉 What's New in 3.0.0

- 💰 **Caveman Mode** — output tokens -70%
- 🦥 **Ponytail Mode** — generated code -54%
- 🧹 **Claude Lean** — no preamble, no sycophancy
- 📋 **Spec-Kit Lite** — local SDD workflow
- 🧬 **Knowledge Graph** — visual project map
- 🔌 **12 Agent Adapters** — Claude/Codex/Cline/Cursor/Windsurf/Antigravity/Gemini/Copilot/OpenCode/Kimi/Kiro + universal
- 🔄 **Auto-Update** — tracks 7 upstream sources
- 📚 **Bilingual Docs** — Arabic + English

See: [docs/features/ar/overview.md](docs/features/ar/overview.md) · [docs/features/en/overview.md](docs/features/en/overview.md)

## Acknowledgements

MIT-licensed projects integrated:
- [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)
- [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)
- [drona23/claude-token-efficient](https://github.com/drona23/claude-token-efficient)
- [github/spec-kit](https://github.com/github/spec-kit)
- [obra/superpowers](https://github.com/obra/superpowers)
- [safishamsi/graphify](https://github.com/safishamsi/graphify)
- [alexgreensh/token-optimizer](https://github.com/alexgreensh/token-optimizer)
```

### 10.4 احفظ
```
ini_brain_save_memory: "v4 progress: phase 10 complete. Bilingual docs + README updated."
```

---

## المرحلة 11: Smoke Tests + التغليف

**الزمن المتوقع:** 30 دقيقة.

### 11.1 `scripts/savings-smoke.cjs`

```javascript
const fs = require('fs');
const os = require('os');
const path = require('path');
const { deployPonytailLocal, removePonytailLocal } = require('../dist/savings/ponytail');
const { deployCavemanLocal, removeCavemanLocal } = require('../dist/savings/caveman');
const { deployClaudeLeanLocal } = require('../dist/savings/claudeLean');
const { measureText } = require('../dist/savings/tokenMeter');

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ini-savings-'));
  console.log('tmp:', tmp);

  const pony = await deployPonytailLocal({ root: tmp, mode: 'full' });
  if (!pony.length) throw new Error('no ponytail');
  console.log('ponytail:', pony.length);

  const cave = await deployCavemanLocal({ root: tmp, mode: 'full' });
  if (!cave.length) throw new Error('no caveman');
  console.log('caveman:', cave.length);

  const lean = await deployClaudeLeanLocal(tmp);
  if (!lean.length) throw new Error('no lean');
  console.log('lean:', lean.length);

  const stats = measureText('Hello world this is a test');
  if (stats.totalTokens <= 0) throw new Error('token count failed');
  console.log('tokens:', stats.totalTokens);

  await removePonytailLocal(tmp);
  await removeCavemanLocal(tmp);
  console.log('OK savings smoke');
})().catch(e => { console.error(e); process.exit(1); });
```

### 11.2 `scripts/adapters-smoke.cjs`

```javascript
const fs = require('fs');
const os = require('os');
const path = require('path');
const { deployToAllAgents, detectInstalledAdapters, ALL_ADAPTERS } = require('../dist/adapters/registry');

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ini-adapters-'));
  console.log('tmp:', tmp);

  fs.mkdirSync(path.join(tmp, '.cursor'));
  fs.mkdirSync(path.join(tmp, '.clinerules'));

  const detected = await detectInstalledAdapters(tmp);
  console.log('detected:', detected.map(d => d.id).join(', '));

  const results = await deployToAllAgents({
    root: tmp, skillName: 'test-skill', skillBody: '# Test\n', onlyInstalled: false,
  });
  if (results.length !== ALL_ADAPTERS.length) throw new Error('not all ran');
  console.log('deployed to', results.length, 'adapters');
  console.log('OK adapters smoke');
})().catch(e => { console.error(e); process.exit(1); });
```

### 11.3 `scripts/updater-smoke.cjs`

```javascript
const fs = require('fs');
const os = require('os');
const path = require('path');
const { readState, writeState } = require('../dist/updater/stateStore');

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ini-updater-'));
  await writeState(tmp, { ponytail: { lastSha: 'abc', lastCheck: '2026-01-01' } });
  const s = await readState(tmp);
  if (s.ponytail.lastSha !== 'abc') throw new Error('state mismatch');
  console.log('OK updater smoke');
})().catch(e => { console.error(e); process.exit(1); });
```

### 11.4 الاختبار النهائي
```powershell
cd c:\Users\helen\Downloads\vs\exbrain.all\ini-brain-ai-universal
npm run compile
npm run smoke:savings
npm run smoke:adapters
npm run smoke:updater
npm run smoke:all
```

كلها يجب أن تنجح.

### 11.5 التغليف
```powershell
npm run package
```

النتيجة: `ini-brain-ai-universal-3.0.0.vsix`.

### 11.6 الاختبار اليدوي
1. افتح VS Code جديد.
2. Extensions → Install from VSIX → اختر الملف.
3. افتح أي workspace.
4. `Ctrl+Shift+P` → "INI Brain" — يجب رؤية 35+ command.
5. `Enable All Savings` — يجب نجاحه.
6. تحقق من `.brain/skills/caveman.md`, `ponytail.md`, إلخ.

### 11.7 القرار النهائي
```
ini_brain_save_memory (kind: decision, importance: 10):
"v3.0.0 RELEASED. Integrated: Caveman+Ponytail+ClaudeLean+SpecKit+Superpowers+Graphify+TokenOptimizer.
12 agent adapters. Auto-update from 7 upstream sources. Bilingual docs.
35+ VS Code commands, 14 MCP tools. Zero new runtime dependencies."
```

---

## قائمة الفحص النهائية

### ✅ ما يجب أن يكون موجوداً
- [ ] `package.json` بإصدار `3.0.0` + 35 command + 12 setting.
- [ ] 5 ملفات في `src/savings/` (ponytail, caveman, claudeLean, tokenMeter, index).
- [ ] 2 ملف في `src/methodology/`.
- [ ] 2 ملف في `src/graph/`.
- [ ] 14 ملف في `src/adapters/` (12 adapter + types + registry + _helpers).
- [ ] 3 ملف في `src/updater/`.
- [ ] 3 ملف في `src/mcp/tools/`.
- [ ] `src/extension.ts` معدّل بإضافة 24 command جديد.
- [ ] `src/mcp/server.ts` يسجّل الأدوات الجديدة.
- [ ] `src/ui/sidebarProvider.ts` فيه cards جديدة.
- [ ] 16+ ملف توثيق في `docs/features/ar/` و `docs/features/en/`.
- [ ] `README.md` فيه قسم 3.0.0 + Acknowledgements.
- [ ] 3 ملفات smoke test جديدة.
- [ ] `ini-brain-ai-universal-3.0.0.vsix` مُولّد.

### ❌ ما يجب ألا يكون موجوداً
- [ ] أي npm dependency جديدة في `dependencies` (must stay empty).
- [ ] أي API key أو token في الكود.
- [ ] أي تغيير في `.git/` أو `.brain/backups/`.
- [ ] أي ملف Python.
- [ ] أي مكتبة UI ثقيلة (React/D3) — Mermaid CDN يكفي.

### 🎯 معايير النجاح
- `npm run compile` ينجح.
- `npm run smoke:all` يمر.
- `npm run package` ينتج `.vsix` < 5MB.
- اختبار يدوي: 35+ command تظهر.
- اختبار يدوي: `Enable All Savings` ينشئ الملفات الصحيحة.

---

## 🎓 ملاحظات أخيرة

### إذا واجهت مشكلة
1. توقف.
2. ابحث `ini_brain_search_memory "v4 progress"`.
3. `npm run compile` لرؤية الخطأ.
4. أصلح وتابع.

### إذا الوقت ضيق
الترتيب الأهم:
1. **المرحلة 0** — تحضير.
2. **المرحلة 1** — package.json.
3. **المرحلة 2** — Savings (أكبر قيمة).
4. **المرحلة 4** — Adapters.
5. **المرحلة 8** — extension.ts.
6. **المرحلة 11** — packaging.

المراحل 3, 5, 6, 7, 9, 10 يمكن تأجيلها لـ3.1.0.

---

**🏁 نهاية الخطة v4.0.0 — Part 2.**
**إجمالي v4 (Part 1 + Part 2):** ~5000 سطر / ~120K توكن.
**التكلفة على Haiku 4.5:** ~$10-15.
**الوقت:** 12-16 ساعة.

> **بالتوفيق يا صديقي 🎯**
