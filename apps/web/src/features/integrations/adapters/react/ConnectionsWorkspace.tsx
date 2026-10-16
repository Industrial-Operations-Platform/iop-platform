import { useEffect, useRef, useState } from "react";
import type { ConnectionsApplication } from "../../application/connections";
import type { Connection, ConnectionReadiness, IntegrationKind } from "../../domain/models";
import {
  Actions, Alert, Badge, Button, DetailFacts, Disclosure, Field, FieldRow,
  Input, PageHeading, PageStack, Panel, RefreshButton, Table, TableViewport,
} from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";

export function ConnectionsWorkspace({ application, canManage, timeZone = "UTC" }: {
  application: ConnectionsApplication;
  canManage: boolean;
  timeZone?: string;
}) {
  const [connections, setConnections] = useState<ConnectionReadiness[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Connection | null>(null);
  const [historySource, setHistorySource] = useState<{ kind: IntegrationKind; label: string } | null>(null);
  const [history, setHistory] = useState<Connection[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const generation = useRef(0);
  const historyGeneration = useRef(0);
  const request = useRef<number | null>(null);

  function clearHistory() {
    historyGeneration.current++;
    setHistorySource(null);
    setHistory(null);
    setHistoryLoading(false);
    setHistoryError("");
  }
  async function load() {
    const token = ++generation.current;
    request.current = token;
    setBusy(true);
    setError("");
    setConnections(null);
    try {
      const result = await application.query();
      if (generation.current === token) setConnections(result.connections);
    } catch (reason) {
      if (generation.current === token) setError((reason as Error).message);
    } finally {
      if (generation.current === token) { request.current = null; setBusy(false); }
    }
  }
  useEffect(() => {
    setDraft(null);
    clearHistory();
    void load();
    return () => {
      generation.current++;
      historyGeneration.current++;
      request.current = null;
    };
  }, [application]);
  useEffect(() => {
    if (!canManage) setDraft(null);
  }, [canManage]);

  async function save() {
    if (!draft || !canManage || request.current !== null) return;
    const token = ++generation.current;
    request.current = token;
    setBusy(true);
    setError("");
    try {
      await application.save(draft);
      if (generation.current !== token) return;
      setDraft(null);
      clearHistory();
      await load();
    } catch (reason) {
      if (generation.current === token) setError((reason as Error).message);
    } finally {
      if (generation.current === token) { request.current = null; setBusy(false); }
    }
  }
  async function loadHistory(kind: IntegrationKind, label: string) {
    const token = ++historyGeneration.current;
    setHistorySource({ kind, label });
    setHistory(null);
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const result = await application.history(kind);
      if (historyGeneration.current === token) setHistory(result.revisions);
    } catch (reason) {
      if (historyGeneration.current === token) setHistoryError((reason as Error).message);
    } finally {
      if (historyGeneration.current === token) setHistoryLoading(false);
    }
  }
  function field(key: "label" | "endpoint" | "contractVersion" | "credentialReference" | "tenantId" | "clientId", value: string) {
    setDraft(current => current ? { ...current, configuration: { ...current.configuration, [key]: value } } : null);
  }
  function recorded(at: string) {
    const value = new Date(at);
    return Number.isNaN(value.getTime()) ? t("Not recorded") : new Intl.DateTimeFormat(locale(), {
      dateStyle: "medium", timeStyle: "short", timeZone,
    }).format(value);
  }

  return <PageStack>
    <PageHeading title="Integrations" description="Read-only adapter contracts are ready. Real provider connections still require configuration and implementation."
      actions={<RefreshButton busy={busy} disabled={!!draft} onClick={() => void load()} />} />
    {error && <Alert>{error}</Alert>}
    <Panel><PageStack>
      <p>{t("No live provider is connected. Saved configuration does not enable a transport or replace local sign-in.")}</p>
      {busy && !draft ? <p role="status">{t("Loading integration readiness…")}</p> : connections ? connections.length ? connections.map(connection => <Disclosure
        key={connection.configuration.kind} variant="divided"
        summary={<>{connection.configuration.label} <Badge tone={connection.status === "disabled" ? "neutral" : "warning"}>{t(connection.status === "disabled" ? "Disabled" : connection.status === "configuration-pending" ? "Configuration pending" : "Transport pending")}</Badge></>}
      ><PageStack>
        <DetailFacts items={[
          { label: t("Adapter"), value: t("Adapter contract ready") },
          { label: t("Connection"), value: t("No verified provider connection") },
        ]} />
        {!!connection.missingInputs.length && <div><h2>{t("Required configuration and verification")}</h2><ul>{connection.missingInputs.map(input => <li key={input}>{t(input)}</li>)}</ul></div>}
        <Actions>
          {canManage && <Button variant="secondary" disabled={busy} onClick={() => { setDraft(connection); clearHistory(); setError(""); }}>{t("Edit configuration")}</Button>}
          <Button variant="secondary" disabled={busy || historyLoading} onClick={() => void loadHistory(connection.configuration.kind, connection.configuration.label)}>{t("Configuration history")}</Button>
        </Actions>
      </PageStack></Disclosure>) : <p>{t("No integrations are configured.")}</p> : <>
        <p>{t("Integration readiness is unavailable.")}</p><Button variant="secondary" onClick={() => void load()}>{t("Retry")}</Button>
      </>}
    </PageStack></Panel>
    {draft && canManage && <Panel><PageStack>
      <h2>{t("Configuration")} — {draft.configuration.label}</h2>
      <p>{t("Enter nonsecret metadata only. Credentials stay in private operator storage; use a logical reference here.")}</p>
      <form onSubmit={event => { event.preventDefault(); void save(); }}><PageStack>
        <FieldRow>
          <Field>{t("Label")}<Input disabled={busy} value={draft.configuration.label} maxLength={100} onChange={event => field("label", event.target.value)} required /></Field>
          <Field>{t("Authorized HTTPS endpoint")}<Input disabled={busy} value={draft.configuration.endpoint} maxLength={500} onChange={event => field("endpoint", event.target.value)} /></Field>
        </FieldRow>
        <FieldRow>
          <Field>{t("Reviewed contract version")}<Input disabled={busy} value={draft.configuration.contractVersion} maxLength={100} onChange={event => field("contractVersion", event.target.value)} /></Field>
          <Field>{t("Private credential reference")}<Input disabled={busy} value={draft.configuration.credentialReference} maxLength={100} onChange={event => field("credentialReference", event.target.value)} /></Field>
        </FieldRow>
        {draft.configuration.kind === "entra" && <FieldRow>
          <Field>{t("Tenant ID")}<Input disabled={busy} value={draft.configuration.tenantId} maxLength={100} onChange={event => field("tenantId", event.target.value)} /></Field>
          <Field>{t("Client ID")}<Input disabled={busy} value={draft.configuration.clientId} maxLength={100} onChange={event => field("clientId", event.target.value)} /></Field>
        </FieldRow>}
        <Field layout="inline"><Input disabled={busy} type="checkbox" checked={draft.configuration.enabled} onChange={event => setDraft({ ...draft, configuration: { ...draft.configuration, enabled: event.target.checked } })} /><span>{t("Prepare enabled connection")}</span></Field>
        <Actions className="iop-form-actions"><Button variant="secondary" disabled={busy} onClick={() => setDraft(null)}>{t("Cancel")}</Button><Button type="submit" disabled={busy}>{t("Save")}</Button></Actions>
      </PageStack></form>
    </PageStack></Panel>}
    {historySource && <Panel aria-label={t("Configuration history")}><PageStack>
      <h2>{t("Configuration history")} — {historySource.label}</h2>
      {historyLoading ? <p role="status">{t("Loading configuration history…")}</p> : historyError ? <>
        <Alert>{historyError}</Alert><Button variant="secondary" onClick={() => void loadHistory(historySource.kind, historySource.label)}>{t("Retry")}</Button>
      </> : history?.length ? <TableViewport><Table aria-label={t("Configuration revisions")} variant="records">
        <thead><tr><th scope="col" data-align="text">{t("Label")}</th><th scope="col" data-align="number">{t("Revision")}</th><th scope="col">{t("Recorded")}</th></tr></thead>
        <tbody>{history.map(record => <tr key={record.revision}><th scope="row" data-align="text">{record.configuration.label}</th><td data-align="number">{record.revision}</td><td>{recorded(record.updatedAt)}</td></tr>)}</tbody>
      </Table></TableViewport> : <p>{t("No configuration history recorded yet.")}</p>}
    </PageStack></Panel>}
  </PageStack>;
}
