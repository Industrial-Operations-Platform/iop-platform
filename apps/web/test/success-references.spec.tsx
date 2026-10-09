import React, { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { HandoverApplication, type Gateway } from "../src/features/shift-handover/application/handover";
import { SuccessReferences } from "../src/features/shift-handover/adapters/react/SuccessReferences";
import type { CompletionPage, ResolutionReference } from "../src/features/shift-handover/domain/models";

test("selected closure references remain reviewable across searches and stale pagination cannot cross source types", async () => {
  let completeMore!: (page: CompletionPage) => void;
  const report = { source: "handover" as const, id: "report", expectedRevision: 1, title: "Inspect drive", location: "Halle A", canComplete: true };
  const work = { source: "maintenance" as const, id: "work", expectedRevision: 2, title: "Drive repair", location: "Halle A", canComplete: true };
  const targets = jest.fn(async (input) => {
    if (input.source === "maintenance") return { targets: [work], nextCursor: "", total: 1 };
    if (input.cursor) return new Promise<CompletionPage>((resolve) => { completeMore = resolve; });
    if (input.search) return { targets: [], nextCursor: "", total: 0 };
    return { targets: [report], nextCursor: "next", total: 2 };
  });
  const application = new HandoverApplication({ targets } as unknown as Gateway, () => "key");
  function Form() {
    const [references, setReferences] = useState<ResolutionReference[]>([]);
    return <SuccessReferences application={application} value={references} onChange={setReferences} />;
  }
  render(<Form />);
  fireEvent.click(await screen.findByRole("checkbox", { name: /Inspect drive/ }));
  fireEvent.change(screen.getByLabelText("Find a record"), { target: { value: "other" } });
  await screen.findByText("No matching records.");
  expect(screen.getByRole("button", { name: "Remove reference Inspect drive" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Remove reference Inspect drive" }));
  expect(screen.getByText("0 selected records")).toBeVisible();
  fireEvent.change(screen.getByLabelText("Find a record"), { target: { value: "" } });
  fireEvent.click(await screen.findByRole("button", { name: "More references" }));
  fireEvent.change(screen.getByLabelText("Reference type"), { target: { value: "maintenance" } });
  await screen.findByRole("checkbox", { name: /Drive repair/ });
  await act(async () => completeMore({ targets: [{ ...report, id: "stale", title: "Stale pagination result" }], nextCursor: "", total: 2 }));
  expect(screen.queryByText("Stale pagination result")).not.toBeInTheDocument();
  expect(screen.getByRole("checkbox", { name: /Drive repair/ })).toBeVisible();
});
