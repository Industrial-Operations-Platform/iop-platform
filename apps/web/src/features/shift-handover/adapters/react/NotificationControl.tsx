import { useEffect, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Popover,
  RefreshButton,
} from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";
import {
  emptyNotifications,
  type EntryNotifications,
} from "../../application/notifications";

export function NotificationControl({
  application,
  openEntry,
  timeZone,
}: {
  application: EntryNotifications;
  openEntry: (id: string) => void;
  timeZone: string;
}) {
  const [page, setPage] = useState(emptyNotifications);
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
      try {
        const next = await application.refresh();
        if (active) {
          setPage(next);
          setError("");
        }
      } catch {
        if (active) {
          setPage(emptyNotifications);
          setError("Notifications are unavailable. Try again.");
        }
      } finally {
        fetching = false;
        if (active) setBusy(false);
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30_000);
    const resume = () => void refresh();
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [application, reload]);
  return (
    <Popover
      label={t("Notifications")}
      description={
        error ? t(error) : t("{0} unread notifications", [page.total])
      }
      className="iop-notifications"
      triggerClassName="iop-toolbar-icon iop-notification-toggle"
      trigger={
        <>
          <ActionIcon name="bell" />
          {(page.total > 0 || error) && (
            <span className="iop-notification-count" aria-hidden="true">
              {error ? "!" : page.total > 99 ? "99+" : page.total}
            </span>
          )}
          <span className="iop-visually-hidden" role="status">
            {page.total > 0 ? t("{0} unread notifications", [page.total]) : ""}
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
              onClick={() => setReload((n) => n + 1)}
            />
          </div>
          <p className="iop-notification-caption">
            {t("New entries from your colleagues")}
          </p>
          {error ? (
            <p role="alert" className="iop-notification-caption">
              {t(error)}
            </p>
          ) : (
            <>
              {page.total > 0 && (
                <div className="iop-notification-heading">
                  <Badge>{page.total}</Badge>
                  <Button
                    variant="text"
                    disabled={busy}
                    onClick={() => setPage(application.markAllRead())}
                  >
                    {t("Mark all as read")}
                  </Button>
                </div>
              )}
              {page.entries.length ? (
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
                        <time dateTime={entry.createdAt} title={timeZone}>
                          {new Date(entry.createdAt).toLocaleString(locale(), {
                            dateStyle: "short",
                            timeStyle: "short",
                            timeZone,
                          })}
                        </time>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="iop-notification-empty">
                  {busy
                    ? t("Checking for new entries…")
                    : t("You're all caught up.")}
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
        </>
      )}
    </Popover>
  );
}
