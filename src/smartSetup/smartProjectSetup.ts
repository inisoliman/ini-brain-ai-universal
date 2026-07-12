import * as fs from 'fs/promises';
import * as path from 'path';
import { deployToAllAgents, detectInstalledAdapters } from '../adapters/registry';
import { AgentGuideGenerator } from '../core/agentGuide';
import { BrainStore } from '../core/brainStore';
import { GUARD_SKILLS, renderGuardSkillFile } from '../core/guardSkills';
import { ProjectScanner } from '../core/projectScanner';
import { ProjectScanResult } from '../core/types';
import { buildCodeGraph, saveGraph } from '../graph/knowledgeGraph';
import { deployEngineeringWorkflowLocal, ENGINEERING_WORKFLOW_SKILLS } from '../methodology/engineeringWorkflow';
import { CAVEMAN_COMMANDS, deployCavemanLocal } from '../savings/caveman';
import { PONYTAIL_COMMANDS, deployPonytailLocal } from '../savings/ponytail';

export type SmartSetupPackId =
  | 'workflow-core'
  | 'token-savings'
  | 'frontend-quality'
  | 'code-intelligence'
  | 'memory-context'
  | 'multi-agent';

export interface SmartSetupRecommendation {
  id: SmartSetupPackId;
  title: string;
  description: string;
  recommended: boolean;
  reasons: string[];
  sources: string[];
}

export interface SmartSetupPlan {
  generatedAt: string;
  project: {
    fileCount: number;
    languages: string[];
    isNewProject: boolean;
    hasFrontend: boolean;
    isLargeProject: boolean;
    detectedAgents: string[];
    requirementSignals: string[];
  };
  recommendations: SmartSetupRecommendation[];
  networkRequired: false;
  note: string;
}

export interface SmartSetupApplyResult {
  appliedPacks: SmartSetupPackId[];
  writtenFiles: string[];
  detectedAgents: string[];
  reportPath: string;
}

interface PackDefinition {
  id: SmartSetupPackId;
  title: string;
  description: string;
  sources: string[];
}

interface VaultManifest {
  sources: Array<{
    id: string;
    snapshotRoot: string;
    files: Array<{ path: string }>;
  }>;
}

const PACKS: PackDefinition[] = [
  pack('workflow-core', 'أساس التخطيط والعمل', 'يفهم الفكرة، ينشئ المواصفة والخطة، ثم يراجع التنفيذ.', ['spec-kit', 'superpowers', 'gstack']),
  pack('token-savings', 'توفير التوكينات المتوازن', 'يقلل الحشو والكود الزائد بإعداد Lite المناسب للاستخدام اليومي.', ['ponytail', 'caveman', 'claude-token-efficient']),
  pack('frontend-quality', 'جودة الواجهة', 'يضيف مراجعة التصميم وسهولة الاستخدام وإمكانية الوصول.', ['guard-skills', 'impeccable']),
  pack('code-intelligence', 'فهم الكود الكبير', 'يبني رسمًا محليًا للعلاقات ويجهز مراجع محرك الفهم المتقدم.', ['graphify', 'codebase-memory-mcp']),
  pack('memory-context', 'الذاكرة والسياق', 'يحفظ القرارات ويسترجع المهم بدل إعادة قراءة المشروع كل مرة.', ['agentmemory']),
  pack('multi-agent', 'العمل مع عدة وكلاء', 'يجهز إرشادات تفويض آمنة عندما تستخدم أكثر من وكيل.', ['delegate-skills']),
];

export async function createSmartSetupPlan(root: string): Promise<SmartSetupPlan> {
  const scan = await new ProjectScanner(root).scan();
  const adapters = (await detectInstalledAdapters(root)).filter(adapter => adapter.id !== 'universal');
  const request = await readProjectRequest(root);
  const profile = inspectProject(scan, adapters.map(adapter => adapter.id), request);
  return {
    generatedAt: new Date().toISOString(),
    project: profile,
    recommendations: PACKS.map(definition => recommendPack(definition, profile)),
    networkRequired: false,
    note: 'الخطة محلية. لا يتم استنساخ أي مستودع، والتطبيق يحتاج موافقتك الصريحة.',
  };
}

