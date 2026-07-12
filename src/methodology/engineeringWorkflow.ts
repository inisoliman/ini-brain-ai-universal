import * as fs from 'fs/promises';
import * as path from 'path';

export interface EngineeringWorkflowSkill {
  id: string;
  description: string;
  body: string;
}

export const ENGINEERING_WORKFLOW_SKILLS: EngineeringWorkflowSkill[] = [
  skill('product-discovery', 'Clarify the user, pain, evidence, and smallest valuable outcome before planning.', `# Product Discovery

Use for a new product idea or a large feature. Produce a short discovery note, not code.

1. State the user and the painful current workflow using evidence, not a market category.
2. Separate observed demand from assumptions.
3. Identify the smallest outcome that creates real value.
4. List at most three alternatives and recommend one with a reason.
5. Record open decisions before handing off to the specification workflow.

Stop and ask only when a missing answer would materially change scope.`),

  skill('engineering-plan-review', 'Review architecture, data flow, failure paths, security, and verification before implementation.', `# Engineering Plan Review

Use after a specification exists and before implementation.

1. Trace inputs, state changes, outputs, and ownership boundaries.
2. Check compatibility with current architecture and durable project decisions.
3. Enumerate empty, one, many, invalid, timeout, partial-failure, and retry cases.
4. Identify security, privacy, migration, rollback, and performance risks.
5. Define tests and observable completion evidence for every risky behavior.
6. Return APPROVE, REVISE, or BLOCK with concrete reasons.`),

  skill('systematic-investigation', 'Diagnose reproducible root cause before proposing or implementing a fix.', `# Systematic Investigation

Use for bugs, regressions, and unexplained behavior. Do not edit production code until evidence identifies the cause.

1. Restate expected and actual behavior.
2. Reproduce with the smallest reliable case and capture evidence.
3. Trace the failing path and find the first incorrect state transition.
4. Test competing hypotheses; do not confuse correlation with cause.
5. Write a regression test that fails for the observed reason.
6. Recommend the smallest fix and list residual uncertainty.`),

  skill('unified-review', 'Run one focused pre-ship review across correctness, tests, maintainability, UI, and change impact.', `# Unified Review

Use after implementation and before commit, merge, or release.

1. Review the diff against the requested behavior and existing contracts.
2. Resolve @karpathy-guidelines, @clean-code-guard, and @test-guard.
3. Resolve @frontend-design-guard when user-facing UI changed.
4. Inspect callers and dependents for unintended blast radius.
5. Run the narrowest relevant checks, then the project quality gate.
6. Report findings by severity with file evidence. If none, state remaining test gaps.`),

  skill('security-review', 'Perform a scoped OWASP and STRIDE review with evidence and actionable findings.', `# Security Review

Use for authentication, authorization, secrets, user input, network boundaries, or pre-release audits.

1. Map assets, trust boundaries, actors, and entry points.
2. Check spoofing, tampering, repudiation, disclosure, denial of service, and privilege escalation.
3. Check relevant OWASP risks: access control, injection, cryptography, configuration, dependencies, and logging.
4. Verify each finding against code or runtime evidence; do not report generic possibilities as vulnerabilities.
5. Rank findings by impact and exploitability, and give a minimal remediation plus verification step.
6. Never expose secrets or sensitive values in the report.`),

  skill('release-readiness', 'Verify a change is documented, tested, reversible, and ready to hand off for release.', `# Release Readiness

Use when the user asks to ship, package, or prepare a release. Do not push, merge, or deploy without explicit authorization.

1. Confirm scope, versioning impact, and user-visible behavior.
2. Run compile, tests, packaging, and project-specific checks that apply.
3. Confirm migrations, configuration, docs, changelog, rollback, and monitoring needs.
4. Verify no secrets, generated junk, or unrelated changes are included.
5. Summarize evidence, known risks, and exact manual steps still required.
6. Return READY, READY_WITH_CONCERNS, or NOT_READY.`),
];

export async function deployEngineeringWorkflowLocal(root: string): Promise<string[]> {
  const written: string[] = [];
  for (const workflowSkill of ENGINEERING_WORKFLOW_SKILLS) {
    const file = path.join(root, '.brain', 'skills', `${workflowSkill.id}.md`);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, renderEngineeringWorkflowSkill(workflowSkill), 'utf8');
    written.push(file);
  }
  return written;
}

export async function removeEngineeringWorkflowLocal(root: string): Promise<void> {
  await Promise.all(ENGINEERING_WORKFLOW_SKILLS.map(workflowSkill =>
    fs.rm(path.join(root, '.brain', 'skills', `${workflowSkill.id}.md`), { force: true })
  ));
}

export function renderEngineeringWorkflowSkill(workflowSkill: EngineeringWorkflowSkill): string {
  return [
    '---',
    `name: ${workflowSkill.id}`,
    `description: ${workflowSkill.description}`,
    'license: MIT',
    '---',
    '',
    workflowSkill.body,
    '',
    'Methodology adapted for INI Brain from garrytan/gstack (MIT).',
    '',
  ].join('\n');
}

function skill(id: string, description: string, body: string): EngineeringWorkflowSkill {
  return { id, description, body };
}

