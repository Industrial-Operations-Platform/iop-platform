import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ProfileEditor } from "../src/features/analysis/adapters/react/ProfileEditor";
import { AnalysisWorkspace, type AnalysisGateway } from "../src/features/analysis/application/workspace";
import type { ProfileResult } from "../src/features/analysis/domain/models";

test("administrators save and remove exact exclusions without overwriting goals, corrections or mappings", async () => {
  let value: ProfileResult = { version: "v1", profile: {
    normalization: { trim: true, unicodeNfc: true, collapseWhitespace: true }, unclassifiedLabel: "Unknown",
    aliases: [{ field: "message", from: "Raw", to: "Prepared" }], areaSectors: [{ area: "A", sector: "Hall" }],
    executiveKpis: [{ id: "jam", label: "Jam", message: "Jam", metric: "frequency", goal: 10 }],
  } };
  const original = value.profile;
  const gateway = { profile: jest.fn(async () => value),
    messages: jest.fn(async () => ({ values: ["External, alarm", "Jam"], nextCursor: null })),
    saveProfile: jest.fn(async (next: ProfileResult) => { value = { ...next, version: "v2" }; return value; }),
  };
  const application = new AnalysisWorkspace(gateway as unknown as AnalysisGateway);
  const onSaved = jest.fn();
  const view = render(<ProfileEditor application={application} onSaved={onSaved} />);
  fireEvent.click(await screen.findByRole("button", { name: "Add exclusion" }));
  expect(screen.getByRole("button", { name: "Save historical preparation" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Excluded value 1"), { target: { value: "External, alarm" } });
  fireEvent.click(screen.getByRole("button", { name: "Save historical preparation" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  expect(gateway.saveProfile).toHaveBeenCalledWith({ version: "v1", profile: {
    ...original, excludedValues: [{ field: "message", value: "External, alarm" }],
  } });
  view.unmount();
  render(<ProfileEditor application={application} onSaved={onSaved} />);
  expect(await screen.findByLabelText("Excluded value 1")).toHaveValue("External, alarm");
  fireEvent.click(screen.getByRole("button", { name: "Remove exclusion 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Save historical preparation" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(2));
  expect(value.profile.excludedValues).toEqual([]);
  expect(value.profile.executiveKpis).toEqual(original.executiveKpis);
});
