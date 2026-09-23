import { createApplication } from './application';
import { ConfigurationError, readStartupConfiguration } from './configuration';

async function bootstrap(): Promise<void> {
  const { host, port } = readStartupConfiguration(process.env);
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

void bootstrap().catch((error: unknown) => {
  console.error(error instanceof ConfigurationError
    ? error.message
    : 'API startup failed. Check local port availability.');
  process.exitCode = 1;
});
