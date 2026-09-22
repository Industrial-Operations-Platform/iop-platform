import { createApplication, readPort } from './application';

async function bootstrap(): Promise<void> {
  const port = readPort(process.env.PORT);
  const app = await createApplication();
  app.enableShutdownHooks();
  try {
    await app.listen(port, '127.0.0.1');
    console.info(`API listening on http://127.0.0.1:${port}`);
  } catch (error) {
    await app.close();
    throw error;
  }
}

void bootstrap().catch(() => {
  console.error('API startup failed. Check PORT and local port availability.');
  process.exitCode = 1;
});
