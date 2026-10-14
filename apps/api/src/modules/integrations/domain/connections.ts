export const integrationKinds = ["wincc", "ultimo", "entra"] as const;
export type IntegrationKind = (typeof integrationKinds)[number];
export interface ConnectionConfiguration {
  kind: IntegrationKind;
  label: string;
  enabled: boolean;
  endpoint: string;
  contractVersion: string;
  credentialReference: string;
  tenantId: string;
  clientId: string;
}
export interface Connection {
  configuration: ConnectionConfiguration;
  revision: number;
  updatedAt: string;
  updatedBy: string;
}
export interface ConnectionReadiness extends Connection {
  status: "disabled" | "configuration-pending" | "transport-pending";
  adapter: "contract-ready";
  missingInputs: string[];
  lastSuccessfulConnection: null;
}
export class ConnectionError extends Error {
  constructor(readonly code: "invalid_integration" | "integration_denied" | "integration_conflict" | "integration_unconfigured") { super(code); }
}
export function connectionText(value: unknown, max: number): string {
  if (typeof value !== "string" || value.length > max || /[\u0000-\u001f\u007f]/.test(value))
    throw new ConnectionError("invalid_integration");
  return value.trim();
}
export function configuration(value: unknown): ConnectionConfiguration {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ConnectionError("invalid_integration");
  const input = value as Record<string, unknown>;
  const keys = ["kind", "label", "enabled", "endpoint", "contractVersion", "credentialReference", "tenantId", "clientId"];
  if (Object.keys(input).length !== keys.length || Object.keys(input).some(key => !keys.includes(key)) ||
      !integrationKinds.includes(input.kind as IntegrationKind) || typeof input.enabled !== "boolean")
    throw new ConnectionError("invalid_integration");
  const label = connectionText(input.label, 100), endpoint = connectionText(input.endpoint, 500);
  if (!label) throw new ConnectionError("invalid_integration");
  if (endpoint) {
    try {
      const url = new URL(endpoint);
      if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash)
        throw new Error();
    } catch { throw new ConnectionError("invalid_integration"); }
  }
  const credentialReference = connectionText(input.credentialReference, 100);
  if (credentialReference && !/^[A-Za-z][A-Za-z0-9_.-]{0,99}$/.test(credentialReference))
    throw new ConnectionError("invalid_integration");
  return {kind: input.kind as IntegrationKind, label, enabled: input.enabled, endpoint,
    contractVersion: connectionText(input.contractVersion, 100), credentialReference,
    tenantId: connectionText(input.tenantId, 100), clientId: connectionText(input.clientId, 100)};
}
export function emptyConnection(kind: IntegrationKind): Connection {
  return {configuration: {kind, label: kind === "wincc" ? "WinCC" : kind === "ultimo" ? "Ultimo" : "Microsoft Entra",
    enabled: false, endpoint: "", contractVersion: "", credentialReference: "", tenantId: "", clientId: ""},
    revision: 0, updatedAt: "", updatedBy: ""};
}
export function readiness(connection: Connection): ConnectionReadiness {
  const config = connection.configuration;
  const missingInputs: string[] = [];
  if (!config.endpoint) missingInputs.push("Authorized provider endpoint");
  if (!config.contractVersion) missingInputs.push("Reviewed source contract/version");
  if (!config.credentialReference) missingInputs.push("Private credential binding");
  if (config.kind === "entra") {
    if (!config.tenantId) missingInputs.push("Tenant and approved issuer policy");
    if (!config.clientId) missingInputs.push("Application registration and audience policy");
    missingInputs.push("Approved platform principal mapping");
  }
  missingInputs.push("Provider transport implementation", "Authorized real compatibility verification");
  return {...connection, status: !config.enabled ? "disabled" : missingInputs.length > 2 ? "configuration-pending" : "transport-pending",
    adapter: "contract-ready", missingInputs, lastSuccessfulConnection: null};
}
