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
