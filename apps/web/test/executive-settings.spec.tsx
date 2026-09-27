import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ExecutiveSettings } from "../src/features/analysis/adapters/react/ExecutiveSettings";
import { ComparisonCard } from "../src/design/components";
import {
  AnalysisWorkspace,
  type AnalysisGateway,
} from "../src/features/analysis/application/workspace";
import type { ProfileResult } from "../src/features/analysis/domain/models";

jest.mock("../src/design/components/components.css", () => ({}));
const saved: ProfileResult = {
  version: "old",
  profile: {
    normalization: { trim: true, unicodeNfc: true, collapseWhitespace: false },
    unclassifiedLabel: "Unknown",
    areaSectors: [{ area: "A", sector: "Hall" }],
    aliases: [],
    executiveKpis: [
      { id: "jam", label: "Jam", message: "Jam", metric: "frequency", goal: 5 },
    ],
  },
};
function setup() {
  const gateway = {
    profile: jest.fn().mockResolvedValue(saved),
    saveProfile: jest.fn().mockImplementation(async (value: ProfileResult) => ({
      ...value,
      version: "new",
    })),
  };
  const onSaved = jest.fn();
  render(
    <ExecutiveSettings
      application={new AnalysisWorkspace(gateway as unknown as AnalysisGateway)}
      messages={["Jam", "Müll, L5/6"]}
      onSaved={onSaved}
    />,
  );
  fireEvent.click(screen.getByText("KPI settings & goals"));
  return { gateway, onSaved };
}
test("administrator selects an exact message and saves a goal without overwriting preparation", async () => {
  const { gateway, onSaved } = setup();
  fireEvent.change(await screen.findByLabelText("Meldetext 1"), {
    target: { value: "Müll, L5/6" },
  });
  fireEvent.change(screen.getByLabelText("Goal 1"), { target: { value: "0" } });
  fireEvent.click(screen.getByRole("button", { name: "Save KPI settings" }));
  await screen.findByText("KPI settings saved.");
  expect(gateway.saveProfile).toHaveBeenCalledWith({
    ...saved,
    profile: {
      ...saved.profile,
      executiveKpis: [
        { ...saved.profile.executiveKpis![0], message: "Müll, L5/6", goal: 0 },
      ],
    },
  });
  expect(onSaved).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText("Measure 1"), {
    target: { value: "duration" },
  });
  expect(screen.getByLabelText("Goal 1")).toHaveValue(null);
  expect(screen.queryByText("KPI settings saved.")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Save KPI settings" }));
  await waitFor(() =>
    expect(gateway.saveProfile).toHaveBeenLastCalledWith(
      expect.objectContaining({
        version: "new",
        profile: expect.objectContaining({
          executiveKpis: [
            expect.objectContaining({ metric: "duration", goal: null }),
          ],
        }),
      }),
    ),
  );
});
test("failed saves retain edits and reload restores the saved profile", async () => {
  const { gateway, onSaved } = setup();
  fireEvent.change(await screen.findByLabelText("Label 1"), {
    target: { value: "Edited" },
  });
  gateway.saveProfile.mockRejectedValueOnce(new Error("Stale version"));
  fireEvent.click(screen.getByRole("button", { name: "Save KPI settings" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Label 1")).toHaveValue("Edited");
  expect(onSaved).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Reload saved settings" }),
  );
  await waitFor(() =>
    expect(screen.getByLabelText("Label 1")).toHaveValue("Jam"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Remove KPI 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Save KPI settings" }));
  await screen.findByText("KPI settings saved.");
  expect(gateway.saveProfile).toHaveBeenLastCalledWith(
    expect.objectContaining({
      profile: expect.objectContaining({ executiveKpis: [] }),
    }),
  );
});
test("shared comparison cards expose textual meaning as well as semantic color state", () => {
  render(
    <ComparisonCard
      label="Jam"
      value="3"
      state="better"
      comparison="Below reference · -25%"
    >
      <small>Goal: 4 occurrences/day</small>
    </ComparisonCard>,
  );
  expect(screen.getByText("Below reference · -25%")).toBeVisible();
  expect(screen.getByText("Goal: 4 occurrences/day")).toBeVisible();
  expect(screen.getByText("3").closest("section")).toHaveAttribute(
    "data-state",
    "better",
  );
});

test("administrators add selected Meldetext cards up to the supported limit", async () => {
  const { gateway } = setup();
  await screen.findByLabelText("Meldetext 1");
  fireEvent.click(screen.getByRole("button", { name: "Add KPI" }));
  fireEvent.change(screen.getByLabelText("Meldetext 2"), {
    target: { value: "Müll, L5/6" },
  });
  fireEvent.change(screen.getByLabelText("Label 2"), {
    target: { value: "Selected error" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save KPI settings" }));
  await screen.findByText("KPI settings saved.");
  expect(gateway.saveProfile).toHaveBeenCalledWith(
    expect.objectContaining({
      profile: expect.objectContaining({
        executiveKpis: [
          saved.profile.executiveKpis![0],
          expect.objectContaining({
            id: expect.any(String),
            message: "Müll, L5/6",
            label: "Selected error",
            goal: null,
          }),
        ],
      }),
    }),
  );
  for (let index = 2; index < 8; index++)
    fireEvent.click(screen.getByRole("button", { name: "Add KPI" }));
  expect(screen.getByRole("button", { name: "Add KPI" })).toBeDisabled();
});
