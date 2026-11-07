import { useEffect, useRef, useState } from "react";
import { Alert, Badge, Button, CollectionAction, Dialog, Panel, RefreshButton } from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { HandoverApplication } from "../../application/handover";
import type { Choice, Page } from "../../domain/models";
import { today } from "./EntryForm";
import { EntrySummaryCards } from "./EntrySummaryCards";
import "./handover.css";

/** Site-wide Information is independent of the selected/assigned department. */
export function InformationNotices({ application, open }: { application: HandoverApplication; open: (id: string) => void }) {
  const [sections, setSections] = useState<{ category: Choice; page: Page }[]>([]);
  const [day, setDay] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paging, setPaging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      const request = ++generation.current;
      setLoading(true);
      setPaging(false);
      try {
        const context = await application.context();
        const displayOn = today(context.timeZone);
        const result = await Promise.all(context.categories.filter((category) => category.workflow === "information")
          .map(async (category) => ({ category, page: await application.list({ categoryId: category.id, displayOn }) })));
        if (active && request === generation.current) { setDay(displayOn); setSections(result); setError(""); }
      } catch (reason) {
        if (active && request === generation.current) setError(reason instanceof Error ? reason.message : "Information is unavailable.");
      } finally {
        if (active && request === generation.current) setLoading(false);
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 30_000);
    return () => { active = false; generation.current++; window.clearInterval(interval); };
  }, [application, refresh]);

  const more = async (categoryId: string) => {
    const section = sections.find((value) => value.category.id === categoryId);
    if (!section?.page.nextCursor || loading || paging) return;
    const request = generation.current;
    setPaging(true);
    try {
      const page = await application.list({ categoryId, displayOn: day, cursor: section.page.nextCursor });
      if (request !== generation.current) return;
      setSections((current) => current.map((value) => value.category.id === categoryId
        ? { ...value, page: { ...page, entries: [...value.page.entries, ...page.entries.filter(entry => !value.page.entries.some(prior => prior.id === entry.id))] } } : value));
      setError("");
    } catch (reason) {
      if (request === generation.current) setError(reason instanceof Error ? reason.message : "Information is unavailable.");
    } finally {
      if (request === generation.current) setPaging(false);
    }
  };
  const entries = sections.flatMap(section => section.page.entries);
  const total = sections.reduce((count, section) => count + section.page.total, 0);
  const openEntry = (id: string) => { setExpanded(false); open(id); };
  if (!total && !loading && !error) return null;
  return <Panel className="handover-information-notices" aria-label={t("Active information")}>
    <div className="handover-section-heading">
      <h2 className="handover-information-title">{t("Information")} <Badge>{total}</Badge></h2>
      <RefreshButton label={t("Refresh information")} busy={loading || paging} onClick={() => setRefresh(value => value + 1)} />
    </div>
    <p className="handover-muted">{t("Current notices for all departments.")}</p>
    {error && <Alert>{error}</Alert>}
    {loading && !total && <p role="status">{t("Loading information…")}</p>}
    <EntrySummaryCards entries={entries.slice(0, 3)} open={openEntry} expanded notice preview="original" />
    {total > 0 && <div className="handover-information-footer">
      <p className="handover-muted">{t("Showing {0} of {1} notices.", [Math.min(entries.length, 3), total])}</p>
      <CollectionAction count={total} onClick={() => setExpanded(true)}>{t("All information")}</CollectionAction>
    </div>}
    {expanded && <Dialog title={t("All information")} onClose={() => setExpanded(false)}>
      {error && <Alert>{error}</Alert>}
      <p className="handover-muted">{t("Current notices for all departments.")}</p>
      {!total && <p>{t("No active information.")}</p>}
      {sections.filter(section => section.page.total > 0).map(({ category, page }) => <section key={category.id} aria-label={t(category.label)}>
        <EntrySummaryCards entries={page.entries} open={openEntry} expanded notice preview="original" />
        {page.nextCursor && <Button variant="text" disabled={loading || paging} onClick={() => void more(category.id)}>{t("More information")}</Button>}
      </section>)}
    </Dialog>}
  </Panel>;
}
