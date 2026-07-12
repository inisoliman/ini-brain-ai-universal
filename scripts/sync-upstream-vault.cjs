const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'resources', 'upstreams', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
let changed = false;

(async () => {
  for (const source of manifest.sources || []) {
    if (source.snapshotPolicy !== 'curated') continue;
    const commit = await fetchJson(`https://api.github.com/repos/${source.repository}/commits/${source.branch}`)
      .catch(error => {
        console.warn(`Warning: keeping existing snapshot for ${source.id}: ${error.message}`);
        return null;
      });
    const revision = commit?.sha || source.pinnedCommit || source.branch;
    const snapshots = [];
    let complete = true;
    for (const file of source.files || []) {
      const url = `https://raw.githubusercontent.com/${source.repository}/${revision}/${file.path}`;
      const content = await fetchText(url).catch(error => {
        console.warn(`Warning: keeping existing snapshot for ${source.id}/${file.path}: ${error.message}`);
        return null;
      });
      if (content === null) {
        complete = false;
        continue;
      }
      snapshots.push({ file, content });
    }
    if (!complete) continue;

    for (const { file, content } of snapshots) {
      const target = path.join(root, source.snapshotRoot, file.path);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      const existing = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : undefined;
      if (existing !== content) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content, 'utf8');
        changed = true;
      }
      if (file.sha256 !== hash) {
        file.sha256 = hash;
        changed = true;
      }
    }
    if (commit?.sha && source.pinnedCommit !== commit.sha) {
      source.pinnedCommit = commit.sha;
      changed = true;
    }
  }

  if (changed) {
    manifest.updatedAt = new Date().toISOString();
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log('Upstream vault snapshots refreshed.');
  } else {
    console.log('Upstream vault is already current.');
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

function fetchJson(url) {
  return fetchText(url).then(JSON.parse);
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const token = process.env.GITHUB_TOKEN;
    https.get(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'ini-brain-ai-upstream-vault',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }, response => {
      if (response.statusCode >= 400) {
        response.resume();
        reject(new Error(`HTTP ${response.statusCode} ${url}`));
        return;
      }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => body += chunk);
      response.on('end', () => resolve(body));
    }).on('error', reject);
  });
}
