import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  AnalysisWorkspace,
  type AnalysisGateway,
} from "../src/features/analysis/application/workspace";
import { WorkspaceApp } from "../src/features/analysis/adapters/react/Workspace";
import type {
  ProfileResult,
  Report,
  ReportRequest,
} from "../src/features/analysis/domain/models";

jest.mock("../src/design/components/components.css", () => ({}));
jest.mock("../src/features/analysis/adapters/react/workspace.css", () => ({}));
jest.mock("../src/features/analysis/adapters/echarts/charts", () => ({
  mountChart: jest.fn(),
  pareto: () => ({ summary: "Pareto coverage" }),
  number: String,
}));

const profile: ProfileResult = {
  version: "1",
  profile: {
    normalization: { trim: true, unicodeNfc: true, collapseWhitespace: false },
    unclassifiedLabel: "Unclassified",
    areaSectors: [{ area: "Area A", sector: "Sector A" }],
    aliases: [{ field: "area", from: "Area,A", to: "Area A" }],
  },
};
function setup() {
  const gateway = {
    messages: jest.fn().mockResolvedValue({ values: [], nextCursor: null }),
    context: jest.fn().mockResolvedValue({
      enabled: true,
      canImport: true,
      user: { id: "admin", name: "Administrator" },
      users: [{ id: "admin", name: "Administrator" }],
      scope: null,
    }),
    availability: jest.fn().mockResolvedValue({ dates: ["2026-07-01"] }),
    history: jest.fn().mockResolvedValue([]),
    report: jest.fn().mockImplementation(
      async (selection: ReportRequest) =>
        ({
          selection,
          revision: "1",
          profileVersion: "1",
          totals: {
            key: "total",
            records: 0,
            frequency: 0,
            seconds: 0,
            minutes: 0,
          },
          executive: [],
          groups: [],
          frequencyGroups: [],
          durationGroups: [],
          groupCount: 0,
          timeline: [],
          series: [],
          monthly: [],
          options: {},
          optionCounts: {},
          dates: ["2026-07-01"],
          records: [],
          recordCount: 0,
          page: 1,
          pageCount: 1,
          unclassifiedCount: 0,
        }) as Report,
    ),
    profile: jest.fn().mockResolvedValue(profile),
    saveProfile: jest.fn().mockImplementation(async (value: ProfileResult) => ({
      ...value,
      version: "2",
    })),
  };
  render(
    <WorkspaceApp
      application={new AnalysisWorkspace(gateway as unknown as AnalysisGateway)}
    />,
  );
  return gateway;
}

test("direct detail entry uses months and an empty draft cannot replace applied results", async () => {
  const gateway = setup();
  fireEvent.click(await screen.findByRole("button", { name: "Data analysis" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Bereich analysis" }),
  );
  await screen.findByRole("heading", { name: "No matching records" });
  const initialCalls = gateway.report.mock.calls.length;
  fireEvent.click(screen.getByText(/Months ·/));
  fireEvent.click(screen.getByRole("checkbox", { name: "July 2026" }));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Select at least one month",
  );
  expect(screen.getByRole("button", { name: "Apply filters" })).toBeDisabled();
  expect(gateway.report).toHaveBeenCalledTimes(initialCalls);
  fireEvent.click(screen.getByRole("checkbox", { name: "July 2026" }));
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await screen.findByRole("heading", { name: "No matching records" });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(gateway.report).toHaveBeenLastCalledWith(
    expect.objectContaining({ months: ["2026-07"] }),
  );
});

test("preparation edits clear saved confirmation and cannot be overwritten during a save", async () => {
  const gateway = setup();
  fireEvent.click(await screen.findByRole("button", { name: "Data analysis" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Administration" }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Import & prepare" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Data preparation" }));
  const save = await screen.findByRole("button", {
    name: "Save historical preparation",
  });
  fireEvent.click(save);
  expect(await screen.findByText(/Preparation saved\./)).toBeInTheDocument();
  fireEvent.click(screen.getByText(/Area → sector rules/));
  fireEvent.change(screen.getByLabelText("Sector 1"), {
    target: { value: "Sector B" },
  });
  expect(screen.queryByText(/Preparation saved\./)).not.toBeInTheDocument();
  let resolve!: (value: ProfileResult) => void;
  gateway.saveProfile.mockImplementationOnce(
    () =>
      new Promise<ProfileResult>((done) => {
        resolve = done;
      }),
  );
  fireEvent.click(save);
  expect(screen.getByLabelText("Sector 1")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Add area rule" })).toBeDisabled();
  expect(screen.getByLabelText("Collapse repeated spaces")).toBeDisabled();
  resolve({
    ...profile,
    version: "3",
    profile: {
      ...profile.profile,
      areaSectors: [{ area: "Area A", sector: "Sector B" }],
    },
  });
  await waitFor(() => expect(screen.getByLabelText("Sector 1")).toBeEnabled());
  expect(screen.getByLabelText("Sector 1")).toHaveValue("Sector B");
  expect(screen.getByText(/Preparation saved\./)).toBeInTheDocument();
  fireEvent.click(screen.getByText(/Explicit value corrections/));
  fireEvent.change(screen.getByLabelText("to value 1"), {
    target: { value: "Area B" },
  });
  expect(screen.queryByText(/Preparation saved\./)).not.toBeInTheDocument();
});

test("Start summarizes analytics without privileged reads and administrators explicitly enable tools", async () => {
  const gateway = setup();
  await screen.findByRole("region", { name: "Start page" });
  await screen.findByRole("heading", { name: "Welcome, Administrator" });
  await waitFor(() => expect(gateway.report).toHaveBeenCalledWith(
    expect.objectContaining({ dimension: "sector", months: ["2026-07"] }),
  ));
  expect(gateway.history).not.toHaveBeenCalled();
  expect(gateway.profile).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Data analysis" }));
  await waitFor(() => expect(gateway.report).toHaveBeenCalled());
  expect(gateway.history).not.toHaveBeenCalled();
  expect(gateway.profile).not.toHaveBeenCalled();
  expect(
    screen.queryByRole("button", { name: "Import & prepare" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(/Contributing source rows/),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText("Taskforce · Data Analysis"),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Administration" }));
  await screen.findByRole("button", { name: "Import & prepare" });
  await waitFor(() => expect(gateway.history).toHaveBeenCalled());
  await screen.findByRole("heading", { name: "Add a daily CSV" });
  const reportCalls = gateway.report.mock.calls.length;
  expect(
    screen.queryByRole("navigation", { name: "Analysis templates" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText(/Explore data/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Refresh history" }));
  await waitFor(() => expect(gateway.history).toHaveBeenCalledTimes(2));
  expect(gateway.report).toHaveBeenCalledTimes(reportCalls);
  fireEvent.click(screen.getByRole("button", { name: "Taskforce view" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Import & prepare" }),
    ).not.toBeInTheDocument(),
  );
  expect(screen.queryByText("KPI settings & goals")).not.toBeInTheDocument();
});

test("administration works before the first import without analytical requests", async () => {
  const gateway = setup();
  gateway.availability.mockResolvedValue({ dates: [] });
  fireEvent.click(
    await screen.findByRole("button", { name: "Administration" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Data analysis" }));
  await screen.findByRole("heading", { name: "Add a daily CSV" });
  fireEvent.click(screen.getByRole("button", { name: "KPI settings & goals" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Save KPI settings" }),
    ).toBeEnabled(),
  );
  expect(gateway.report).not.toHaveBeenCalled();
  expect(
    screen.queryByRole("navigation", { name: "Analysis templates" }),
  ).not.toBeInTheDocument();
});
