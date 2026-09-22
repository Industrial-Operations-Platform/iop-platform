import { createApplication, readHost, readPort } from './application';

async function bootstrap(): Promise<void> {
  const port = readPort(process.env.PORT);
  const host = readHost(process.env.HOST);
  const app = await createApplication();
  app.enableShutdownHooks();
  try {
    await app.listen(port, host);
    console.info(`API listening on http://${host}:${port}`);
  } catch (error) {
    await app.close();
    throw error;
  }
}

void bootstrap().catch(() => {
  console.error('API startup failed. Check HOST, PORT and local port availability.');
  process.exitCode = 1;
});
