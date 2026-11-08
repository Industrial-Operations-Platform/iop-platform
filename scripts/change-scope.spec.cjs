const fs = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { execFileSync } = require('node:child_process');
const { classify, changedFiles, workflowScope, main } = require('./ci/change-scope.cjs');

test.each([
  [['docs/development/railway.md', 'README.md', 'AGENTS.md', 'docs/product/images/view.png'], false, false],
  [['apps/web/README.md', 'LICENSE'], false, false],
  [['apps/api/test/login.spec.ts', 'scripts/change-scope.spec.cjs'], true, false],
  [['.github/workflows/validation.yml', 'scripts/ci/change-scope.cjs'], true, false],
  [['scripts/access/rename-usernames.cjs'], true, false],
  [['apps/web/src/features/shift-handover/adapters/react/handover.css'], true, true],
  [['apps/api/src/host/main.ts', 'docs/product/guide.md'], true, true],
  [['apps/web/src/feature.test.tsx'], true, false],
  [['apps/web/public/assets/icon.svg'], true, true],
  [['package-lock.json', 'apps/api/tsconfig.build.json'], true, true],
  [['infra/database/migrations/20261108000000-example.sql'], true, true],
  [['infra/database/test/example.spec.cjs'], true, false],
  [['infra/railway/Dockerfile', '.railway/railway.ts'], true, true],
  [['scripts/railway/deploy.cjs', '.dockerignore'], true, true],
  [[], false, false],
])('file changes %j select validation=%s, runtime=%s', (files, validate, runtime) => {
  expect(classify(files)).toEqual({ validate, runtime });
});

let directory;
const git = args => execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function commit(file, content, message) {
  fs.mkdirSync(join(directory, file, '..'), { recursive: true });
  fs.writeFileSync(join(directory, file), content);
  git(['add', '--all']);
  git(['-c', 'user.name=Scope test', '-c', 'user.email=scope@example.invalid', 'commit', '--quiet', '-m', message]);
  return git(['rev-parse', 'HEAD']);
}
beforeEach(() => {
  directory = fs.mkdtempSync(join(tmpdir(), 'iop-change-scope-'));
  git(['init', '--quiet', '--initial-branch=develop']);
});
afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
  jest.restoreAllMocks();
});

test('the complete push includes runtime changes even when its final commit changes documentation', () => {
  const before = commit('README.md', 'Initial', 'docs: initial');
  commit('apps/web/src/example.ts', 'export const value = 1;', 'fix: application change');
  const after = commit('docs/guide.md', 'Guide', 'docs: record validation');
  expect(workflowScope('push', { before, after }, directory)).toEqual({ validate: true, runtime: true });
  expect(changedFiles('push', { before, after }, directory)).toEqual(['apps/web/src/example.ts', 'docs/guide.md']);
});

test('feature or fix wording alone never deploys documentation; messages never suppress changed code', () => {
  const before = commit('README.md', 'Initial', 'docs: initial');
  const after = commit('README.md', 'Updated', 'feat: update guide');
  expect(workflowScope('push', { before, after }, directory)).toEqual({ validate: false, runtime: false });
  const code = commit('apps/api/src/example.ts', 'export {};', 'chore: internal update');
  expect(workflowScope('push', { before: after, after: code }, directory)).toEqual({ validate: true, runtime: true });
});

test('a runtime deletion or rename into documentation still needs deployment', () => {
  const before = commit('apps/api/src/previous.ts', 'export {};', 'feat: initial');
  fs.mkdirSync(join(directory, 'docs'));
  fs.renameSync(join(directory, 'apps/api/src/previous.ts'), join(directory, 'docs/previous.md'));
  const after = commit('README.md', 'Guide', 'refactor: remove obsolete runtime source');
  expect(changedFiles('push', { before, after }, directory)).toContain('apps/api/src/previous.ts');
  expect(workflowScope('push', { before, after }, directory).runtime).toBe(true);
});

test('pull requests compare from their merge base and do not include later base-branch work', () => {
  const base = commit('README.md', 'Initial', 'docs: initial');
  git(['checkout', '--quiet', '-b', 'docs/example']);
  const head = commit('docs/guide.md', 'Guide', 'docs: guide');
  git(['checkout', '--quiet', 'develop']);
  const advanced = commit('apps/api/src/example.ts', 'export {};', 'fix: unrelated base change');
  expect(base).not.toBe(advanced);
  expect(workflowScope('pull_request', { pull_request: { base: { sha: advanced }, head: { sha: head } } }, directory))
    .toEqual({ validate: false, runtime: false });
});

test('new branches inspect their complete tree and deleted refs do not run application jobs', () => {
  const after = commit('apps/web/src/example.ts', 'export {};', 'feat: initial');
  expect(workflowScope('push', { before: '0'.repeat(40), after }, directory)).toEqual({ validate: true, runtime: true });
  expect(workflowScope('push', { deleted: true }, directory)).toEqual({ validate: false, runtime: false });
});

test('manual validation remains available and invalid or unavailable revisions fail closed', () => {
  expect(workflowScope('workflow_dispatch', {}, directory)).toEqual({ validate: true, runtime: false });
  expect(() => changedFiles('push', { before: '--all', after: 'a'.repeat(40) }, directory)).toThrow('exact Git revisions');
  expect(() => changedFiles('push', { before: 'b'.repeat(40), after: 'a'.repeat(40) }, directory)).toThrow();
  expect(() => changedFiles('unknown', {}, directory)).toThrow('Unsupported workflow event');
});

test('GitHub outputs are booleans and filenames with spaces are read intact', () => {
  const before = commit('README.md', 'Initial', 'docs: initial');
  const after = commit('apps/web/src/with spaces.ts', 'export {};', 'feat: spaced name');
  const eventFile = join(directory, 'event.json'), output = join(directory, 'output');
  fs.writeFileSync(eventFile, JSON.stringify({ before, after }));
  jest.spyOn(process, 'cwd').mockReturnValue(directory);
  jest.spyOn(console, 'log').mockImplementation(() => {});
  main({ GITHUB_EVENT_NAME: 'push', GITHUB_EVENT_PATH: eventFile, GITHUB_OUTPUT: output });
  expect(fs.readFileSync(output, 'utf8')).toBe('validate=true\nruntime=true\n');
  expect(changedFiles('push', { before, after }, directory)).toContain('apps/web/src/with spaces.ts');
});
