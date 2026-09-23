import { spawn, ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { createServer, Server } from 'node:net';
import { join } from 'node:path';

async function reservePort(): Promise<{ server: Server; port: number }> {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected TCP address');
  return { server, port: address.port };
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

function launch(port: string, host = '127.0.0.1', config = join(__dirname, '../../../config/poc.example.json')) {
  const child = spawn(process.execPath, [join(__dirname, '../dist/main.js')], {
    env: { ...process.env, PORT: port, HOST: host, IOP_TRANSPORT: 'native', IOP_CONFIG_FILE: config }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', data => { output += data.toString(); });
  child.stderr.on('data', data => { output += data.toString(); });
  const exited = once(child, 'exit');
  const deadline = setTimeout(() => child.kill('SIGKILL'), 10000);
  child.once('exit', () => clearTimeout(deadline));
  return { child, exited, output: () => output };
}

async function stop(child: ChildProcess): Promise<void> {
  if (child.exitCode === null && child.signalCode === null) {
    const exited = once(child, 'exit');
    child.kill('SIGTERM');
    await exited;
  }
}

describe('compiled entrypoint', () => {
  it('starts on loopback, responds over TCP and shuts down', async () => {
    const reserved = await reservePort();
    await close(reserved.server);
    const process = launch(String(reserved.port));
    try {
      await Promise.race([
        once(process.child.stdout, 'data'),
        process.exited.then(() => { throw new Error(`Startup failed: ${process.output()}`); }),
      ]);
      expect(process.output()).toContain(`http://127.0.0.1:${reserved.port}`);
      const response = await fetch(`http://127.0.0.1:${reserved.port}/health`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ status: 'ok' });
      await stop(process.child);
      expect(process.child.signalCode).toBe('SIGTERM');
      const reusable = createServer().listen(reserved.port, '127.0.0.1');
      await once(reusable, 'listening');
      await close(reusable);
    } finally { await stop(process.child); }
  });

  it('rejects an invalid listen address without exposing it', async () => {
    const process = launch('3000', 'private-secret');
    const [code] = await process.exited;
    expect(code).toBe(1);
    expect(process.output()).toBe('Invalid configuration: HOST.\n');
  });

  it('fails safely before listening when configuration is invalid', async () => {
    const process = launch('private-secret');
    const [code] = await process.exited;
    expect(code).toBe(1);
    expect(process.output()).toBe('Invalid configuration: PORT.\n');
  });

  it('rejects a missing configuration file without exposing its path', async () => {
    const process = launch('3000', '127.0.0.1', '/private-secret/missing.json');
    const [code] = await process.exited;
    expect(code).toBe(1);
    expect(process.output()).toBe('Invalid configuration: IOP_CONFIG_FILE (readable UTF-8 JSON, maximum 16384 bytes).\n');
  });

  it('fails safely when the configured port is occupied', async () => {
    const reserved = await reservePort();
    const process = launch(String(reserved.port));
    try {
      const [code] = await process.exited;
      expect(code).toBe(1);
      expect(process.output()).toBe('API startup failed. Check local port availability.\n');
    } finally {
      await stop(process.child);
      await close(reserved.server);
    }
  });
});
