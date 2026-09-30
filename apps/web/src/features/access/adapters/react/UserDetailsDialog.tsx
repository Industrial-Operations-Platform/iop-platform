import { useState } from "react";
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
import {
  profileLabels,
  type Profile,
  type UserDetails,
  type UserProfile,
} from "../../domain/access";

export function UserDetailsDialog({
  user,
  save,
  close,
}: {
  user: UserProfile;
  save: (details: UserDetails) => Promise<void>;
  close: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [profile, setProfile] = useState(user.profile);
  const [active, setActive] = useState(user.active);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const changed =
    name.trim() !== user.name ||
    profile !== user.profile ||
    active !== user.active;
  return (
    <Dialog title={t("User details")} onClose={close} busy={pending}>
      <form
        className="access-details-form"
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          setError("");
          void save({ id: user.id, name: name.trim(), profile, active })
            .then(close)
            .catch((reason) => setError(reason.message))
            .finally(() => setPending(false));
        }}
      >
        {error && <Alert>{error}</Alert>}
        <dl className="iop-detail-fields access-account-facts">
          <div>
            <dt>{t("Username")}</dt>
            <dd>{user.username}</dd>
          </div>
          <div>
            <dt>{t("User ID")}</dt>
            <dd>{user.id}</dd>
          </div>
        </dl>
        <Field>
          {t("Name")}
          <Input
            required
            maxLength={100}
            autoComplete="off"
            value={name}
            disabled={pending}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <div className="access-details-grid">
          <Field>
            {t("Profile")}
            <Select
              value={profile}
              disabled={pending}
              onChange={(e) => setProfile(e.target.value as Profile)}
            >
              {Object.entries(profileLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            {t("Access")}
            <Select
              value={active ? "active" : "disabled"}
              disabled={pending}
              onChange={(e) => setActive(e.target.value === "active")}
            >
              <option value="active">{t("Active")}</option>
              <option value="disabled">{t("Disabled")}</option>
            </Select>
          </Field>
        </div>
        <Actions className="iop-form-actions">
          <Button variant="secondary" disabled={pending} onClick={close}>
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={pending || !name.trim() || !changed}>
            {t(pending ? "Saving…" : "Save changes")}
          </Button>
        </Actions>
      </form>
    </Dialog>
  );
}