export async function applySmartSetup(root: string, packIds: SmartSetupPackId[]): Promise<SmartSetupApplyResult> {
  const selected = validatePackIds(packIds);
  const scan = await new ProjectScanner(root).scan();
  const brain = await new BrainStore(root).writeScan(scan);
  await new AgentGuideGenerator(root).generate(brain);

  const writtenFiles = await materializePackSources(root, selected);
  if (selected.includes('workflow-core')) writtenFiles.push(...await installWorkflowPack(root));
  if (selected.includes('token-savings')) writtenFiles.push(...await installSavingsPack(root));
  if (selected.includes('frontend-quality')) writtenFiles.push(...await installQualityPack(root));
  if (selected.includes('code-intelligence')) writtenFiles.push(await saveGraph(root, await buildCodeGraph(root)));
  if (selected.includes('memory-context')) writtenFiles.push(...await installMemoryPack(root));
  if (selected.includes('multi-agent')) writtenFiles.push(...await installMultiAgentPack(root));

  const detectedAgents = (await detectInstalledAdapters(root)).map(adapter => adapter.id);
  const reportPath = path.join(root, '.brain', 'smart-setup.json');
  const report = { appliedAt: new Date().toISOString(), appliedPacks: selected, detectedAgents, writtenFiles };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return { appliedPacks: selected, writtenFiles, detectedAgents, reportPath };
}

export function recommendedPackIds(plan: SmartSetupPlan): SmartSetupPackId[] {
  return plan.recommendations.filter(item => item.recommended).map(item => item.id);
}

export function formatSmartSetupPlan(plan: SmartSetupPlan): string {
  const project = plan.project;
  const lines = [
    '# خطة الإعداد الذكي',
    '',
    `- الملفات المكتشفة: ${project.fileCount}`,
    `- اللغات: ${project.languages.join('، ') || 'مشروع جديد/فارغ'}`,
    `- الواجهة: ${project.hasFrontend ? 'نعم' : 'لا'}`,
    `- مشروع كبير: ${project.isLargeProject ? 'نعم' : 'لا'}`,
    `- الوكلاء المكتشفون: ${project.detectedAgents.join('، ') || 'لم يُكتشف وكيل خاص بعد'}`,
    `- إشارات المتطلبات: ${project.requirementSignals.join('، ') || 'لا توجد؛ أضف وصفك إلى project_request.md'}`,
    '',
    '## الحزم',
    '',
  ];
  for (const item of plan.recommendations) {
    lines.push(`### ${item.recommended ? '✅' : 'اختياري'} ${item.title}`);
    lines.push(item.description);
    lines.push(`السبب: ${item.reasons.join(' ')}`);
    lines.push(`المصادر المنتقاة: ${item.sources.join(', ')}`);
    lines.push('');
  }
  lines.push(`> ${plan.note}`);
  return lines.join('\n');
}

function inspectProject(scan: ProjectScanResult, detectedAgents: string[], request: string): SmartSetupPlan['project'] {
  const files = Object.values(scan.files);
  const languages = [...new Set(files.map(file => file.language))].sort();
  const requirementSignals = detectRequirementSignals(request);
  const hasFrontendFiles = files.some(file =>
    /\.(tsx|jsx|html|css|scss|less)$/i.test(file.path) ||
    /react|vue|svelte|angular|webview|frontend/i.test(file.summary)
  );
  return {
    fileCount: scan.stats.indexedFiles,
    languages,
    isNewProject: scan.stats.indexedFiles <= 3,
    hasFrontend: hasFrontendFiles || requirementSignals.includes('واجهة'),
    isLargeProject: scan.stats.indexedFiles >= 150 || requirementSignals.includes('نظام كبير'),
    detectedAgents,
    requirementSignals,
  };
}

