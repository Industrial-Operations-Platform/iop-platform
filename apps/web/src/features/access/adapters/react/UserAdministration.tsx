import { UserDetailsDialog } from "./UserDetailsDialog";
import { t } from "../../../../localization/i18n";
import { useEffect, useState } from "react";
import {
  Actions,
  Badge,
  DeleteButton,
  Alert,
  Button,
  Field,
  Input,
  PageHeading,
  Panel,
  Select,
  Table,
  TableViewport,
} from "../../../../design/components";
import type { AccessApplication } from "../../application/access";
import {
  profileLabels,
  type Profile,
  type UserProfile,
} from "../../domain/access";
export function UserAdministration({
  application,
  onChanged,
}: {
  application: AccessApplication;
  onChanged: () => Promise<void>;
}) {
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false),
    [refresh, setRefresh] = useState(0);
  const [name, setName] = useState(""),
    [username, setUsername] = useState(""),
    [profile, setProfile] = useState<Profile>("technician");
  const [issued, setIssued] = useState<{
    username: string;
    secret: string;
  } | null>(null);
  useEffect(() => {
    let active = true;
    setPending(true);
    setError("");
    void application
      .users()
      .then((value) => {
        if (active) setUsers(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setPending(false);
      });
    return () => {
      active = false;
    };
  }, [application, refresh]);
  async function change(user: UserProfile, next: Profile, active: boolean) {
    setPending(true);
    setError("");
    try {
      await application.change(user.id, next, active);
      await onChanged();
      setRefresh((n) => n + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The change failed.");
    } finally {
      setPending(false);
    }
  }
  const options = Object.entries(profileLabels).map(([value, label]) => (
    <option key={value} value={value}>
      {t(label)}
    </option>
  ));
  return (
    <div className="access-administration">
      {editingUser && (
        <UserDetailsDialog
          user={editingUser}
          close={() => setEditingUser(null)}
          save={async (details) => {
            await application.update(details);
            await onChanged();
            setRefresh((v) => v + 1);
          }}
        />
      )}
      <PageHeading
        title={t("Users & profiles")}
        description={t(
          "Create individual accounts and assign access to this local site.",
        )}
      />
      <Panel>
        <h2>{t("Available profiles")}</h2>
        <p>
          <strong>{t("Administrator:")}</strong>
          {t(
            " user administration, imports, workforce configuration, planning and analysis. ",
          )}
        </p>
        <p>
          <strong>{t("Technician · Task Force · Team Leader:")}</strong>
          {t(
            " technicians read their daily plan; Team Leaders plan assignments; Task Force reads operational and analytical data. ",
          )}
        </p>
      </Panel>
      {error && <Alert>{error}</Alert>}
      {issued && (
        <Panel aria-label={t("Initial credentials")}>
          <h2>
            {t("Account created: ")}
            {issued.username}
          </h2>
          <p>
            {t("Initial password: ")}
            <code>{issued.secret}</code>
          </p>
          <p>
            {t(
              "Give this password to the user securely. It is shown once and must be changed at first sign-in. ",
            )}
          </p>
          <Button variant="secondary" onClick={() => setIssued(null)}>
            {t("Dismiss initial password ")}
          </Button>
        </Panel>
      )}
      <Panel>
        <h2>{t("Create a user")}</h2>
        <form
          className="access-user-form"
          onSubmit={(event) => {
            event.preventDefault();
            setPending(true);
            setError("");
            setIssued(null);
            void application
              .create({ name, username, profile })
              .then((result) => {
                setIssued({
                  username: result.user.username,
                  secret: result.initialPassword,
                });
                setName("");
                setUsername("");
                setRefresh((n) => n + 1);
              })
              .catch((e) => setError(e.message))
              .finally(() => setPending(false));
          }}
        >
          <Field>
            {t("Name ")}
            <Input
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={pending}
            />
          </Field>
          <Field>
            {t("Username ")}
            <Input
              required
              minLength={3}
              maxLength={64}
              pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,63}"
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={pending}
            />
          </Field>
          <Field>
            {t("Profile ")}
            <Select
              aria-label={t("Profile")}
              value={profile}
              onChange={(e) => setProfile(e.target.value as Profile)}
              disabled={pending}
            >
              {options}
            </Select>
          </Field>
          <Button type="submit" disabled={pending}>
            {t("Create user ")}
          </Button>
        </form>
      </Panel>
      <Panel>
        <h2>{t("Users")}</h2>
        {pending && <p role="status">{t("Updating users…")}</p>}
        <TableViewport>
          <Table className="access-users">
            <caption>{t("Accounts for this site")}</caption>
            <colgroup>
              <col className="access-users-person" />
              <col className="access-users-profile" />
              <col className="access-users-status" />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">{t("User")}</th>
                <th scope="col">{t("Profile")}</th>
                <th scope="col">{t("Status")}</th>
                <th scope="col">{t("Access")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <th scope="row">
                    <Button
                      variant="text"
                      className="access-user-link"
                      onClick={() => setEditingUser(user)}
                      disabled={pending}
                      aria-label={t("User details for {0}", [user.username])}
                    >
                      {user.name}
                    </Button>
                    <br />
                    <small>{user.username}</small>
                  </th>
                  <td>{t(profileLabels[user.profile])}</td>
                  <td>
                    <Badge tone={user.active ? "success" : "neutral"}>
                      {user.active ? t("Active") : t("Disabled")}
                    </Badge>
                  </td>
                  <td>
                    <Actions className="access-row-actions">
                      <Button
                        variant="secondary"
                        aria-label={t(
                          user.active ? "Disable {0}" : "Enable {0}",
                          [user.username],
                        )}
                        disabled={pending}
                        onClick={() =>
                          void change(user, user.profile, !user.active)
                        }
                      >
                        {user.active ? t("Disable") : t("Enable")}
                      </Button>
                      <DeleteButton
                        label={t("Delete profile for {0}", [user.username])}
                        disabled={pending}
                        onClick={() => {
                          setPending(true);
                          setError("");
                          void application
                            .remove(user.id)
                            .then(async () => {
                              await onChanged();
                              setRefresh((n) => n + 1);
                            })
                            .catch((e) => setError(e.message))
                            .finally(() => setPending(false));
                        }}
                      />
                    </Actions>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableViewport>
      </Panel>
    </div>
  );
}
