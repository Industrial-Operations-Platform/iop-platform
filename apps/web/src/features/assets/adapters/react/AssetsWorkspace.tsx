import { useEffect, useRef, useState } from "react";
import {
  Actions,
  AddButton,
  Alert,
  Badge,
  Button,
  Disclosure,
  Field,
  Panel,
  RefreshButton,
  SearchControl,
  SectionHeading,
  Select,
  Table,
  TableViewport,
} from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";
import type { AssetsApplication } from "../../application/assets";
import {
  emptySelection,
  type Asset,
  type Context,
  type History,
  type Page,
  type SaveInput,
  type Selection,
  type SourceKind,
  type Timeline,
} from "../../domain/models";
import { AssetDetails } from "./AssetDetails";
import { AssetForm } from "./AssetForm";
import { AssetTimeline } from "./AssetTimeline";
import { assetStatusLabel } from "./labels";
import "./assets.css";

export function AssetsWorkspace({
  application,
  profile,
  timeZone,
  homeVisit = 0,
  initialAssetId = "",
  onOpenSource,
}: {
  application: AssetsApplication;
  profile?: string;
  timeZone: string;
  homeVisit?: number;
  initialAssetId?: string;
  onOpenSource?: (kind: SourceKind, id: string) => void;
}) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [from, setFrom] = useState(() =>
    new Date(new Date(today + "T12:00:00Z").getTime() - 89 * 86400000)
      .toISOString()
      .slice(0, 10),
  );
  const [to, setTo] = useState(today);
  const [source, setSource] = useState<"" | SourceKind>("");
  const [context, setContext] = useState<Context>();
  const [page, setPage] = useState<Page>();
  const [selection, setSelection] = useState<Selection>(emptySelection);
  const [selectedId, setSelectedId] = useState(initialAssetId);
  const [selected, setSelected] = useState<Asset>();
  const [history, setHistory] = useState<History>();
  const [timeline, setTimeline] = useState<Timeline>();
  const [form, setForm] = useState(false);
  const [contextLoading, setContextLoading] = useState(true);
  const [queryLoading, setQueryLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [contextError, setContextError] = useState("");
  const [queryError, setQueryError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [timelineError, setTimelineError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [version, setVersion] = useState(0);
  const queryEpoch = useRef(0);
  const detailEpoch = useRef(0);
  const timelineEpoch = useRef(0);
  const pending =
    contextLoading ||
    queryLoading ||
    detailLoading ||
    timelineLoading ||
    saving;
  const leaveDetails = () => {
    detailEpoch.current += 1;
    timelineEpoch.current += 1;
    setSelectedId("");
    setSelected(undefined);
    setHistory(undefined);
    setTimeline(undefined);
    setDetailLoading(false);
    setTimelineLoading(false);
    setDetailError("");
    setTimelineError("");
    setForm(false);
  };
  const goHome = () => {
    leaveDetails();
    setSelection(emptySelection);
    setSource("");
  };
  useEffect(() => {
    goHome();
    if (initialAssetId) setSelectedId(initialAssetId);
  }, [homeVisit, initialAssetId]);
  useEffect(() => {
    let active = true;
    setContextLoading(true);
    setContextError("");
    void application
      .context()
      .then((value) => {
        if (active) setContext(value);
      })
      .catch((exception) => {
        if (active) setContextError(exception.message);
      })
      .finally(() => {
        if (active) setContextLoading(false);
      });
    return () => {
      active = false;
    };
  }, [application, version]);
  useEffect(() => {
    const epoch = ++queryEpoch.current;
    setQueryLoading(true);
    setQueryError("");
    setPage(undefined);
    void application
      .query(selection)
      .then((value) => {
        if (queryEpoch.current === epoch) setPage(value);
      })
      .catch((exception) => {
        if (queryEpoch.current === epoch) setQueryError(exception.message);
      })
      .finally(() => {
        if (queryEpoch.current === epoch) setQueryLoading(false);
      });
    return () => {
      queryEpoch.current += 1;
    };
  }, [application, selection, version]);
  useEffect(() => {
    const epoch = ++detailEpoch.current;
    if (!selectedId) {
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    setDetailError("");
    void Promise.all([
      application.detail(selectedId),
      application.history(selectedId),
    ])
      .then(([asset, revisions]) => {
        if (detailEpoch.current === epoch) {
          setSelected(asset);
          setHistory(revisions);
        }
      })
      .catch((exception) => {
        if (detailEpoch.current === epoch) setDetailError(exception.message);
      })
      .finally(() => {
        if (detailEpoch.current === epoch) setDetailLoading(false);
      });
    return () => {
      detailEpoch.current += 1;
    };
  }, [application, selectedId, version]);
  useEffect(() => {
    const epoch = ++timelineEpoch.current;
    setTimeline(undefined);
    setTimelineError("");
    if (!selectedId || !from || !to) {
      setTimelineLoading(false);
      return;
    }
    setTimelineLoading(true);
    void application
      .timeline({
        id: selectedId,
        from,
        to,
        cursor: "",
        ...(source ? { kind: source } : {}),
      })
      .then((value) => {
        if (timelineEpoch.current === epoch) setTimeline(value);
      })
      .catch((exception) => {
        if (timelineEpoch.current === epoch)
          setTimelineError(exception.message);
      })
      .finally(() => {
        if (timelineEpoch.current === epoch) setTimelineLoading(false);
      });
    return () => {
      timelineEpoch.current += 1;
    };
  }, [application, selectedId, from, to, source, version]);
  const canManage =
    context?.canManage && (!profile || profile === "administrator");
  const refresh = () => setVersion((current) => current + 1);
  const save = async (input: SaveInput) => {
    const epoch = detailEpoch.current;
    setSaving(true);
    setError("");
    try {
      const asset = await application.save(input);
      if (detailEpoch.current === epoch) {
        setSelected(asset);
        setSelectedId(asset.id);
        setForm(false);
      }
      setMessage("Asset saved.");
      refresh();
    } catch (exception) {
      if (detailEpoch.current === epoch) setError((exception as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const loadAssets = async () => {
    if (!page?.nextCursor || queryLoading) return;
    const epoch = queryEpoch.current;
    setQueryLoading(true);
    setQueryError("");
    try {
      const next = await application.query({
        ...selection,
        cursor: page.nextCursor,
      });
      if (queryEpoch.current === epoch)
        setPage({ ...next, assets: [...page.assets, ...next.assets] });
    } catch (exception) {
      if (queryEpoch.current === epoch)
        setQueryError((exception as Error).message);
    } finally {
      if (queryEpoch.current === epoch) setQueryLoading(false);
    }
  };
  const loadTimeline = async () => {
    if (!timeline?.nextCursor || !selectedId || timelineLoading) return;
    const epoch = timelineEpoch.current;
    setTimelineLoading(true);
    setTimelineError("");
    try {
      const next = await application.timeline({
        id: selectedId,
        from,
        to,
        cursor: timeline.nextCursor,
        ...(source ? { kind: source } : {}),
      });
      if (timelineEpoch.current === epoch)
        setTimeline({
          ...next,
          records: [...timeline.records, ...next.records],
        });
    } catch (exception) {
      if (timelineEpoch.current === epoch)
        setTimelineError((exception as Error).message);
    } finally {
      if (timelineEpoch.current === epoch) setTimelineLoading(false);
    }
  };
  const earlierRevisions = async () => {
    if (!selected || !history?.nextBefore || detailLoading) return;
    const epoch = detailEpoch.current;
    setDetailLoading(true);
    setDetailError("");
    try {
      const next = await application.history(selected.id, history.nextBefore);
      if (detailEpoch.current === epoch)
        setHistory({
          ...next,
          revisions: [...history.revisions, ...next.revisions],
        });
    } catch (exception) {
      if (detailEpoch.current === epoch)
        setDetailError((exception as Error).message);
    } finally {
      if (detailEpoch.current === epoch) setDetailLoading(false);
    }
  };
  return (
    <div className="assets-workspace">
      <SectionHeading
        section="Assets"
        view="Directory"
        onHome={goHome}
        onBack={selectedId || form ? leaveDetails : undefined}
        description={t(
          "A digital record combining explicit asset identity and source evidence.",
        )}
        actions={
          <Actions>
            <RefreshButton busy={pending} disabled={form} onClick={refresh} />
            {!selectedId && !form && canManage && (
              <AddButton
                label={t("Register asset")}
                onClick={() => setForm(true)}
              />
            )}
            {!selectedId && !form && (
              <SearchControl
                label={t("Search assets")}
                placeholder={t("Asset code, name or description")}
                value={selection.search}
                onChange={(search) =>
                  setSelection({ ...selection, search, cursor: "" })
                }
              />
            )}
          </Actions>
        }
      />
      {[error, contextError, queryError, detailError, timelineError]
        .filter(Boolean)
        .map((value, index) => (
          <Alert key={index}>{t(value)}</Alert>
        ))}
      {message && <p role="status">{t(message)}</p>}
      {!context && (
        <Panel>{t(contextLoading ? "Loading…" : "Reload to try again.")}</Panel>
      )}
      {context &&
        (form && canManage ? (
          <AssetForm
            key={selected?.id ?? "new"}
            application={application}
            context={context}
            asset={selected}
            pending={saving}
            save={(input) => void save(input)}
            cancel={() => setForm(false)}
          />
        ) : selected ? (
          <>
            <Panel>
              <AssetDetails
                asset={selected}
                context={context}
                timeZone={timeZone}
              />
              <Actions className="iop-form-actions">
                {canManage && (
                  <Button
                    disabled={detailLoading}
                    onClick={() => setForm(true)}
                  >
                    {t("Edit asset")}
                  </Button>
                )}
              </Actions>
            </Panel>
            <AssetTimeline
              timeline={timeline}
              from={from}
              to={to}
              source={source}
              pending={timelineLoading}
              timeZone={timeZone}
              onDates={(start, end) => {
                setFrom(start);
                setTo(end);
              }}
              onSource={setSource}
              loadMore={() => void loadTimeline()}
              openSource={onOpenSource}
            />
            <Disclosure variant="panel" summary={t("Asset revision history")}>
              {history?.revisions.map((revision) => (
                <Disclosure
                  variant="panel"
                  key={revision.asset.revision}
                  summary={`#${revision.asset.revision} · ${revision.actorName} · ${new Date(revision.at).toLocaleString(locale(), { timeZone })}`}
                >
                  <p>{revision.note || t(revision.action)}</p>
                  <AssetDetails
                    asset={revision.asset}
                    context={context}
                    timeZone={timeZone}
                  />
                </Disclosure>
              ))}
              {history?.nextBefore ? (
                <Button
                  variant="secondary"
                  disabled={detailLoading}
                  onClick={() => void earlierRevisions()}
                >
                  {t("Earlier revisions")}
                </Button>
              ) : null}
            </Disclosure>
          </>
        ) : selectedId ? (
          <Panel>
            {t(
              detailLoading ? "Loading asset record…" : "Reload to try again.",
            )}
          </Panel>
        ) : (
          <>
            <div className="iop-scope-toolbar">
              <Field layout="inline" className="iop-context-field">
                <span>{t("Location")}</span>
                <Select
                  aria-label={t("Selected location")}
                  value={selection.locationId}
                  onChange={(event) =>
                    setSelection({
                      ...selection,
                      locationId: event.target.value,
                      cursor: "",
                    })
                  }
                >
                  <option value="">{t("All locations")}</option>
                  {context.locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field layout="inline" className="iop-context-field">
                <span>{t("Validation status")}</span>
                <Select
                  value={selection.status}
                  onChange={(event) =>
                    setSelection({
                      ...selection,
                      status: event.target.value as Selection["status"],
                      cursor: "",
                    })
                  }
                >
                  <option value="">{t("All")}</option>
                  {(["unverified", "validated", "retired"] as const).map(
                    (status) => (
                      <option key={status} value={status}>
                        {assetStatusLabel(status)}
                      </option>
                    ),
                  )}
                </Select>
              </Field>
            </div>
            <Panel>
              <h2>{t("Asset directory")}</h2>
              {page ? (
                <>
                  <TableViewport>
                    <Table aria-label={t("Asset directory")} variant="records">
                      <thead>
                        <tr>
                          {[
                            "Asset",
                            "Asset code",
                            "Asset type",
                            "Location",
                            "Validation status",
                          ].map((label) => (
                            <th scope="col" key={label}>
                              {t(label)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {page.assets.map((asset) => (
                          <tr key={asset.id}>
                            <td>
                              <Button
                                variant="text"
                                className="assets-title"
                                onClick={() => {
                                  setSelectedId(asset.id);
                                  setSelected(asset);
                                }}
                              >
                                {asset.content.name}
                              </Button>
                            </td>
                            <td>{asset.content.code}</td>
                            <td>{asset.content.type || "—"}</td>
                            <td>
                              {context.locations.find(
                                (location) =>
                                  location.id === asset.content.locationId,
                              )?.label || "—"}
                            </td>
                            <td>
                              <Badge
                                tone={
                                  asset.content.status === "validated"
                                    ? "success"
                                    : "neutral"
                                }
                              >
                                {assetStatusLabel(asset.content.status)}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </TableViewport>
                  {!page.assets.length && (
                    <p>{t("No assets match these filters.")}</p>
                  )}
                  <Actions>
                    <p role="status">
                      {t("Showing {0} of {1} assets.", [
                        page.assets.length,
                        page.total,
                      ])}
                    </p>
                    {page.nextCursor && (
                      <Button
                        variant="secondary"
                        disabled={queryLoading}
                        onClick={() => void loadAssets()}
                      >
                        {t("Load more")}
                      </Button>
                    )}
                  </Actions>
                </>
              ) : (
                <p>{t(queryLoading ? "Loading…" : "Reload to try again.")}</p>
              )}
            </Panel>
          </>
        ))}
    </div>
  );
}
