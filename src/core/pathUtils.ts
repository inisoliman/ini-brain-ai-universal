import * as path from 'path';

const ignoredSegments = new Set([
  '.git',
  '.brain',
  '.svn',
  '.hg',
  'node_modules',
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  '.nuxt',
  '.turbo',
  '.cache',
  '.venv',
  'venv',
  '__pycache__'
]);

const textExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.toml',
  '.xml',
  '.html',
  '.css',
  '.scss',
  '.less',
  '.py',
  '.rb',
  '.go',
  '.rs',
  '.java',
  '.kt',
  '.swift',
  '.php',
  '.cs',
  '.c',
  '.h',
  '.cpp',
  '.hpp',
  '.sh',
  '.ps1',
  '.sql',
  '.env.example'
]);

export function normalizePath(file: string): string {
  return file.split(path.sep).join('/');
}

export function isIgnoredSegment(segment: string): boolean {
  return ignoredSegments.has(segment);
}

export function isIgnoredPath(file: string): boolean {
  return normalizePath(file).split('/').some(isIgnoredSegment);
}

export function isTextLike(file: string): boolean {
  const base = path.basename(file).toLowerCase();
  if (base === 'dockerfile' || base === 'makefile' || base === 'license') return true;
  return textExtensions.has(path.extname(base));
}

export function detectLanguage(file: string): string {
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file).toLowerCase();
  if (base === 'dockerfile') return 'Dockerfile';
  if (base === 'makefile') return 'Makefile';
  switch (ext) {
    case '.ts': return 'TypeScript';
    case '.tsx': return 'TypeScript React';
    case '.js':
    case '.mjs':
    case '.cjs': return 'JavaScript';
    case '.jsx': return 'JavaScript React';
    case '.json': return 'JSON';
    case '.md': return 'Markdown';
    case '.yml':
    case '.yaml': return 'YAML';
    case '.py': return 'Python';
    case '.go': return 'Go';
    case '.rs': return 'Rust';
    case '.java': return 'Java';
    case '.kt': return 'Kotlin';
    case '.swift': return 'Swift';
    case '.php': return 'PHP';
    case '.cs': return 'C#';
    case '.html': return 'HTML';
    case '.css':
    case '.scss':
    case '.less': return 'CSS';
    case '.sql': return 'SQL';
    default: return ext ? ext.slice(1).toUpperCase() : 'Text';
  }
}

export function isProtectedProjectPath(relativePath: string): boolean {
  const normalized = normalizePath(relativePath);
  return normalized === '.git' ||
    normalized.startsWith('.git/') ||
    normalized === '.brain/backups' ||
    normalized.startsWith('.brain/backups/');
}

export function safeResolve(root: string, relativePath: string): string {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error(`Invalid relative path: ${relativePath}`);
  }
  if (isProtectedProjectPath(relativePath)) {
    throw new Error(`Refusing to write protected path: ${relativePath}`);
  }
  const target = path.resolve(root, relativePath);
  const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (target !== root && !target.startsWith(rootWithSep)) {
    throw new Error(`Refusing to access outside workspace: ${relativePath}`);
  }
  return target;
}
