import { useEffect, useState } from "react";
import { Alert, Button, Panel } from "../../../../design/components";
import type { HandoverApplication } from "../../application/handover";
import type { Context, Entry } from "../../domain/models";
import { issueLabel } from "./Entries";
import "./handover.css";
export function HandoverHighlights({
  application,
  sector,
  open,
}: {
  application: HandoverApplication;
  sector: string;
  open: (id?: string, highlights?: boolean) => void;
}) {
  const [entries, setEntries] = useState<Entry[]>([]),
    [context, setContext] = useState<Context | null>(null),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setEntries([]);
    void Promise.all([
      application.context(),
      application.list({ highlights: true }),
    ])
      .then(([c, p]) => {
        if (active) {
          setContext(c);
          setEntries(p.entries);
          setTotal(p.total);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [application, refresh]);
  const highlighted = entries.slice(0, 5);
  const mapped =
    context?.locations
      .filter((l) => l.role === "department" && l.sectorKey === sector)
      .map((l) => l.id) ?? [];
  const [sectorEntries, setSectorEntries] = useState<Entry[]>([]),
    [sectorError, setSectorError] = useState("");
  useEffect(() => {
    let active = true;
    setSectorEntries([]);
    setSectorError("");
    if (sector && mapped.length)
      void Promise.all(
        mapped.map((departmentId) => application.list({ departmentId })),
      )
        .then((pages) => {
          if (active)
            setSectorEntries(
              pages
                .flatMap((p) => p.entries)
                .sort(
                  (a, b) =>
                    b.content.date.localeCompare(a.content.date) ||
                    b.createdAt.localeCompare(a.createdAt) ||
                    b.id.localeCompare(a.id),
                )
                .slice(0, 5),
            );
        })
        .catch((e) => {
          if (active) setSectorError(e.message);
        });
    return () => {
      active = false;
    };
  }, [application, sector, context, refresh]);
  const cards = (values: Entry[]) =>
    values.map((e) => (
      <article key={e.id}>
        <h3>
          <Button variant="text" onClick={() => open(e.id)}>
            {e.content.summary}
          </Button>
        </h3>
        <p>
          {e.departmentLabel || "Site-wide"} · {e.authorName} · {e.content.date}{" "}
          · {issueLabel(e.issueState)}
          {e.content.condition ? ` · Reported ${e.content.condition}` : ""}
        </p>
      </article>
    ));
  return (
    <Panel aria-label="Operational handover updates">
      <h2>Shift Handover · Highlights</h2>
      <p>Important updates selected for everyone at your site.</p>
      {loading ? (
        <p role="status">Loading operational updates…</p>
      ) : error ? (
        <Alert>{error}</Alert>
      ) : (
        <>
          {cards(highlighted)}
          {!highlighted.length && (
            <p>No active highlights. The full journal remains available.</p>
          )}
          <p>{total} active highlights</p>
        </>
      )}
      {sector && (
        <section>
          <h3>Recent updates · {sector}</h3>
          {sectorError ? (
            <Alert>{sectorError}</Alert>
          ) : !mapped.length ? (
            <p>
              No operational department mapping is configured for this sector.
            </p>
          ) : sectorEntries.length ? (
            cards(sectorEntries)
          ) : (
            <p>No operational reports are available for this selection.</p>
          )}
        </section>
      )}
      <p>
        Worker reports describe observations; absence of reports does not
        establish equipment condition.
      </p>
      <Button variant="secondary" onClick={() => open(undefined, true)}>
        View all highlights
      </Button>{" "}
      <Button variant="secondary" onClick={() => open()}>
        Open Shift Handover
      </Button>{" "}
      <Button variant="text" onClick={() => setRefresh((n) => n + 1)}>
        Refresh updates
      </Button>
    </Panel>
  );
}
