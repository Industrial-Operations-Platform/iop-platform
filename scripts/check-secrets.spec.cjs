const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { inspect, check } = require('./check-secrets.cjs');

const secret = ['synthetic', 'sensitive', 'value'].join('-');
const url = ['postgresql:', '//user:', secret, '@localhost/db'].join('');
const key = ['-----BEGIN ', 'PRIVATE KEY-----'].join('');
const publicName = ['VITE_', 'DATABASE_PASSWORD'].join('');
let cwd;
const git = (...args) => execFileSync('git', args, { cwd, stdio: 'pipe' });
beforeEach(() => { cwd = mkdtempSync(join(tmpdir(), 'iop-secret-check-')); git('init', '--quiet'); });
afterEach(() => rmSync(cwd, { recursive: true, force: true }));

test('clean examples pass; ignored files forced into the index fail', () => {
  writeFileSync(join(cwd, '.gitignore'), '.env\n');
  writeFileSync(join(cwd, '.env.example'), 'IOP_POSTGRES_PASSWORD=\n');
  writeFileSync(join(cwd, '.env'), `IOP_POSTGRES_PASSWORD=${secret}\n`);
  git('add', '.gitignore', '.env.example');
  expect(check(cwd).findings).toEqual([]);
  git('add', '-f', '.env');
  expect(check(cwd).findings).toEqual([{ path: '.env', rule: 'private-file' }]);
});

test('checks staged blobs even when worktree content is clean; never echoes content', () => {
  writeFileSync(join(cwd, 'settings.txt'), url);
  git('add', 'settings.txt');
  writeFileSync(join(cwd, 'settings.txt'), 'clean');
  const result = spawnSync(process.execPath, [resolve(__dirname, 'check-secrets.cjs')], { cwd, encoding: 'utf8' });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('credential-url');
  expect(result.stderr).not.toContain(secret);
  expect(result.stdout).toBe('');
});

test.each(['.env', 'apps/web/.env.production', 'config/demo.local.json', 'local.pem', 'id_ed25519'])('rejects private path %s', path => {
  expect(inspect(path, '')).toContain('private-file');
});

test('detects content outside private filenames and populated examples', () => {
  expect(inspect('ordinary.txt', key)).toContain('private-key');
  expect(inspect('.env.example', `IOP_RUNTIME_PASSWORD=${secret}`)).toContain('example-secret');
  expect(inspect('apps/web/src/config.ts', publicName)).toContain('public-secret-variable');
  expect(inspect('.env.test.example', 'TOKEN=""\nPASSWORD=\n')).toEqual([]);
  expect(inspect('compose.yaml', 'PASSWORD: ${IOP_POSTGRES_PASSWORD:?Required}')).toEqual([]);
});

test('fails closed with safe diagnostics outside a repository', () => {
  rmSync(join(cwd, '.git'), { recursive: true, force: true });
  const result = spawnSync(process.execPath, [resolve(__dirname, 'check-secrets.cjs')], { cwd, encoding: 'utf8' });
  expect(result.status).toBe(1);
  expect(result.stderr).toBe('Secret hygiene could not inspect the Git index. Check repository access and index state.\n');
});
