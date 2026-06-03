import * as fs from 'fs/promises';
import * as path from 'path';
import { BrainData, FileRecord } from './types';

interface SkillDefinition {
  id: string;
  title: string;
  whenToUse: string[];
  steps: string[];
  checks: string[];
}

export interface AgentGuideResult {
  agentsPath: string;
  compactContextPath: string;
  workflowPath: string;
  skillsIndexPath: string;
  qualityGatesPath: string;
  generatedSkills: string[];
}

export class AgentGuideGenerator {
  constructor(private readonly root: string) {}

  async generate(data: BrainData): Promise<AgentGuideResult> {
    const brainDir = path.join(this.root, '.brain');
    const skillsDir = path.join(brainDir, 'skills');
    const clineSkillsDir = path.join(this.root, '.cline', 'skills');
    const clineRulesSkillsDir = path.join(this.root, '.clinerules', 'skills');
    const clineWorkflowsDir = path.join(this.root, '.clinerules', 'workflows');
    const codexSkillsDir = path.join(this.root, '.codex', 'skills', 'ini-brain-project-memory');
    await Promise.all([
      fs.mkdir(skillsDir, { recursive: true }),
      fs.mkdir(clineSkillsDir, { recursive: true }),
      fs.mkdir(clineRulesSkillsDir, { recursive: true }),
      fs.mkdir(clineWorkflowsDir, { recursive: true }),
      fs.mkdir(codexSkillsDir, { recursive: true })
    ]);

    const skills = detectSkills(data);
    const workflow = buildWorkflow(skills);
    const skillsIndex = buildSkillsIndex(skills);
    const quality = buildQualityGates(data);
    await Promise.all([
      this.writeAgentsFile(path.join(this.root, 'AGENTS.md'), data, skills),
      fs.writeFile(path.join(brainDir, 'workflow.md'), workflow, 'utf8'),
      fs.writeFile(path.join(brainDir, 'skills.md'), skillsIndex, 'utf8'),
      fs.writeFile(path.join(brainDir, 'quality_gates.md'), quality, 'utf8'),
      ...skills.map(skill => fs.writeFile(path.join(skillsDir, `${skill.id}.md`), formatSkill(skill), 'utf8')),
      ...skills.map(skill => fs.writeFile(path.join(clineSkillsDir, `${skill.id}.md`), formatSkill(skill), 'utf8')),
      ...skills.map(skill => fs.writeFile(path.join(clineRulesSkillsDir, `${skill.id}.md`), formatSkill(skill), 'utf8')),
      fs.writeFile(path.join(clineWorkflowsDir, 'ini-brain-project-workflow.md'), workflow, 'utf8'),
      fs.writeFile(path.join(codexSkillsDir, 'SKILL.md'), buildCodexSkill(), 'utf8')
    ]);
    return {
      agentsPath: 'AGENTS.md',
      compactContextPath: '.brain/compact_context.md',
      workflowPath: '.brain/workflow.md',
      skillsIndexPath: '.brain/skills.md',
      qualityGatesPath: '.brain/quality_gates.md',
      generatedSkills: skills.map(skill => `.brain/skills/${skill.id}.md`)
    };
  }

