const { execFileSync } = require('node:child_process');
const { basename } = require('node:path');

function inspect(path, content) {
  const rules = new Set();
  const name = basename(path);
  const example = /^\.env(?:\..+)?\.example$/.test(name);
  if ((/^\.env(?:\.|$)/.test(name) && !example) ||
      /(?:^|\/)config\/[^/]+\.local\.json$/.test(path) ||
      /\.(?:pem|key|p12|pfx)$/i.test(name) || /^id_(?:rsa|dsa|ecdsa|ed25519)(?:$|\.)/.test(name)) {
    rules.add('private-file');
  }
  if (/-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/.test(content)) rules.add('private-key');
  if (/[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]+@/i.test(content)) rules.add('credential-url');
  for (const line of content.split(/\r?\n/)) {
    const assignment = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (assignment && example && /PASSWORD|SECRET|TOKEN|API_KEY|PRIVATE_KEY/i.test(assignment[1]) &&
        !['', '""', "''"].includes(assignment[2])) rules.add('example-secret');
  }
  if (/\bVITE_[A-Z0-9_]*(?:PASSWORD|SECRET|TOKEN|API_KEY|PRIVATE_KEY)[A-Z0-9_]*\b/.test(content)) {
    rules.add('public-secret-variable');
  }
  return [...rules];
}

function check(cwd) {
  const git = args => execFileSync('git', args, {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
  });
  const entries = git(['ls-files', '--stage', '-z']).split('\0').filter(Boolean);
  const findings = [];
  for (const entry of entries) {
    const match = entry.match(/^(\d+) ([a-f0-9]+) (\d)\t([\s\S]+)$/);
    if (!match || match[3] !== '0' || !['100644', '100755', '120000'].includes(match[1])) {
      throw new Error('Unsupported index entry');
    }
    const path = match[4];
    const content = git(['cat-file', 'blob', match[2]]);
    for (const rule of inspect(path, content)) findings.push({ path, rule });
  }
  return { files: entries.length, findings };
}

function main() {
  try {
    const result = check(process.cwd());
    for (const finding of result.findings) {
      console.error(`${JSON.stringify(finding.path)}: ${finding.rule}`);
    }
    if (result.findings.length) {
      console.error('Secret hygiene failed. Review the listed staged files privately.');
      process.exitCode = 1;
    } else console.log(`Secret hygiene passed for ${result.files} indexed files (bounded rules; review still required).`);
  } catch {
    console.error('Secret hygiene could not inspect the Git index. Check repository access and index state.');
    process.exitCode = 1;
  }
}

module.exports = { inspect, check };
if (require.main === module) main();
