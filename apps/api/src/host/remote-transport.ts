import { ConfigurationError } from "./configuration";

/** Railway's edge terminates TLS; public origins remain an exact operator allowlist. */
export function remoteOrigin(value: string): string {
  const url = new URL(value);
  if (url.origin !== value || url.protocol !== "https:" || url.port ||
      !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(url.hostname) ||
      url.hostname.endsWith(".internal") || url.hostname === "localhost") {
    throw new ConfigurationError("public HTTPS origin");
  }
  return value;
}

export function railwayDatabaseHost(value: string | undefined): boolean {
  return typeof value === "string" && /^[a-z][a-z0-9-]{0,62}\.railway\.internal$/.test(value);
}

export function sessionCookie(token: string, secure: boolean, maxAge = 28800): string {
  return `iop_session=${token}; HttpOnly; SameSite=Strict; Path=/api/v1; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}