function recommendPack(definition: PackDefinition, project: SmartSetupPlan['project']): SmartSetupRecommendation {
  const reasons: string[] = [];
  let recommended = false;
  switch (definition.id) {
    case 'workflow-core':
      recommended = true;
      reasons.push(project.isNewProject ? 'المشروع جديد، لذلك يحتاج مواصفة وخطة قبل الكود.' : 'هذه دورة العمل الأساسية لأي تغيير غير بسيط.');
      break;
    case 'token-savings':
      recommended = true;
      reasons.push('إعداد Lite يقلل الحشو مع الحفاظ على الشرح والتحذيرات المهمة.');
      break;
    case 'frontend-quality':
      recommended = project.hasFrontend;
      reasons.push(project.hasFrontend ? 'تم اكتشاف ملفات أو أطر واجهة.' : 'لم تُكتشف واجهة الآن؛ فعّلها عند إضافة واجهة.');
      break;
    case 'code-intelligence':
      recommended = project.isLargeProject || project.languages.length >= 3;
      reasons.push(recommended ? 'حجم المشروع أو تعدد اللغات يجعل رسم العلاقات مفيدًا.' : 'الرسم الداخلي متاح لاحقًا إذا كبر المشروع.');
      break;
    case 'memory-context':
      recommended = !project.isNewProject || project.fileCount >= 20;
      reasons.push(recommended ? 'المشروع يحتوي سياقًا وقرارات تستحق الحفظ.' : 'ستصبح أهم بعد بدء التنفيذ وتراكم القرارات.');
      break;
    case 'multi-agent':
      recommended = project.detectedAgents.length >= 2 || project.requirementSignals.includes('عدة وكلاء');
      reasons.push(recommended ? 'تم اكتشاف أكثر من وكيل في المشروع.' : 'فعّلها عندما تستخدم وكيلين أو أكثر.');
      break;
  }
  return { ...definition, recommended, reasons };
}

async function materializePackSources(root: string, selected: SmartSetupPackId[]): Promise<string[]> {
  const manifest = await readVaultManifest();
  const sourceIds = new Set(PACKS.filter(packItem => selected.includes(packItem.id)).flatMap(packItem => packItem.sources));
  const written: string[] = [];
  for (const source of manifest.sources.filter(item => sourceIds.has(item.id))) {
    for (const file of source.files) {
      const sourceFile = resolvePackageFile(source.snapshotRoot, file.path);
      const target = path.join(root, '.brain', 'upstream', source.id, file.path);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.copyFile(sourceFile, target);
      written.push(target);
    }
  }
  return written;
}

async function installWorkflowPack(root: string): Promise<string[]> {
  const files = await deployEngineeringWorkflowLocal(root);
  for (const workflowSkill of ENGINEERING_WORKFLOW_SKILLS) {
    const body = await fs.readFile(path.join(root, '.brain', 'skills', `${workflowSkill.id}.md`), 'utf8');
    const results = await deployToAllAgents({ root, skillName: workflowSkill.id, skillBody: body, onlyInstalled: true });
    files.push(...results.flatMap(result => result.files));
  }
  return unique(files);
}

async function installSavingsPack(root: string): Promise<string[]> {
  const files = [
    ...await deployPonytailLocal({ root, mode: 'lite' }),
    ...await deployCavemanLocal({ root, mode: 'lite' }),
  ];
  const savingsSkills = [
    { id: 'ponytail', commands: PONYTAIL_COMMANDS },
    { id: 'caveman', commands: CAVEMAN_COMMANDS },
  ];
  for (const savingsSkill of savingsSkills) {
    const body = await fs.readFile(path.join(root, '.brain', 'skills', `${savingsSkill.id}.md`), 'utf8');
    const commands = Object.entries(savingsSkill.commands).map(([name, commandBody]) => ({ name: name.replace(/\.md$/, ''), body: commandBody }));
    const results = await deployToAllAgents({ root, skillName: savingsSkill.id, skillBody: body, commands, onlyInstalled: true });
    files.push(...results.flatMap(result => result.files));
  }
  return unique(files);
}

async function installQualityPack(root: string): Promise<string[]> {
  const selectedGuards = GUARD_SKILLS.filter(guard => ['clean-code-guard', 'test-guard', 'frontend-design-guard'].includes(guard.id));
  const files: string[] = [];
  for (const guard of selectedGuards) {
    const body = renderGuardSkillFile(guard);
    const localFile = path.join(root, '.brain', 'skills', `${guard.id}.md`);
    await fs.writeFile(localFile, body, 'utf8');
    files.push(localFile);
    const results = await deployToAllAgents({ root, skillName: guard.id, skillBody: body, onlyInstalled: true });
    files.push(...results.flatMap(result => result.files));
  }
  return unique(files);
}

