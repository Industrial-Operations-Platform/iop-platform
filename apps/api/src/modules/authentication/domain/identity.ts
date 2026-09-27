export class AuthenticationError extends Error {
  constructor(
    readonly code:
      | "invalid_credentials"
      | "session_required"
      | "password_change_required"
      | "invalid_password"
      | "login_throttled",
  ) {
    super(code);
  }
}
export interface VerifiedPrincipal {
  userId: string;
  mustChangePassword: boolean;
}
export function username(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/.test(value)
  )
    throw new AuthenticationError("invalid_credentials");
  return value.toLowerCase();
}
export function password(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length < 15 ||
    value.length > 128 ||
    /[\u0000-\u001f]/.test(value)
  )
    throw new AuthenticationError("invalid_password");
  return value;
}
