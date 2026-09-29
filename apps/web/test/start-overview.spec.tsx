import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  AnalysisWorkspace,
  type AnalysisGateway,
} from "../src/features/analysis/application/workspace";
import { StartOverview } from "../src/features/analysis/adapters/react/StartOverview";
import type {
  DemoContext,
  Report,
  ReportRequest,
} from "../src/features/analysis/domain/models";

jest.mock("../src/design/components/components.css", () => ({}));

const context: DemoContext = {
  enabled: true,
  canImport: false,
  user: { id: "reader", name: "Reader" },
  users: [],
  scope: null,
};
function makeReport(selection: ReportRequest, key = "Halle A"): Report {
  const row = { key, frequency: 123, seconds: 600, minutes: 10, records: 2 };
  return {
    selection,
    revision: "1",
    profileVersion: "1",
    totals: row,
    groups: [row],
    groupCount: 1,
    frequencyGroups: [row],
    durationGroups: [row],
    executive: [],
    timeline: [],
    series: [],
    monthly: [],
    options: { sector: ["Halle A"] },
    optionCounts: { sector: 1 },
    dates: ["2025-12-01", "2026-07-01"],
    records: [],
    recordCount: 2,
    page: 1,
    pageCount: 1,
    unclassifiedCount: 0,
    excludedWeekdays: [7],
  };
}
function setup() {
  const gateway = {
    availability: jest
      .fn()
      .mockResolvedValue({ dates: ["2025-12-01", "2026-07-01"] }),
    report: jest
      .fn()
      .mockImplementation(async (request: ReportRequest) =>
        makeReport(
          request,
          request.dimension === "area" ? "Area A" : "Halle A",
        ),
      ),
    history: jest.fn(),
    profile: jest.fn(),
  };
  const application = new AnalysisWorkspace(
    gateway as unknown as AnalysisGateway,
  );
  return { gateway, application };
}

test("uses the latest imported month, drills into classified areas and keeps operational information unknown", async () => {
  const { application, gateway } = setup();
  const openAnalysis = jest.fn();
  render(
    <StartOverview
      application={application}
      context={context}
      openAnalysis={openAnalysis}
    />,
  );
  expect(await screen.findByText("123")).toBeVisible();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(gateway.report).toHaveBeenCalledWith(
    expect.objectContaining({
      months: ["2026-07"],
      dimension: "sector",
      executive: false,
    }),
  );
  expect(
    within(
      screen.getByText("Imported dates this month").closest("section")!,
    ).getByText("1"),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByRole("combobox", { name: "Sector / Halle" }), {
    target: { value: "Halle A" },
  });
  await screen.findByText("123");
  expect(gateway.report).toHaveBeenLastCalledWith(
    expect.objectContaining({
      dimension: "area",
      filters: { sector: ["Halle A"] },
    }),
  );
  expect(gateway.history).not.toHaveBeenCalled();
  expect(gateway.profile).not.toHaveBeenCalled();
  expect(screen.getByText(/Status is unknown/)).toBeVisible();
  expect(screen.getByText(/No workforce information/)).toBeVisible();
  fireEvent.change(screen.getByRole("combobox", { name: "Sector / Halle" }), {
    target: { value: "" },
  });
  expect(screen.getByText("123")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Open Data Analysis" }));
  expect(openAnalysis).toHaveBeenCalledTimes(1);
});

test("denied and empty responses do not invent zero totals and refresh can recover", async () => {
  const { application, gateway } = setup();
  gateway.availability.mockRejectedValueOnce(new Error("Access denied"));
  render(
    <StartOverview
      application={application}
      context={context}
      openAnalysis={() => {}}
    />,
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("Access denied");
  expect(
    screen.queryByText("Reported alarm frequency"),
  ).not.toBeInTheDocument();
  gateway.availability.mockResolvedValueOnce({ dates: [] });
  fireEvent.click(screen.getByRole("button", { name: "Refresh overview" }));
  await screen.findByText(/No analytical history/);
  expect(gateway.report).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Refresh overview" }));
  await screen.findByText("123");
});

test("a pending old-user report cannot appear after the selected user is cleared", async () => {
  const { application, gateway } = setup();
  let finish!: (report: Report) => void;
  gateway.report.mockImplementationOnce(
    () =>
      new Promise<Report>((resolve) => {
        finish = resolve;
      }),
  );
  const { rerender } = render(
    <StartOverview
      application={application}
      context={context}
      openAnalysis={() => {}}
    />,
  );
  await waitFor(() => expect(gateway.report).toHaveBeenCalled());
  const selection = gateway.report.mock.calls[0][0];
  rerender(
    <StartOverview
      application={application}
      context={{ ...context, user: null }}
      openAnalysis={() => {}}
    />,
  );
  finish(makeReport(selection, "Private old-user sector"));
  await screen.findByRole("heading", { name: "Select your local user" });
  expect(screen.queryByText("Private old-user sector")).not.toBeInTheDocument();
  expect(screen.queryByText("123")).not.toBeInTheDocument();
});
