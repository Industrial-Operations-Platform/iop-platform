import { UserDetailsDialog } from "./UserDetailsDialog";
import { locale, t } from "../../../../localization/i18n";
import {
  cycleUserSort,
  selectUsers,
  type UserSort,
  type UserSortField,
} from "../../application/user-directory";
import { useEffect, useState } from "react";
import {
  Actions,
  Badge,
  DeleteButton,
  EditButton,
  Alert,
  Button,
  Field,
  Input,
  PageHeading,
  Panel,
  Select,
  Table,
  TableViewport,
  SortableHeader,
  SearchControl,
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
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<UserSort[]>([]);
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
  const visibleUsers = selectUsers(
    users,
    search,
    sort,
    (user, field) =>
      field === "user"
        ? user.name
        : field === "profile"
          ? t(profileLabels[user.profile])
          : t(user.active ? "Active" : "Disabled"),
    new Intl.Collator(locale(), { numeric: true, sensitivity: "base" }).compare,
  );
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
        <div className="access-users-heading">
          <h2>{t("Users")}</h2>
          <SearchControl
            label={t("Search users")}
            value={search}
            placeholder={t("Name or username")}
            onChange={setSearch}
          />
        </div>
        {pending && <p role="status">{t("Updating users…")}</p>}
        <TableViewport>
          <Table
            className="access-users"
            aria-label={t("Accounts for this site")}
          >
            <colgroup>
              <col className="access-users-person" />
              <col className="access-users-profile" />
              <col className="access-users-status" />
              <col />
            </colgroup>
            <thead>
              <tr>
                {(
                  [
                    ["user", "User"],
                    ["profile", "Profile"],
                    ["status", "Status"],
                  ] as const
                ).map(([field, label]: readonly [UserSortField, string]) => {
                  const index = sort.findIndex(
                    (criterion) => criterion.field === field,
                  );
                  return (
                    <SortableHeader
                      key={field}
                      direction={sort[index]?.direction}
                      priority={sort.length > 1 ? index + 1 : undefined}
                      onClick={() =>
                        setSort((current) => cycleUserSort(current, field))
                      }
                    >
                      {t(label)}
                    </SortableHeader>
                  );
                })}
                <th scope="col">{t("Access")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id}>
                  <th scope="row">
                    <span className="access-user-identity">
                      <span className="access-user-name">{user.name}</span>
                      <small>{user.username}</small>
                    </span>
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
                      <EditButton
                        label={t("Edit user {0}", [user.username])}
                        disabled={pending}
                        onClick={() => setEditingUser(user)}
                      />
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
        {!pending && !visibleUsers.length && (
          <p role="status">{t("No users match your search.")}</p>
        )}
      </Panel>
    </div>
  );
}
