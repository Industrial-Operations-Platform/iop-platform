import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  ImportWorkspace,
  previewReportingDate,
} from "../src/features/analysis/adapters/react/ImportWorkspace";
import {
  AnalysisWorkspace,
  type AnalysisGateway,
} from "../src/features/analysis/application/workspace";
import type {
  ImportReview,
  ImportSummary,
  ProfileResult,
} from "../src/features/analysis/domain/models";

jest.mock("../src/design/components/components.css", () => ({}));
const review: ImportReview = {
  importId: "file",
  rawId: "raw",
  sourceId: "source",
  reportingDate: "2026-07-01",
  originalFilename: "Hitliste-20260701.csv",
  sha256: "hash",
  byteLength: 500,
  outcome: "succeeded",
  dataRecordCount: 10,
  admittedRecordCount: 10,
  rejectedRecordCount: 0,
  reasonCode: null,
  inspectedValidCount: 10,
  inspectedInvalidCount: 0,
  inspectionComplete: true,
  unclassifiedCount: 2,
  repeatedCount: 1,
  diagnostics: [],
  diagnosticsTruncated: false,
};
const profile: ProfileResult = {
  version: "1",
  profile: {
    normalization: { trim: true, unicodeNfc: true, collapseWhitespace: false },
    unclassifiedLabel: "Unknown",
    areaSectors: [],
    aliases: [],
    executiveKpis: [],
  },
};
function setup(history: ImportSummary[] = []) {
  let saved = profile;
  const gateway = {
    upload: jest.fn().mockResolvedValue(review),
    review: jest.fn().mockResolvedValue(review),
    originalUrl: jest.fn().mockReturnValue("/original"),
    profile: jest.fn().mockImplementation(async () => saved),
    messages: jest
      .fn()
      .mockResolvedValue({ values: ["Jam"], nextCursor: null }),
    saveProfile: jest.fn().mockImplementation(async (next: ProfileResult) => {
      saved = { ...next, version: "2" };
      return saved;
    }),
  };
  const onImported = jest.fn();
  render(
    <ImportWorkspace
      application={new AnalysisWorkspace(gateway as unknown as AnalysisGateway)}
      history={history}
      onImported={onImported}
    />,
  );
  return { gateway, onImported };
}
function selectFile(name = "Hitliste-20260701.csv") {
  const file = new File(["csv"], name, { type: "text/csv" });
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => new ArrayBuffer(3),
  });
  fireEvent.change(screen.getByLabelText("CSV file"), {
    target: { files: [file] },
  });
}

test("confirms the file date, resets confirmation on changes and presents authoritative inspection counts", async () => {
  const { gateway } = setup();
  selectFile();
  expect(screen.getByRole("button", { name: "Import CSV" })).toBeDisabled();
  fireEvent.click(screen.getByLabelText("Confirm reporting date: 2026-07-01"));
  selectFile("Hitliste-20260702.csv");
  expect(screen.getByRole("button", { name: "Import CSV" })).toBeDisabled();
  selectFile();
  fireEvent.click(screen.getByLabelText("Confirm reporting date: 2026-07-01"));
  fireEvent.click(screen.getByRole("button", { name: "Import CSV" }));
  await screen.findByRole("heading", { name: "Import complete" });
  expect(gateway.upload).toHaveBeenCalledWith(
    "Hitliste-20260701.csv",
    expect.any(ArrayBuffer),
  );
  const result = screen.getByRole("region", { name: "Import review" });
  expect(within(result).getByText(/Reporting date:/)).toHaveTextContent(
    "2026-07-01",
  );
  expect(
    within(result).getByText("Admitted rows").parentElement,
  ).toHaveTextContent("10");
  expect(
    within(result).getByRole("table", { name: "Import inspection details" }),
  ).toHaveTextContent("Unclassified rows at import");
  expect(
    screen.getByRole("link", { name: "Download preserved original" }),
  ).toHaveAttribute("href", "/original");
  expect(
    screen.queryByRole("button", { name: /Analyze/ }),
  ).not.toBeInTheDocument();
});

