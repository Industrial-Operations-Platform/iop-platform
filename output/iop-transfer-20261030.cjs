const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const candidate = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'DockerDesktop', 'resources', 'bin', 'docker.exe');
const docker = fs.existsSync(candidate) ? candidate : 'docker';
const action = process.argv[2] || 'status';
const project = 'iop-transfer-20261030';
function run(args, capture = false) {
  const result = spawnSync(docker, args, { encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit', windowsHide: true, timeout: 120000 });
  if (result.error || result.status !== 0) throw Error('Docker no responde correctamente. Abre Docker Desktop y revisa el estado de los contenedores.');
  return result.stdout?.trim();
}
async function healthy(container) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const state = run(['inspect', '--format', '{{.State.Status}} {{.State.Health.Status}}', container], true);
    if (state === 'running healthy') return;
    if (/^(exited|dead)/.test(state)) throw Error(container + ' se ha detenido. Revisa sus logs en Docker Desktop.');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw Error(container + ' no esta disponible todavia. Revisa Docker Desktop.');
}
async function main() {
  if (!['start', 'stop', 'status'].includes(action)) throw Error('Uso: node output/iop-transfer-20261030.cjs [start|stop|status]');
  if (action === 'start') {
    for (const service of ['database', 'api', 'web']) {
      const container = `${project}-${service}-1`;
      run(['start', container]);
      await healthy(container);
    }
    console.log('IOP disponible en http://127.0.0.1:8080 con tus cuentas y contrasenas transferidas.');
  } else if (action === 'stop') {
    run(['stop', `${project}-web-1`, `${project}-api-1`, `${project}-database-1`]);
  }
  run(['ps', '-a', '--filter', `label=com.docker.compose.project=${project}`, '--format', 'table {{.Names}}\t{{.Status}}\t{{.Ports}}']);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
