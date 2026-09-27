import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { PlatformModule } from "./controller";
import { PlatformRuntime } from "./runtime";
import { ProblemDetailsFilter } from "./problem-details.filter";

export function configureApplication(app: INestApplication): void {
  const adapter = app.getHttpAdapter() as ExpressAdapter;
  adapter.useBodyParser("raw", false, {
    type: "application/octet-stream",
    limit: 5242880,
    inflate: false,
  });
  adapter.useBodyParser("json", false, { limit: 102400, inflate: false });
  adapter.useBodyParser("urlencoded", false, {
    limit: 102400,
    inflate: false,
    extended: true,
    parameterLimit: 10,
    depth: 1,
  });
  app.useGlobalFilters(new ProblemDetailsFilter(app.get(HttpAdapterHost)));
}

export async function createApplication(
  runtime: PlatformRuntime | null = null,
  port = 3000,
): Promise<INestApplication> {
  const app = await NestFactory.create(
    { module: AppModule, imports: [PlatformModule.register(runtime)] },
    { logger: false, abortOnError: false, bodyParser: false },
  );
  app.use(
    "/api/v1",
    (
      req: import("node:http").IncomingMessage,
      res: import("node:http").ServerResponse,
      next: (error?: unknown) => void,
    ) => {
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      try {
        if (runtime) {
          runtime.protect(req, port);
          if (req.method === "POST" && req.url?.split("?")[0] === "/imports") {
            runtime.principals.resolve(req);
            const release = runtime.reserveUpload();
            const timer = setTimeout(() => req.destroy(), 30000);
            const finish = () => {
              clearTimeout(timer);
              release();
            };
            res.once("finish", finish);
            res.once("close", finish);
          }
        }
        next();
      } catch (error) {
        next(error);
      }
    },
  );
  configureApplication(app);
  return app;
}

export { readHost, readPort } from "./host-address";
