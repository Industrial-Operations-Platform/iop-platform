import { useEffect, useId, useRef, useState } from "react";
import {
  Actions,
  Alert,
  Button,
  Dialog,
  Field,
  Input,
  Select,
} from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { AccessApplication } from "../../application/access";
import {
  profileLabels,
  type Profile,
  type UserProfile,
} from "../../domain/access";

export function CreateUserDialog({
  application,
  close,
  created,
}: {
  application: AccessApplication;
  close: () => void;
  created: (result: { user: UserProfile; initialPassword: string }) => void;
}) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState<Profile>("technician");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const usernameHint = useId();
  const nameInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    nameInput.current?.focus();
  }, []);
  return (
    <Dialog title={t("Create a user")} busy={pending} onClose={close}>
      <p>
        {t(
          "Enter the person's name, choose a username and assign a profile for this site.",
        )}
      </p>
      <form
        className="access-details-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (pending) return;
          setPending(true);
          setError("");
          try {
            created(await application.create({ name, username, profile }));
          } catch (reason) {
            setError(
              reason instanceof Error
                ? reason.message
                : "Could not create the user.",
            );
            setPending(false);
          }
        }}
      >
        {error && <Alert>{t(error)}</Alert>}
        <Field>
          {t("Name")}
          <Input
            ref={nameInput}
            required
            maxLength={100}
            autoComplete="off"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={pending}
          />
        </Field>
        <Field>
          {t("Username")}
          <Input
            required
            minLength={3}
            maxLength={64}
            pattern="[A-Za-z0-9][A-Za-z0-9._\-]{2,63}"
            autoComplete="off"
            aria-describedby={usernameHint}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={pending}
          />
        </Field>
        <p id={usernameHint} className="access-field-hint">
          {t(
            "Use 3–64 letters, numbers, dots, hyphens or underscores. Start with a letter or number.",
          )}
        </p>
        <Field>
          {t("Profile")}
          <Select
            value={profile}
            onChange={(event) => setProfile(event.target.value as Profile)}
            disabled={pending}
          >
            {Object.entries(profileLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {t(label)}
              </option>
            ))}
          </Select>
        </Field>
        <p className="access-field-hint">
          {t(
            "An initial password is generated after creation. The user changes it at first sign-in.",
          )}
        </p>
        <Actions className="iop-form-actions">
          <Button variant="secondary" disabled={pending} onClick={close}>
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {t(pending ? "Creating…" : "Create user")}
          </Button>
        </Actions>
      </form>
    </Dialog>
  );
}
