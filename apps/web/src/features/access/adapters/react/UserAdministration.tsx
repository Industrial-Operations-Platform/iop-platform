import { useEffect, useState } from "react";
import {
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
const options = Object.entries(profileLabels).map(([value, label]) => (
  <option key={value} value={value}>
    {label}
  </option>
));
export function UserAdministration({
  application,
  onChanged,
}: {
  application: AccessApplication;
  onChanged: () => Promise<void>;
}) {
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
  return (
    <>
      <PageHeading
        title="Users & profiles"
        eyebrow="Administration"
        description="Create individual accounts and assign access to this local site."
      />
      <Panel>
        <h2>Available profiles</h2>
        <p>
          <strong>Administrator:</strong> user administration, imports,
          preparation and analysis.
        </p>
        <p>
          <strong>Technician · Task Force · Team Leader:</strong> the same
          analytical access for now. Permissions will evolve with future
          modules.
        </p>
      </Panel>
      {error && <Alert>{error}</Alert>}
      {issued && (
        <Panel aria-label="Initial credentials">
          <h2>Account created: {issued.username}</h2>
          <p>
            Initial password: <code>{issued.secret}</code>
          </p>
          <p>
            Give this password to the user securely. It is shown once and must
            be changed at first sign-in.
          </p>
          <Button variant="secondary" onClick={() => setIssued(null)}>
            Dismiss initial password
          </Button>
        </Panel>
      )}
      <Panel>
        <h2>Create a user</h2>
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
            Name
            <Input
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={pending}
            />
          </Field>
          <Field>
            Username
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
            Profile
            <Select
              aria-label="Profile"
              value={profile}
              onChange={(e) => setProfile(e.target.value as Profile)}
              disabled={pending}
            >
              {options}
            </Select>
          </Field>
          <Button type="submit" disabled={pending}>
            Create user
          </Button>
        </form>
      </Panel>
      <Panel>
        <h2>Users</h2>
        {pending && <p role="status">Updating users…</p>}
        <TableViewport>
          <Table>
            <caption>Accounts for this site</caption>
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Profile</th>
                <th scope="col">Status</th>
                <th scope="col">Access</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <th scope="row">
                    {user.name}
                    <br />
                    <small>{user.username}</small>
                  </th>
                  <td>
                    <Select
                      aria-label={`Profile for ${user.username}`}
                      value={user.profile}
                      disabled={pending}
                      onChange={(e) =>
                        void change(
                          user,
                          e.target.value as Profile,
                          user.active,
                        )
                      }
                    >
                      {options}
                    </Select>
                  </td>
                  <td>{user.active ? "Active" : "Disabled"}</td>
                  <td>
                    <Button
                      variant="secondary"
                      disabled={pending}
                      onClick={() =>
                        void change(user, user.profile, !user.active)
                      }
                    >
                      {user.active ? "Disable" : "Enable"} {user.username}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableViewport>
      </Panel>
    </>
  );
}
