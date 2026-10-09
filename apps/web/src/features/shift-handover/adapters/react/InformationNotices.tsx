import { useEffect, useState } from "react";
import { Alert } from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { HandoverApplication } from "../../application/handover";
import type { Choice, Page } from "../../domain/models";
import { today } from "./EntryForm";
import "./handover.css";
import { MeetingCanvas } from "./MeetingCanvas";

/** Site-wide Information is independent of the selected/assigned department. */
export function InformationNotices({ application, open }: { application: HandoverApplication; open: (id: string) => void }) {
  const [sections, setSections] = useState<{ category: Choice; page: Page }[]>([]);
  const [day, setDay] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const context = await application.context();
        const displayOn = today(context.timeZone);
        const result = await Promise.all(context.categories.filter((category) => category.workflow === "information")
          .map(async (category) => ({ category, page: await application.list({ categoryId: category.id, displayOn }) })));
        if (active) { setDay(displayOn); setSections(result); setError(""); }
      } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : "Information is unavailable."); }
    };
    void load();
    const interval = window.setInterval(() => void load(), 30_000);
    return () => { active = false; window.clearInterval(interval); };
  }, [application]);
  if (error) return <Alert>{error}</Alert>;
  if (!sections.some((section) => section.page.total)) return null;
  return <section className="handover-information-notices" aria-label={t("Active information")}>
    <MeetingCanvas sections={sections.filter((section) => section.page.total > 0)} open={open} busy={busy}
      more={async (categoryId) => {
        const section = sections.find((value) => value.category.id === categoryId);
        if (!section?.page.nextCursor) return;
        setBusy(true);
        try {
          const page = await application.list({ categoryId, displayOn: day, cursor: section.page.nextCursor });
          setSections((current) => current.map((value) => value.category.id === categoryId
            ? { ...value, page: { ...page, entries: [...value.page.entries, ...page.entries] } } : value));
        } catch (reason) { setError(reason instanceof Error ? reason.message : "Information is unavailable."); }
        finally { setBusy(false); }
      }} />
  </section>;
}
