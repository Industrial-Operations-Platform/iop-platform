export function readPort(value: string | undefined): number {
  if (value === undefined) return 3000;
  if (!/^[0-9]+$/.test(value)) throw new Error("Invalid PORT");
  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error("Invalid PORT");
  }
  return port;
}

export function readHost(value: string | undefined): string {
  if (value === undefined) return "127.0.0.1";
  if (value !== "127.0.0.1" && value !== "0.0.0.0")
    throw new Error("Invalid HOST");
  return value;
}