  private async writeAgentsFile(file: string, data: BrainData, skills: SkillDefinition[]): Promise<void> {
    const generated = buildAgentsGeneratedSection(data, skills);
    const start = '<!-- INI:BRAIN:START -->';
    const end = '<!-- INI:BRAIN:END -->';
    const block = `${start}\n${generated}\n${end}`;
    let current = '';
    try {
      current = await fs.readFile(file, 'utf8');
    } catch {
      current = '';
    }
    if (current.includes(start) && current.includes(end)) {
      await fs.writeFile(file, current.replace(new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`), block), 'utf8');
      return;
    }
    const prefix = current.trim() ? `${current.trim()}\n\n---\n\n` : '# AI Agent Operating Guide\n\n';
    await fs.writeFile(file, `${prefix}${block}\n`, 'utf8');
  }
}

export function detectSkills(data: BrainData): SkillDefinition[] {
  const languages = new Set(Object.keys(data.projectMap.languages));
  const files = Object.keys(data.files);
  const skills: SkillDefinition[] = [generalSkill()];
  if (files.includes('package.json')) skills.push(nodeSkill());
  if ([...languages].some(lang => lang.includes('TypeScript'))) skills.push(typeScriptSkill());
  if (files.some(file => file === 'package.json') && files.some(file => /src\/extension\.ts$/.test(file))) skills.push(vsCodeExtensionSkill());
  if (files.some(file => /\.tsx?$/.test(file) && /ui|webview|component/i.test(file))) skills.push(uiSkill());
  if (files.some(file => file.includes('.brain') || file.toLowerCase() === 'agents.md')) skills.push(agentMemorySkill());
  return uniqueSkills(skills);
}

function buildAgentsGeneratedSection(data: BrainData, skills: SkillDefinition[]): string {
  return [
    '# INI Brain AI Universal Agent Guide',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Workspace: ${data.projectMap.root}`,
    `Indexed files: ${data.projectMap.totalFiles}`,
    '',
    '## Required Reading',
    '- `.brain/compact_context.md`',
    '- `.brain/workflow.md`',
    '- `.brain/skills.md`',
    '- `.brain/quality_gates.md`',
    '- `.brain/decisions.md`',
    '- `.brain/tasks.md`',
    '',
    '## Detected Skills',
    skills.map(skill => `- ${skill.title}: .brain/skills/${skill.id}.md`).join('\n') || '- None',
    '',
    '## Core Files',
    data.projectMap.coreFiles.slice(0, 25).map(file => `- ${file}`).join('\n') || '- None',
    '',
    '## Workflow',
    '1. Read this file and `.brain/compact_context.md` first.',
    '2. Select the matching skill from `.brain/skills.md`.',
    '3. Plan the change, implement minimally, and verify.',
    '4. Save durable decisions or discoveries into memory when tools are available.',
    '',
    '## Hard Rules',
    '- Do not write secrets/API keys/tokens into repository files.',
    '- Do not modify `.git/` or `.brain/backups/`.',
    '- Prefer small, compatible changes.',
    '- Verify before claiming completion.'
  ].join('\n');
}

function buildWorkflow(skills: SkillDefinition[]): string {
  return [
    '# Project Workflow',
    '',
    '## 1. Intake',
    '- Read the request and current project context.',
    '- Read AGENTS.md and `.brain/compact_context.md`.',
    '- Check `.brain/tasks.md` and `.brain/decisions.md` when relevant.',
    '',
    '## 2. Skill Selection',
    '- Open `.brain/skills.md`.',
    `- Available skills: ${skills.map(skill => skill.title).join(', ') || 'none'}.`,
    '',
    '## 3. Execution',
    '- Keep changes small and compatible.',
    '- Do not write secrets.',
    '- Preserve generated markers and user-authored content.',
    '',
    '## 4. Verification',
    '- Run the relevant checks from `.brain/quality_gates.md`.',
    '- Report any checks that could not run.',
    '',
    '## 5. Memory',
    '- Update `.brain/tasks.md` for notable pending work.',
    '- Update `.brain/decisions.md` for durable decisions.'
  ].join('\n');
}

function buildSkillsIndex(skills: SkillDefinition[]): string {
  return [
    '# Project Skills Index',
    '',
    'Use the most specific matching skill before editing.',
    '',
    ...skills.map(skill => [
      `## ${skill.title}`,
      `File: .brain/skills/${skill.id}.md`,
      'Use when:',
      ...skill.whenToUse.map(item => `- ${item}`)
    ].join('\n\n'))
  ].join('\n\n');
}

function buildQualityGates(data: BrainData): string {
  const checks = ['- Requested behavior is implemented.', '- No secrets were written.', '- `.git/` and `.brain/backups/` were not modified.'];
  if (data.files['package.json']) checks.push('- Run `npm run compile` when available.', '- Run `npm run package` before distributing a VSIX.');
  return ['# Quality Gates', '', ...checks].join('\n');
}

function formatSkill(skill: SkillDefinition): string {
  return [
    `# Skill: ${skill.title}`,
    '',
    '## When To Use',
    ...skill.whenToUse.map(item => `- ${item}`),
    '',
    '## Steps',
    ...skill.steps.map((item, index) => `${index + 1}. ${item}`),
    '',
    '## Checks',
    ...skill.checks.map(item => `- ${item}`)
  ].join('\n');
}

function buildCodexSkill(): string {
  return [
    '---',
    'name: ini-brain-project-memory',
    'description: Use before coding in this repository to load INI Brain project memory, workflow, skills, and MCP context.',
    '---',
    '',
    '# INI Brain Project Memory',
    '',
    'Before editing:',
    '1. Read `AGENTS.md`.',
    '2. Read `.brain/compact_context.md`.',
    '3. If MCP is configured, call `ini_brain_get_context` with the task.',
    '4. Search memory when previous decisions may matter.',
    '5. Save durable discoveries with `ini_brain_save_memory` after finishing.'
  ].join('\n');
}

function generalSkill(): SkillDefinition {
  return {
    id: 'general-project-maintenance',
    title: 'General Project Maintenance',
    whenToUse: ['Documentation, cleanup, small cross-cutting project changes.'],
    steps: ['Inspect context files.', 'Identify impacted files.', 'Make minimal changes.', 'Run relevant checks.'],
    checks: ['Verify requested behavior.', 'Report remaining risks.']
  };
}

function nodeSkill(): SkillDefinition {
  return {
    id: 'node-package-management',
    title: 'Node Package Management',
    whenToUse: ['Editing package.json, scripts, dependencies, or packaging metadata.'],
    steps: ['Inspect package scripts.', 'Keep dependency changes minimal.', 'Update docs if install behavior changes.'],
    checks: ['Run npm scripts that apply to the change.']
  };
}

function typeScriptSkill(): SkillDefinition {
  return {
    id: 'typescript-development',
    title: 'TypeScript Development',
    whenToUse: ['Editing TypeScript files or exported APIs.'],
    steps: ['Read related types first.', 'Preserve strict typing.', 'Prefer small focused modules.'],
    checks: ['Run `npm run compile` when available.']
  };
}

function vsCodeExtensionSkill(): SkillDefinition {
  return {
    id: 'vscode-extension-development',
    title: 'VS Code Extension Development',
    whenToUse: ['Changing commands, activation events, views, or extension entrypoints.'],
    steps: ['Keep command IDs stable.', 'Align package.json contributions with registered commands.', 'Package before distribution.'],
    checks: ['Run `npm run compile`.', 'Run `npm run package`.']
  };
}

function uiSkill(): SkillDefinition {
  return {
    id: 'vscode-webview-ui',
    title: 'VS Code Webview UI',
    whenToUse: ['Changing sidebar, webview, or settings UI.'],
    steps: ['Keep UI simple and accessible.', 'Avoid inline secrets.', 'Test common command paths.'],
    checks: ['Open the sidebar and verify command buttons.']
  };
}

function agentMemorySkill(): SkillDefinition {
  return {
    id: 'agent-memory-and-context',
    title: 'Agent Memory and Context Engineering',
    whenToUse: ['Editing `.brain`, AGENTS.md, skills, workflows, MCP context, or memory behavior.'],
    steps: ['Preserve manual content outside generated blocks.', 'Keep context compact.', 'Verify generated files are readable by agents.'],
    checks: ['Generate agent guide and inspect key files.']
  };
}

function uniqueSkills(skills: SkillDefinition[]): SkillDefinition[] {
  const seen = new Set<string>();
  return skills.filter(skill => {
    if (seen.has(skill.id)) return false;
    seen.add(skill.id);
    return true;
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
