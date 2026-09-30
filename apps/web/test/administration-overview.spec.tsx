import { render, screen, within } from "@testing-library/react";
import { AdministrationOverview } from "../src/host/AdministrationOverview";
import {
  AccessApplication,
  type AccessGateway,
} from "../src/features/access/application/access";
import {
  AnalysisWorkspace,
  type AnalysisGateway,
} from "../src/features/analysis/application/workspace";

function setup(failed = false, empty = false) {
  const accessGateway: AccessGateway = {
    context: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    password: jest.fn(),
    rename: jest.fn(),
    create: jest.fn(),
    change: jest.fn(),
    update: jest.fn(),
    users: jest.fn(async () =>
      empty
        ? []
        : [
            {
              id: "user",
              name: "A colleague",
              username: "colleague",
              profile: "technician" as const,
              active: true,
            },
            {
              id: "disabled",
              name: "Disabled colleague",
              username: "disabled",
              profile: "technician" as const,
              active: false,
            },
          ],
    ),
    activity: jest.fn(async () =>
      empty
        ? []
        : [
            {
              id: "event",
              actorName: "Admin",
              subjectName: "A colleague",
              action: "user.name_changed",
              recordedAt: "2026-09-30T10:00:00Z",
            },
          ],
    ),
  };
  const history = jest.fn(async () => {
    if (failed) throw new Error("Import history unavailable.");
    return empty
      ? []
      : [
          {
            importId: "older",
            originalFilename: "older.csv",
            receivedAt: "2026-09-29T12:00:00Z",
            reportingDate: "2026-09-29",
            submittedBy: "Admin",
            outcome: "succeeded",
            admittedRecordCount: 10,
          },
          {
            importId: "latest",
            originalFilename: "latest.csv",
            receivedAt: "2026-09-30T12:00:00Z",
            reportingDate: "2026-09-30",
            submittedBy: "Admin",
            outcome: "succeeded",
            admittedRecordCount: 20,
          },
        ];
  });
  render(
    <AdministrationOverview
      canAdminister
      canImport
      access={new AccessApplication(accessGateway)}
      analysis={
        new AnalysisWorkspace({ history } as unknown as AnalysisGateway)
      }
      timeZone="UTC"
    />,
  );
}
test("administrator home shows real account counts, recent changes and the most recently received file", async () => {
  setup();
  await screen.findByText("latest.csv");
  for (const [label, count] of [
    ["Total users", "2"],
    ["Active users", "1"],
    ["Disabled users", "1"],
  ]) {
    expect(screen.getByText(label).closest("section")).toHaveTextContent(count);
  }
  expect(screen.queryByText("older.csv")).toBeNull();
  expect(
    within(screen.getByRole("table")).getByText("Name changed"),
  ).toBeVisible();
  expect(screen.queryByRole("button", { name: "Import files" })).toBeNull();
});
test("an unavailable import source leaves account evidence available and reports the failure", async () => {
  setup(true);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Import history unavailable.",
  );
  expect(await screen.findByRole("table")).toBeVisible();
  expect(screen.queryByText("No files received yet.")).toBeNull();
});
test("empty persisted data has explicit empty states", async () => {
  setup(false, true);
  expect(await screen.findByText("No files received yet.")).toBeVisible();
  expect(screen.getByText("No account changes recorded yet.")).toBeVisible();
  expect(screen.getByText("Total users").closest("section")).toHaveTextContent(
    "0",
  );
});
