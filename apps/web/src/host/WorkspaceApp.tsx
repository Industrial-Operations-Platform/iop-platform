import type { HandoverApplication } from "../features/shift-handover/application/handover";
import { HandoverWorkspace } from "../features/shift-handover/adapters/react/HandoverWorkspace";
import { HandoverHighlights } from "../features/shift-handover/adapters/react/HandoverHighlights";
import { useEffect, useState } from "react";
import {
  Alert,
  AppShell,
  SideNavigation,
  Button,
  Field,
  IdentityRoot,
  Panel,
  Select,
} from "../design/components";
import { AnalysisWorkspace } from "../features/analysis/application/workspace";
import { ReportWorkspace } from "../features/analysis/adapters/react/Workspace";
import { StartOverview } from "../features/analysis/adapters/react/StartOverview";
import type { SessionContext } from "../features/access/domain/access";
import { profileLabels, type Profile } from "../features/access/domain/access";
import type { AccessApplication } from "../features/access/application/access";
import { LoginPanel } from "../features/access/adapters/react/LoginPanel";
import { UserAdministration } from "../features/access/adapters/react/UserAdministration";
import "../features/access/adapters/react/access.css";
export function WorkspaceApp({
  application,
  access,
  handover,
}: {
  application: AnalysisWorkspace;
  access?: AccessApplication;
  handover?: HandoverApplication;
}) {
  const [page, setPage] = useState<"start" | "analysis" | "users" | "handover">(
    "start",
  );
  const [handoverEntry, setHandoverEntry] = useState("");
  const [handoverHighlights, setHandoverHighlights] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  const [handoverPending, setHandoverPending] = useState(false);
  const [administration, setAdministration] = useState(false);
  const [context, setContext] = useState<SessionContext | null>(null),
    [error, setError] = useState<unknown>(),
    [pending, setPending] = useState(false),
    [connectionAttempt, setConnectionAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setPending(true);
    setError(undefined);
    void (access ? access.context() : application.open())
      .then((c) => {
        if (active) setContext(c);
      })
      .catch((e) => {
        if (active) setError(e);
      })
      .finally(() => {
        if (active) setPending(false);
      });
    return () => {
      active = false;
    };
  }, [application, access, connectionAttempt]);
  const choose = async (id: string) => {
    setAdministration(false);
    setPending(true);
    setError(undefined);
    setContext((c) => (c ? { ...c, user: null } : c));
    try {
      setContext(await application.gateway.chooseUser(id));
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  };
  const updateSession = (next: SessionContext) => {
    setContext(next);
    setError(undefined);
    if (!next.user || next.mustChangePassword) {
      setPage("start");
      setAdministration(false);
    }
  };
  const refreshSession = async () => {
    if (access) updateSession(await access.context());
  };
  const signedIn = context?.user && !context.mustChangePassword;
  const canReadAnalytics =
    context?.canReadAnalytics !== false &&
    context?.user?.profile !== "technician";
  const showUserAdministration =
    signedIn && administration && context.canAdminister;
  const signOut = () => {
    if (!access) return;
    setPending(true);
    void access
      .logout()
      .then(updateSession)
      .catch(setError)
      .finally(() => setPending(false));
  };
  if (
    access &&
    (!context || (context.authentication === "password" && !signedIn))
  ) {
    return (
      <IdentityRoot>
        <main className="access-entry">
          {!!error && (
            <Alert>
              {error instanceof Error ? error.message : "The operation failed."}
            </Alert>
          )}
          {context ? (
            <>
              <LoginPanel
                key={context.mustChangePassword ? "change" : "login"}
                application={access}
                changeRequired={!!context.mustChangePassword}
                onSession={updateSession}
              />
              {context.user && (
                <Button
                  variant="secondary"
                  onClick={signOut}
                  disabled={pending}
                >
                  Sign out
                </Button>
              )}
            </>
          ) : (
            <Panel>
              <h1>Sign in to IOP</h1>
              <Button
                disabled={pending}
                onClick={() => setConnectionAttempt((n) => n + 1)}
              >
                {pending ? "Connecting…" : "Retry connection"}
              </Button>
            </Panel>
          )}
        </main>
      </IdentityRoot>
    );
  }
  return (
    <AppShell
      className="analysis-app"
      mainId="analysis-main"
      skipLabel="Skip to analysis"
      header={
        <>
          {signedIn && context.canImport && (
            <Button
              variant="secondary"
              aria-pressed={administration}
              onClick={() => {
                setAdministration((value) => !value);
                setPage("analysis");
              }}
            >
              {administration ? "Taskforce view" : "Administration"}
            </Button>
          )}
          {context?.authentication === "password" ? (
            <>
              {context.user && (
                <span>
                  {context.user.name} ·{" "}
                  {profileLabels[context.user.profile as Profile] ?? "User"}
                </span>
              )}
              {context.user && access && (
                <Button
                  variant="secondary"
                  onClick={signOut}
                  disabled={pending}
                >
                  Sign out
                </Button>
              )}
            </>
          ) : (
            <Field layout="inline">
              User{" "}
              <Select
                aria-label="Demo user"
                value={context?.user?.id ?? ""}
                disabled={pending}
                onChange={(e) => void choose(e.target.value)}
              >
                <option value="" disabled>
                  Select a user
                </option>
                {context?.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </>
      }
      brandAction={{
        label: "IOP · Go to Start",
        onClick: () => setPage("start"),
      }}
      brand={
        <>
          IOP<span>Industrial Operations Platform</span>
        </>
      }
      navigation={
        <SideNavigation
          selected={page}
          onSelect={setPage}
          items={[
            { id: "start", label: "Start" },
            ...(canReadAnalytics
              ? [{ id: "analysis" as const, label: "Data analysis" }]
              : []),
            ...(handover && signedIn
              ? [{ id: "handover" as const, label: "Shift Handover" }]
              : []),
            ...(showUserAdministration
              ? [{ id: "users" as const, label: "Users & profiles" }]
              : []),
          ]}
        />
      }
    >
      {error ? (
        <Alert>
          {error instanceof Error ? error.message : "The operation failed."}
        </Alert>
      ) : null}
      {page === "users" && showUserAdministration && access ? (
        <UserAdministration
          key={context.user?.id}
          application={access}
          onChanged={refreshSession}
        />
      ) : page === "handover" && handover && signedIn ? (
        <HandoverWorkspace
          key={context.user?.id}
          application={handover}
          dailyOverview={context.user?.profile === "team-leader"}
          initialEntry={handoverEntry}
          initialHighlights={handoverHighlights}
          initialPending={handoverPending}
          departmentId={departmentId}
          onDepartmentChange={setDepartmentId}
          onEntryOpened={() => {
            setHandoverEntry("");
            setHandoverHighlights(false);
            setHandoverPending(false);
          }}
        />
      ) : (page === "start" || (page === "analysis" && !canReadAnalytics)) &&
        context?.enabled &&
        !error ? (
        <StartOverview
          key={context.user?.id ?? "no-user"}
          application={application}
          context={context}
          profileLabel={
            context.user?.profile
              ? profileLabels[context.user.profile as Profile]
              : undefined
          }
          canReadAnalytics={canReadAnalytics}
          authenticated={context.authentication === "password"}
          operational={
            handover && signedIn ? (
              <HandoverHighlights
                key={context.user?.id}
                application={handover}
                departmentId={departmentId}
                onDepartmentChange={setDepartmentId}
                open={(id, highlights, pending) => {
                  setHandoverPending(!!pending);
                  setHandoverEntry(id ?? "");
                  setHandoverHighlights(!!highlights);
                  setPage("handover");
                }}
              />
            ) : undefined
          }
          openAnalysis={() => {
            setAdministration(false);
            setPage("analysis");
          }}
        />
      ) : context?.user && canReadAnalytics ? (
        <ReportWorkspace
          key={context.user.id}
          application={application}
          context={context}
          administration={administration && context.canImport}
        />
      ) : (
        <Panel variant="empty">
          <h1>Data analysis</h1>
          <p>
            {context?.enabled
              ? "Select a user in the header to open the workspace."
              : "Connect the local API to open the analytical workspace."}
          </p>
          {(!context?.enabled || !!error) && (
            <Button
              disabled={pending}
              onClick={() => setConnectionAttempt((n) => n + 1)}
            >
              {pending ? "Connecting…" : "Retry connection"}
            </Button>
          )}
        </Panel>
      )}
    </AppShell>
  );
}
