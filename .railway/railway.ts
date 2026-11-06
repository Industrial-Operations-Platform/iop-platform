import { defineRailway, image, project, service, volume } from "railway/iac";

export default defineRailway((ctx) => {
  const region = "europe-west4-drams3a";
  // Match existing placement exactly; changing a volume's region could move persisted data.
  const references = volume("iop-data", { region: "europe-west4", sizeMB: 5000 });
  const postgresData = volume("iop-database", { region, sizeMB: 5000 });
  const iop = service("iop", {
    configFile: "",
    build: { builder: "DOCKERFILE", dockerfilePath: "infra/railway/Dockerfile" },
    start: "/usr/local/bin/iop-entrypoint node scripts/railway/start.cjs",
    preDeploy: "node scripts/railway/prepare.cjs",
    healthcheck: "/health",
    healthcheckTimeout: 300,
    replicas: { [region]: 1 },
    deploy: {
      preDeployTimeoutSeconds: 300,
      restartPolicyMaxRetries: 5,
      limitOverride: { containers: { cpu: 0.5, memoryBytes: 768 * 1024 * 1024 } },
    },
    volumeMounts: { "/data": references },
  });
  const database = service("database", {
    configFile: "",
    source: image("postgres:17.6-bookworm"),
    replicas: { [region]: 1 },
    deploy: {
      restartPolicyMaxRetries: 5,
      limitOverride: { containers: { cpu: 0.5, memoryBytes: 512 * 1024 * 1024 } },
    },
    volumeMounts: { "/var/lib/postgresql/data": postgresData },
  });

  return project(ctx.projectName ?? "IOP-evaluation", {
    variables: { managed: false },
    resources: [iop, database, references, postgresData],
  });
});
