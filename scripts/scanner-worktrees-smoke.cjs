const assert = require('node:assert/strict'); const fs = require('node:fs'); const path = require('node:path');
const { ProjectScanner } = require('../dist/core/projectScanner');
const root = fs.mkdtempSync(path.join(path.resolve(__dirname, '..'), '.scanner-worktrees-'));
(async () => {
  for (const file of ['src/main.ts', '.kilo/skills/keep.md', '.kilo/worktrees/duplicate/src/main.ts', '.claude/worktrees/duplicate/main.ts', 'worktrees/ordinary/main.ts']) { const full=path.join(root,file);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,'export const value = 1;'); }
  const { files } = await new ProjectScanner(root).scan();
  assert(!files['.kilo/worktrees/duplicate/src/main.ts'], 'nested Kilo checkout must not be indexed');
  assert(!files['.claude/worktrees/duplicate/main.ts']);
  assert(files['.kilo/skills/keep.md']); assert(files['worktrees/ordinary/main.ts']); assert(files['src/main.ts']);
  console.log('OK scanner nested worktree exclusions');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>fs.rmSync(root,{recursive:true,force:true}));
