const path = require('node:path');
const { autoInstallMcpClients } = require('../dist/integrations/autoMcpInstaller');
const [serverScript, selection] = process.argv.slice(2);
if (!serverScript || selection === undefined) throw new Error('Expected server script and comma-separated client selection.');
autoInstallMcpClients({ serverScript: path.resolve(serverScript), clients: selection.split(',').filter(Boolean) }).then(results => {
  for (const result of results) console.log(`${result.client}: ${result.status}: ${result.message}`);
  if (results.some(result => result.status === 'error')) process.exitCode = 1;
}).catch(error => { console.error(error.message); process.exitCode = 1; });
