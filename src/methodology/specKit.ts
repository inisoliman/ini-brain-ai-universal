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
