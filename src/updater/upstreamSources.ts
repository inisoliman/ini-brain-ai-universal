export interface UpstreamSource {
  id: string;
  owner: string;
  name: string;
  branch: string;
  files: string[];
  description: string;
  pinnedCommit?: string;
  license?: string;
  integrationType?: 'skill' | 'reference' | 'engine' | 'workflow';
  mirrorBaseUrl?: string;
  snapshotRoot?: string;
}

const PROJECT_MIRROR_BASE = 'https://raw.githubusercontent.com/inisoliman/ini-brain-ai-universal/main/resources/upstreams';

export const UPSTREAM_SOURCES: UpstreamSource[] = [
  source('ponytail', 'DietrichGebert', 'ponytail', 'main', 'Lazy senior dev (code -54%)', ['AGENTS.md'], 'skill'),
  source('caveman', 'JuliusBrussee', 'caveman', 'main', 'Telegraphic compression (output -70%)', ['AGENTS.md'], 'skill'),
  source('claude-token-efficient', 'drona23', 'claude-token-efficient', 'main', 'Claude lean rules', ['CLAUDE.md'], 'skill'),
  source('spec-kit', 'github', 'spec-kit', 'main', 'SDD templates', ['README.md'], 'workflow'),
  source('superpowers', 'obra', 'superpowers', 'main', 'Composable skills methodology', ['README.md'], 'workflow'),
  {
    ...source('gstack', 'garrytan', 'gstack', 'main', 'Engineering workflow methodology reference', ['LICENSE'], 'reference'),
    pinnedCommit: '7c9df1c568a9ea745508f679a329332b2c338063',
    license: 'MIT'
  },
  source('graphify', 'safishamsi', 'graphify', 'v8', 'Knowledge graph builder', ['README.md'], 'reference'),
  source('token-optimizer', 'alexgreensh', 'token-optimizer', 'main', 'Token measurement', ['README.md'], 'reference'),
  {
    ...source('codebase-memory-mcp', 'DeusData', 'codebase-memory-mcp', 'main', 'Advanced local code-intelligence engine', ['LICENSE', 'server.json'], 'engine'),
    pinnedCommit: 'e19a6994932f7004588dd571facf5aeac05d100a',
    license: 'MIT'
  },
  {
    ...source('delegate-skills', 'amElnagdy', 'delegate-skills', 'master', 'Safe delegation workflow references', ['LICENSE', 'skills/codex-delegate/SKILL.md'], 'workflow'),
    pinnedCommit: 'e36f68a22ba151936266a0073771251b15d698db',
    license: 'MIT'
  },
];

function source(
  id: string,
  owner: string,
  name: string,
  branch: string,
  description: string,
  files: string[],
  integrationType: UpstreamSource['integrationType']
): UpstreamSource {
  return {
    id,
    owner,
    name,
    branch,
    description,
    files,
    integrationType,
    mirrorBaseUrl: `${PROJECT_MIRROR_BASE}/${id}`,
    snapshotRoot: `resources/upstreams/${id}`
  };
}
