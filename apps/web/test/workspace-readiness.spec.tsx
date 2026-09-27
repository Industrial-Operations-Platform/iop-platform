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

test("invalid reporting dates show a recoverable error without unmounting the workspace", async () => {
  const gateway = setup();
  fireEvent.click(
    await screen.findByRole("button", { name: "Halle analysis" }),
  );
  await screen.findByRole("heading", { name: "No matching records" });
  const initialCalls = gateway.report.mock.calls.length;
  fireEvent.click(screen.getByText(/Date range ·/));
  fireEvent.change(screen.getByLabelText("To (exclusive)"), {
    target: { value: "2026-06-30" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Choose a reporting range",
  );
  expect(gateway.report).toHaveBeenCalledTimes(initialCalls);
  fireEvent.click(screen.getByText(/Date range ·/));
  fireEvent.change(screen.getByLabelText("To (exclusive)"), {
    target: { value: "2026-07-02" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await screen.findByRole("heading", { name: "No matching records" });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(gateway.report).toHaveBeenCalledTimes(initialCalls + 1);
});

test("preparation edits clear saved confirmation and cannot be overwritten during a save", async () => {
  const gateway = setup();
  fireEvent.click(
    await screen.findByRole("button", { name: "Import & prepare" }),
  );
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
