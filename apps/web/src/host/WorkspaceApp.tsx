import { WorkforceToday } from "../features/workforce/adapters/react/WorkforceToday";
import { WorkforceWorkspace } from "../features/workforce/adapters/react/WorkforceWorkspace";
import type { WorkforceApplication } from "../features/workforce/application/workforce";
import { EditNameDialog } from "../features/access/adapters/react/EditNameDialog";
import { LanguageControl } from "../localization/LanguageControl";
import { language, subscribeLanguage, t } from "../localization/i18n";
import { PlatformMark } from "../design/components/PlatformMark";
import type { HandoverApplication } from "../features/shift-handover/application/handover";
import { HandoverWorkspace } from "../features/shift-handover/adapters/react/HandoverWorkspace";
import { HandoverHighlights } from "../features/shift-handover/adapters/react/HandoverHighlights";
import { useEffect, useState, useSyncExternalStore } from "react";
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
import {
  AdministrationOverview,
  type AdministrationTool,
} from "./AdministrationOverview";
import { ProfileViewControl } from "./ProfileViewControl";
export function WorkspaceApp({
  application,
  access,
  handover,
  workforce,
}: {
  application: AnalysisWorkspace;
  access?: AccessApplication;
  handover?: HandoverApplication;
  workforce?: WorkforceApplication;
}) {
  const currentLanguage = useSyncExternalStore(subscribeLanguage, language);
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);
  const [page, setPage] = useState<
    "start" | "analysis" | "administration" | "users" | "handover" | "workforce"
  >("start");
  const [workforceVisit, setWorkforceVisit] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [handoverVisit, setHandoverVisit] = useState(0);
  const [handoverEntry, setHandoverEntry] = useState("");
  const [handoverHighlights, setHandoverHighlights] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  const [handoverAttention, setHandoverAttention] = useState(false);
  const [handoverPending, setHandoverPending] = useState(false);
  const [preview, setPreview] = useState<{
    userId: string;
    profile: Profile;
  } | null>(null);
  const [administrationTool, setAdministrationTool] =
    useState<AdministrationTool>("imports");
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
    setPage("start");
    setPreview(null);
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
      setPreview(null);
    }
  };
  const refreshSession = async () => {
    if (access) updateSession(await access.context());
  };
  const signedIn = context?.user && !context.mustChangePassword;
  const canViewProfiles =
    !!signedIn && !!(context.canImport || context.canAdminister);
  const previewProfile =
    canViewProfiles && preview?.userId === context?.user?.id
      ? preview?.profile
      : undefined;
  const administration = canViewProfiles && !previewProfile;
  const effectiveProfile = previewProfile ?? context?.user?.profile;
  const canReadAnalytics =
    context?.canReadAnalytics !== false && effectiveProfile !== "technician";
  const showUserAdministration =
    administration && context?.canAdminister && !!access;
  const selectProfile = (profile: Profile) => {
    setPreview(
      profile === "administrator" || !context?.user
        ? null
        : { userId: context.user.id, profile },
    );
    setHandoverEntry("");
    setHandoverHighlights(false);
    setHandoverPending(false);
    setHandoverAttention(false);
    setPage("start");
  };
  const openTool = (tool: AdministrationTool) => {
    setAdministrationTool(tool);
    setPage("administration");
  };
  const openHandoverHome = () => {
    setHandoverEntry("");
    setHandoverHighlights(false);
    setHandoverPending(false);
    setHandoverAttention(false);
    setHandoverVisit((visit) => visit + 1);
    setPage("handover");
  };
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
          <div className="access-language">
            <LanguageControl />
          </div>
          {!!error && (
            <Alert>
              {error instanceof Error
                ? error.message
                : t("The operation failed.")}
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
                  className="iop-sign-out"
                  aria-label={t("Sign out")}
                  title={t("Sign out")}
                  onClick={signOut}
                  disabled={pending}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    aria-hidden="true"
                  >
                    <path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h12" />
                  </svg>
                  <span>{t("Sign out")}</span>
                </Button>
              )}
            </>
          ) : (
            <Panel>
              <h1>{t("Sign in to IOP")}</h1>
              <Button
                disabled={pending}
                onClick={() => setConnectionAttempt((n) => n + 1)}
              >
                {pending ? t("Connecting…") : t("Retry connection")}
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
      skipLabel={t("Skip to workspace")}
      header={
        <>
          {canViewProfiles && (
            <ProfileViewControl
              key={context?.user?.id}
              profile={previewProfile ?? "administrator"}
              onChange={selectProfile}
            />
          )}
          {context?.authentication === "password" ? (
            <div className="iop-account">
              {context.user && (
                <Button
                  variant="text"
                  className="iop-account-button"
                  aria-label={t("Edit your name")}
                  onClick={() => setEditingName(true)}
                  disabled={!access}
                >
                  <strong>{context.user.name}</strong>
                  <small>
                    {t(
                      profileLabels[context.user.profile as Profile] ?? "User",
                    )}
                  </small>
                </Button>
              )}
            </div>
          ) : (
            <Field layout="inline">
              {t("User")}{" "}
              <Select
                aria-label={t("Demo user")}
                value={context?.user?.id ?? ""}
                disabled={pending}
                onChange={(e) => void choose(e.target.value)}
              >
                <option value="" disabled>
                  {t("Select a user ")}
                </option>
                {context?.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <LanguageControl />
          {context?.authentication === "password" && context.user && access && (
            <Button
              variant="secondary"
              className="iop-sign-out"
              aria-label={t("Sign out")}
              title={t("Sign out")}
              onClick={signOut}
              disabled={pending}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h12" />
              </svg>
              <span>{t("Sign out")}</span>
            </Button>
          )}
        </>
      }
      brandAction={{
        label: t("IOP · Go to Start"),
        onClick: () => setPage("start"),
      }}
      brand={
        <>
          <PlatformMark />
          {t(" IOP")}
          <span>{t("Industrial Operations Platform")}</span>
        </>
      }
      navigation={
        <SideNavigation
          selected={page}
          onSelect={(next) => {
            if (next === "handover") openHandoverHome();
            else {
              if (next === "workforce") setWorkforceVisit((v) => v + 1);
              setPage(next);
            }
          }}
          items={[
            {
              id: "start",
              label: administration ? t("Administration") : t("Start"),
            },
            ...(administration && context?.canImport
              ? [
                  {
                    id: "administration" as const,
                    label: t("Data administration"),
                  },
                ]
              : []),
            ...(canReadAnalytics
              ? [{ id: "analysis" as const, label: t("Data analysis") }]
              : []),
            ...(workforce && signedIn
              ? [{ id: "workforce" as const, label: t("Workforce & shifts") }]
              : []),
            ...(handover && signedIn
              ? [{ id: "handover" as const, label: t("Shift Handover") }]
              : []),
            ...(showUserAdministration
              ? [{ id: "users" as const, label: t("Users & profiles") }]
              : []),
          ]}
        />
      }
    >
      {editingName && context?.user && access && (
        <EditNameDialog
          name={context.user.name}
          save={async (name) => {
            await access.rename(context.user!.id, name);
            await refreshSession();
          }}
          close={() => setEditingName(false)}
        />
      )}
      {error ? (
        <Alert>
          {error instanceof Error ? error.message : t("The operation failed.")}
        </Alert>
      ) : null}
      {previewProfile && (
        <Panel aria-label={t("Profile preview")}>
          <p>
            {t("Viewing as ")}
            {t(profileLabels[previewProfile])}
            {t(
              " · Layout preview. Your account, data access and permissions remain unchanged. ",
            )}
          </p>
          <Button
            variant="secondary"
            onClick={() => selectProfile("administrator")}
          >
            {t("Return to administration ")}
          </Button>
        </Panel>
      )}
      {page === "workforce" && workforce && signedIn ? (
        <WorkforceWorkspace
          key={`${context.user?.id}:${effectiveProfile}`}
          application={workforce}
          homeVisit={workforceVisit}
          profile={effectiveProfile}
          timeZone={context.scope?.siteTimeZone ?? "Europe/Zurich"}
        />
      ) : page === "start" && administration ? (
        <AdministrationOverview
          canImport={!!context?.canImport}
          canAdminister={!!showUserAdministration}
          access={access}
          analysis={application}
          timeZone={context.scope?.siteTimeZone ?? "UTC"}
        />
      ) : page === "users" && showUserAdministration && access ? (
        <UserAdministration
          key={context.user?.id}
          application={access}
          onChanged={refreshSession}
        />
      ) : page === "handover" && handover && signedIn ? (
        <HandoverWorkspace
          key={`${context.user?.id}:${handoverVisit}`}
          onHome={openHandoverHome}
          application={handover}
          dailyOverview={effectiveProfile === "team-leader"}
          initialEntry={handoverEntry}
          initialHighlights={handoverHighlights}
          initialPending={handoverPending}
          initialAttention={handoverAttention}
          departmentId={departmentId}
          onDepartmentChange={setDepartmentId}
          onEntryOpened={() => {
            setHandoverEntry("");
            setHandoverHighlights(false);
            setHandoverPending(false);
            setHandoverAttention(false);
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
            previewProfile
              ? profileLabels[previewProfile]
              : context.user?.profile
                ? profileLabels[context.user.profile as Profile]
                : undefined
          }
          canReadAnalytics={canReadAnalytics}
          authenticated={context.authentication === "password"}
          workforce={
            workforce && signedIn ? (
              <WorkforceToday
                application={workforce}
                timeZone={context.scope?.siteTimeZone ?? "Europe/Zurich"}
                open={() => setPage("workforce")}
              />
            ) : undefined
          }
          operational={
            handover && signedIn ? (
              <HandoverHighlights
                key={context.user?.id}
                application={handover}
                departmentId={departmentId}
                onDepartmentChange={setDepartmentId}
                open={(id, collection) => {
                  setHandoverAttention(collection === "attention");
                  setHandoverPending(collection === "pending");
                  setHandoverEntry(id ?? "");
                  setHandoverHighlights(collection === "highlights");
                  setPage("handover");
                }}
              />
            ) : undefined
          }
          openAnalysis={() => setPage("analysis")}
        />
      ) : context?.user && canReadAnalytics ? (
        <ReportWorkspace
          key={`${context.user.id}:${page}:${administrationTool}`}
          application={application}
          context={context}
          administration={
            page === "administration" && administration && context.canImport
          }
          initialAdministrationTool={administrationTool}
        />
      ) : (
        <Panel variant="empty">
          <h1>{t("Data analysis")}</h1>
          <p>
            {context?.enabled
              ? t("Select a user in the header to open the workspace.")
              : t("Connect the local API to open the analytical workspace.")}
          </p>
          {(!context?.enabled || !!error) && (
            <Button
              disabled={pending}
              onClick={() => setConnectionAttempt((n) => n + 1)}
            >
              {pending ? t("Connecting…") : t("Retry connection")}
            </Button>
          )}
        </Panel>
      )}
    </AppShell>
  );
}
