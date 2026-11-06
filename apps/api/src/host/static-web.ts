import { existsSync } from "node:fs";
import { resolve, isAbsolute } from "node:path";
import type { INestApplication } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import { ConfigurationError } from "./configuration";

/** Serve the built web app on the API origin; no second public service or CORS. */
export function configureStaticWeb(app: INestApplication, directory: string): void {
  if (!isAbsolute(directory) || !existsSync(resolve(directory, "index.html"))) {
    throw new ConfigurationError("built web directory");
  }
  const adapter = app.getHttpAdapter() as ExpressAdapter;
  adapter.useStaticAssets(directory, {
    dotfiles: "deny",
    index: "index.html",
    fallthrough: true,
    setHeaders: (res: import("node:http").ServerResponse, file: string) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Referrer-Policy", "same-origin");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("Cache-Control", /[/\\]assets[/\\]/.test(file)
        ? "public, max-age=31536000, immutable" : "no-cache");
    },
  });
}