test("known successful date claims block upload and open existing inspection", async () => {
  const { gateway } = setup([
    { ...review, receivedAt: "2026-07-02T00:00:00Z", submittedBy: "admin" },
  ]);
  selectFile();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "already has an accepted file",
  );
  expect(screen.getByRole("button", { name: "Import CSV" })).toBeDisabled();
  fireEvent.click(
    screen.getByRole("button", { name: "Review existing import" }),
  );
  await screen.findByRole("heading", { name: "Import complete" });
  expect(gateway.review).toHaveBeenCalledWith("file", false);
  expect(gateway.upload).not.toHaveBeenCalled();
});

test("server duplicate races and partial rejected inspections are reported without success claims", async () => {
  const { gateway, onImported } = setup();
  gateway.upload.mockResolvedValueOnce({
    ...review,
    outcome: "rejected",
    reasonCode: "duplicate-date",
    admittedRecordCount: 0,
    rejectedRecordCount: 10,
  });
  selectFile();
  fireEvent.click(screen.getByLabelText("Confirm reporting date: 2026-07-01"));
  fireEvent.click(screen.getByRole("button", { name: "Import CSV" }));
  await screen.findByRole("heading", { name: "Duplicate reporting date" });
  expect(screen.getByText(/this upload added no rows/)).toBeVisible();
  expect(onImported).toHaveBeenCalledTimes(1);
  gateway.upload.mockResolvedValueOnce({
    ...review,
    outcome: "rejected",
    reasonCode: "invalid-record",
    dataRecordCount: null,
    admittedRecordCount: 0,
    rejectedRecordCount: null,
    inspectionComplete: false,
    diagnostics: [
      {
        code: "invalid-record",
        line: 7,
        field: "Dauer",
        reason: "Invalid duration",
      },
    ],
    diagnosticsTruncated: true,
  });
  selectFile("Hitliste-20260702.csv");
  fireEvent.click(screen.getByLabelText("Confirm reporting date: 2026-07-02"));
  fireEvent.click(screen.getByRole("button", { name: "Import CSV" }));
  await screen.findByRole("heading", { name: "Import rejected" });
  expect(screen.getByText(/partial — counts may be incomplete/)).toBeVisible();
  expect(screen.getByText("Source rows").parentElement).toHaveTextContent(
    "Unknown",
  );
  expect(
    screen.getByRole("table", { name: "Import diagnostics" }),
  ).toHaveTextContent("7DauerInvalid duration");
  expect(screen.getByText(/Only the first diagnostics/)).toBeVisible();
});

test("invalid calendar dates are blocked and interrupted uploads refresh history for recovery", async () => {
  const { gateway, onImported } = setup();
  expect(previewReportingDate("Hitliste-20240229.csv")).toBe("2024-02-29");
  for (const name of [
    "Hitliste-20260229.csv",
    "Hitliste-00000101.csv",
    "Hitliste-20261301.csv",
    "other.csv",
  ])
    expect(previewReportingDate(name)).toBeNull();
  selectFile("Hitliste-20260229.csv");
  expect(screen.getByRole("button", { name: "Import CSV" })).toBeDisabled();
  gateway.upload.mockRejectedValueOnce(new Error("Connection interrupted"));
  selectFile();
  fireEvent.click(screen.getByLabelText("Confirm reporting date: 2026-07-01"));
  fireEvent.click(screen.getByRole("button", { name: "Import CSV" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "review any received attempt",
  );
  expect(onImported).toHaveBeenCalledTimes(1);
});

test("preparation and KPI editors mount separately and load the latest shared profile", async () => {
  const { gateway } = setup();
  expect(gateway.profile).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Data preparation" }));
  fireEvent.click(await screen.findByLabelText("Collapse repeated spaces"));
  fireEvent.click(
    screen.getByRole("button", { name: "Save historical preparation" }),
  );
  await screen.findByText(/Preparation saved/);
  fireEvent.click(screen.getByRole("button", { name: "KPI settings & goals" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Save KPI settings" }),
    ).toBeEnabled(),
  );
  expect(
    screen.queryByText("Save historical preparation"),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Save KPI settings" }));
  await screen.findByText("KPI settings saved.");
  expect(gateway.saveProfile.mock.calls[1][0]).toMatchObject({
    version: "2",
    profile: { normalization: { collapseWhitespace: true } },
  });
});
