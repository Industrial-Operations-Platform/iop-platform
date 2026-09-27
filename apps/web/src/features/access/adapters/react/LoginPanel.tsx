import { useState } from "react";
import {
  Alert,
  Button,
  Field,
  Input,
  Panel,
} from "../../../../design/components";
import type { AccessApplication } from "../../application/access";
import type { SessionContext } from "../../domain/access";
export function LoginPanel({
  application,
  changeRequired,
  onSession,
}: {
  application: AccessApplication;
  changeRequired: boolean;
  onSession: (context: SessionContext) => void;
}) {
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [current, setCurrent] = useState(""),
    [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  return (
    <Panel className="access-login">
      <h1>{changeRequired ? "Choose your own password" : "Sign in to IOP"}</h1>
      <p>
        {changeRequired
          ? "Replace the initial password before opening your workspace. Sign in again after the change."
          : "Use the individual account created by your administrator."}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          setError("");
          const work = changeRequired
            ? application.changePassword(current, password, confirmation)
            : application.login(username, password);
          void work
            .then((context) => {
              setPassword("");
              setCurrent("");
              setConfirmation("");
              onSession(context);
            })
            .catch((reason) =>
              setError(
                reason instanceof Error ? reason.message : "Sign-in failed.",
              ),
            )
            .finally(() => setPending(false));
        }}
      >
        {!changeRequired && (
          <Field>
            Username
            <Input
              autoComplete="username"
              required
              value={username}
              maxLength={64}
              onChange={(e) => setUsername(e.target.value)}
              disabled={pending}
            />
          </Field>
        )}
        {changeRequired && (
          <Field>
            Current initial password
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              disabled={pending}
            />
          </Field>
        )}
        <Field>
          {changeRequired ? "New password" : "Password"}
          <Input
            type="password"
            autoComplete={changeRequired ? "new-password" : "current-password"}
            minLength={changeRequired ? 15 : undefined}
            maxLength={128}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
          />
        </Field>
        {changeRequired && (
          <Field>
            Confirm new password
            <Input
              type="password"
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={pending}
            />
          </Field>
        )}
        {error && <Alert>{error}</Alert>}
        <Button type="submit" disabled={pending}>
          {pending
            ? "Please wait…"
            : changeRequired
              ? "Change password"
              : "Sign in"}
        </Button>
      </form>
    </Panel>
  );
}