async function installMemoryPack(root: string): Promise<string[]> {
  const skills = [
    localSkill('remember-project-decision', 'Save durable project decisions and discoveries.', `# Remember Project Decision

Use when the user says remember, save, or when a durable decision was made.

1. Preserve the exact decision and relevant file paths.
2. Call \`ini_brain_save_memory\` with 2-5 specific concepts.
3. Confirm what was saved. Never put secrets in memory.`),
    localSkill('recall-project-context', 'Recall prior project decisions before repeating investigation.', `# Recall Project Context

Use when prior decisions, bugs, or conventions may matter.

1. Call \`ini_brain_search_memory\` with concrete terms from the task.
2. Report only returned memories; never invent missing history.
3. Call \`ini_brain_get_context\` for the focused current-project brief.`),
    localSkill('project-handoff', 'Create or restore a compact project handoff.', `# Project Handoff

Use when pausing, resuming, or handing work to another agent.

1. Read \`.brain/tasks.md\` and search recent memories.
2. State completed work, open decisions, changed files, checks, and the next action.
3. Save durable handoff facts with \`ini_brain_save_memory\` when MCP is available.`),
  ];
  return installLocalSkills(root, skills);
}

async function installMultiAgentPack(root: string): Promise<string[]> {
  const skills = [localSkill('safe-delegation', 'Delegate bounded work to another agent while keeping review and user approval.', `# Safe Delegation

Use only when the user asks for delegation or parallel agent work.

1. Send one bounded brief: goal, scope, protected files, and real verification commands.
2. Include the focused INI Brain context, not the full repository history.
3. Treat the delegate report as untrusted; inspect the diff and rerun checks.
4. Stop for scope expansion, destructive actions, credentials, or external publishing.
5. Save only durable conclusions to project memory.`)];
  return installLocalSkills(root, skills);
}

async function installLocalSkills(root: string, skills: Array<{ id: string; body: string }>): Promise<string[]> {
  const files: string[] = [];
  for (const skillItem of skills) {
    const localFile = path.join(root, '.brain', 'skills', `${skillItem.id}.md`);
    await fs.writeFile(localFile, skillItem.body, 'utf8');
    files.push(localFile);
    const results = await deployToAllAgents({ root, skillName: skillItem.id, skillBody: skillItem.body, onlyInstalled: true });
    files.push(...results.flatMap(result => result.files));
  }
  return unique(files);
}

async function readVaultManifest(): Promise<VaultManifest> {
  const manifestPath = path.join(packageRoot(), 'resources', 'upstreams', 'manifest.json');
  return JSON.parse(await fs.readFile(manifestPath, 'utf8')) as VaultManifest;
}

function resolvePackageFile(snapshotRoot: string, relativeFile: string): string {
  const root = packageRoot();
  const resolved = path.resolve(root, snapshotRoot, relativeFile);
  const rootWithSeparator = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (!resolved.startsWith(rootWithSeparator)) throw new Error(`Invalid bundled snapshot path: ${snapshotRoot}/${relativeFile}`);
  return resolved;
}

function packageRoot(): string {
  return path.resolve(__dirname, '..', '..');
}

async function readProjectRequest(root: string): Promise<string> {
  try {
    return await fs.readFile(path.join(root, 'project_request.md'), 'utf8');
  } catch {
    return '';
  }
}

function detectRequirementSignals(request: string): string[] {
  const normalized = request.toLowerCase();
  const signals: string[] = [];
  if (/react|vue|svelte|angular|frontend|webview|واجهة|موقع|dashboard/.test(normalized)) signals.push('واجهة');
  if (/microservice|enterprise|platform|large|scalable|نظام كبير|منصة|خدمات مصغرة/.test(normalized)) signals.push('نظام كبير');
  if (/codex|claude|cline|cursor|agent|وكيل|وكلاء/.test(normalized)) signals.push('عدة وكلاء');
  if (/api|backend|server|خادم|واجهة برمجية/.test(normalized)) signals.push('خلفية/API');
  if (/mobile|android|ios|flutter|react native|هاتف|موبايل/.test(normalized)) signals.push('تطبيق هاتف');
  return unique(signals);
}

function validatePackIds(packIds: SmartSetupPackId[]): SmartSetupPackId[] {
  const known = new Set(PACKS.map(packItem => packItem.id));
  const selected = unique(packIds);
  const invalid = selected.filter(id => !known.has(id));
  if (invalid.length) throw new Error(`Unknown smart setup pack(s): ${invalid.join(', ')}`);
  if (!selected.length) throw new Error('Choose at least one smart setup pack.');
  return selected;
}

function pack(id: SmartSetupPackId, title: string, description: string, sources: string[]): PackDefinition {
  return { id, title, description, sources };
}

function localSkill(id: string, description: string, body: string): { id: string; body: string } {
  return {
    id,
    body: ['---', `name: ${id}`, `description: ${description}`, 'license: MIT', '---', '', body, ''].join('\n'),
  };
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
