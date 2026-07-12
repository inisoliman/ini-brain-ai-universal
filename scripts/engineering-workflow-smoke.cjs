const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  deployEngineeringWorkflowLocal,
  ENGINEERING_WORKFLOW_SKILLS,
  removeEngineeringWorkflowLocal,
} = require('../dist/methodology/engineeringWorkflow');

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ini-engineering-workflow-'));
  const written = await deployEngineeringWorkflowLocal(tmp);
  if (written.length !== 6) throw new Error(`expected 6 skills, got ${written.length}`);
  if (new Set(ENGINEERING_WORKFLOW_SKILLS.map(skill => skill.id)).size !== written.length) {
    throw new Error('workflow skill ids must be unique');
  }
  for (const file of written) {
    const body = fs.readFileSync(file, 'utf8');
    if (!body.startsWith('---\nname:')) throw new Error(`invalid skill frontmatter: ${file}`);
    if (body.length > 2200) throw new Error(`skill is too large for focused loading: ${file}`);
  }
  await removeEngineeringWorkflowLocal(tmp);
  if (written.some(file => fs.existsSync(file))) throw new Error('workflow removal left owned files behind');
  console.log('OK engineering workflow smoke');
})().catch(error => {
  console.error(error);
  process.exit(1);
});

