const { execFileSync } = require('node:child_process');
const { readFileSync, appendFileSync } = require('node:fs');

function documentation(file) {
  return /^(?:docs|output)\//.test(file) || /\.(?:md|mdx|rst)$/i.test(file) ||
    /^(?:LICENSE|NOTICE)(?:\.[^/]*)?$/.test(file);
}

// Match shipped sources, build inputs and delivery configuration. Tests still
// validate, but changing only tests or CI does not replace a running application.
function runtimeInput(file) {
  if (documentation(file) || /(?:^|\/)(?:test|tests|e2e|__tests__|fixtures)\//.test(file) ||
      /\.(?:spec|test)\.[^/]+$/.test(file)) return false;
  return /^(?:package(?:-lock)?\.json|\.dockerignore|\.railwayignore|\.railway\/railway\.ts)$/.test(file) ||
    /^apps\/(?:api|web)\/(?:src|public)\//.test(file) ||
    /^apps\/(?:api|web)\/(?:package\.json|tsconfig(?:\.[\w-]+)?\.json|vite\.config\.ts|index\.html)$/.test(file) ||
    /^infra\/database\/(?:[^/]+\.ts|tsconfig\.json|migrations\/[^/]+\.sql)$/.test(file) ||
    /^infra\/railway\//.test(file) || /^scripts\/railway\//.test(file) ||
    /^scripts\/(?:check-secrets\.cjs|local\/(?:initialize|bootstrap-access|locator-private-copy)\.cjs)$/.test(file);
}

function classify(files) {
  return {
    validate: files.some(file => !documentation(file)),
    runtime: files.some(runtimeInput),
  };
}

function changedFiles(eventName, event, cwd = process.cwd()) {
  const git = args => execFileSync('git', args, {
    cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trimEnd();
  const revision = value => {
    if (typeof value !== 'string' || !/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(value))
      throw new Error('The GitHub event must identify exact Git revisions.');
    return value;
  };
  if (eventName === 'workflow_dispatch' || event.deleted) return [];
  let before, after;
  if (eventName === 'pull_request') {
    after = revision(event.pull_request?.head?.sha);
    before = git(['merge-base', revision(event.pull_request?.base?.sha), after]);
  } else if (eventName === 'push') {
    before = revision(event.before);
    after = revision(event.after);
  } else {
    throw new Error('Unsupported workflow event; deployment scope was not inferred.');
  }
  const output = /^0+$/.test(before)
    ? git(['ls-tree', '-r', '--name-only', '-z', after])
    : git(['diff', '--name-only', '--no-renames', '-z', before, after, '--']);
  return output.split('\0').filter(Boolean);
}

function workflowScope(eventName, event, cwd) {
  if (eventName === 'workflow_dispatch') return { validate: true, runtime: false };
  return classify(changedFiles(eventName, event, cwd));
}

function main(env = process.env) {
  const event = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8'));
  const scope = workflowScope(env.GITHUB_EVENT_NAME, event);
  appendFileSync(env.GITHUB_OUTPUT, `validate=${scope.validate}\nruntime=${scope.runtime}\n`);
  console.log(`Full validation: ${scope.validate}; application inputs changed: ${scope.runtime}.`);
}

if (require.main === module) {
  try { main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { classify, runtimeInput, changedFiles, workflowScope, main };
