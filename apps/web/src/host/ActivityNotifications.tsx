import { useEffect, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Popover,
  RefreshButton,
} from "../design/components";
import { locale, t } from "../localization/i18n";
import {
  emptyNotifications,
  type EntryNotifications,
} from "../features/shift-handover/application/notifications";
import type { MaintenanceNotifications } from "../features/maintenance/application/notifications";
import type { AssignmentEvent } from "../features/maintenance/domain/models";

/** Compose independent, source-owned notification feeds in the workspace header. */
export function ActivityNotifications({
  handover,
  maintenance,
  openEntry,
  openMaintenance,
  timeZone,
}: {
  handover?: EntryNotifications | null;
  maintenance?: MaintenanceNotifications | null;
  openEntry: (id: string) => void;
  openMaintenance: (id: string) => void;
  timeZone: string;
}) {
  const [page, setPage] = useState(emptyNotifications);
  const [events, setEvents] = useState<AssignmentEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true,
      fetching = false;
    const refresh = async () => {
      if (fetching || document.visibilityState === "hidden") return;
      fetching = true;
      setBusy(true);
      const results = await Promise.allSettled([
        handover?.refresh() ?? Promise.resolve(emptyNotifications),
        maintenance?.refresh() ?? Promise.resolve([]),
      ]);
      if (active) {
        if (results[0].status === "fulfilled") setPage(results[0].value);
        else setPage(emptyNotifications);
        if (results[1].status === "fulfilled") setEvents(results[1].value);
        else setEvents([]);
        setError(
          results.some((result) => result.status === "rejected")
            ? "Some notifications are unavailable. Try again."
            : "",
        );
        setBusy(false);
      }
      fetching = false;
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [handover, maintenance, reload]);
  const total = page.total + events.length;
  const instant = (at: string) =>
    new Date(at).toLocaleString(locale(), {
      dateStyle: "short",
      timeStyle: "short",
      timeZone,
    });
  return (
    <Popover
      label={t("Notifications")}
      description={error ? t(error) : t("{0} unread notifications", [total])}
      className="iop-notifications"
      triggerClassName="iop-toolbar-icon iop-notification-toggle"
      trigger={
        <>
          <ActionIcon name="bell" />
          {(total > 0 || error) && (
            <span className="iop-notification-count" aria-hidden="true">
              {error ? "!" : total > 99 ? "99+" : total}
            </span>
          )}
          <span className="iop-visually-hidden" role="status">
            {total > 0 ? t("{0} unread notifications", [total]) : ""}
          </span>
        </>
      }
    >
      {(close) => (
        <>
          <div className="iop-notification-heading">
            <strong>{t("Notifications")}</strong>
            <RefreshButton
              label={t("Refresh notifications")}
              busy={busy}
              onClick={() => setReload((value) => value + 1)}
            />
          </div>
          <p className="iop-notification-caption">
            {t("Colleague reports and maintenance assigned to you")}
          </p>
          {error && (
            <p role="alert" className="iop-notification-caption">
              {t(error)}
            </p>
          )}
          {total > 0 && (
            <div className="iop-notification-heading">
              <Badge>{total}</Badge>
              <Button
                variant="text"
                disabled={busy}
                onClick={() => {
                  setPage(handover?.markAllRead() ?? emptyNotifications);
                  setEvents(maintenance?.markAllRead() ?? []);
                }}
              >
                {t("Mark all as read")}
              </Button>
            </div>
          )}
          {!!events.length && (
            <>
              <h3>{t("Maintenance assignments")}</h3>
              <ul className="iop-notification-list">
                {events.map((event) => (
                  <li key={event.id}>
                    <Button
                      variant="text"
                      onClick={() => {
                        close();
                        openMaintenance(event.recordId);
                      }}
                    >
                      <strong>{event.title}</strong>
                      <span>{t("Assigned to you")}</span>
                      <time dateTime={event.at}>{instant(event.at)}</time>
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {!!page.entries.length && (
            <>
              <h3>{t("Shift Handover")}</h3>
              <ul className="iop-notification-list">
                {page.entries.map((entry) => (
                  <li key={entry.id}>
                    <Button
                      variant="text"
                      onClick={() => {
                        close();
                        openEntry(entry.id);
                      }}
                    >
                      <strong>{entry.content.summary}</strong>
                      <span>
                        {entry.authorName} ·{" "}
                        {entry.departmentLabel || t("Site-wide")}
                      </span>
                      <time dateTime={entry.createdAt}>
                        {instant(entry.createdAt)}
                      </time>
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {!total && !error && (
            <p className="iop-notification-empty">
              {t(busy ? "Checking for new entries…" : "You're all caught up.")}
            </p>
          )}
          {page.total > page.entries.length && (
            <p className="iop-notification-caption">
              {t("Showing the latest {0} of {1}", [
                page.entries.length,
                page.total,
              ])}
            </p>
          )}
        </>
      )}
    </Popover>
  );
}
