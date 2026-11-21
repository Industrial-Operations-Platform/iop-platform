import { act, fireEvent, render, screen } from "@testing-library/react";
import { AnalysisWorkspace, type AnalysisGateway } from "../src/features/analysis/application/workspace";
import { EquipmentSearch } from "../src/features/analysis/adapters/react/EquipmentSearch";
import type { EquipmentSearchResult } from "../src/features/analysis/domain/models";

jest.mock("../src/design/components/components.css", () => ({}));
const choice = { code: "SENSOR-1", sector: "Hall A", area: "Area A" };
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  Element.prototype.scrollIntoView = jest.fn();
});
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
function setup(equipment: jest.Mock) {
  const onSelect = jest.fn(), onClose = jest.fn(), report = jest.fn();
  const application = new AnalysisWorkspace({ equipment, report } as unknown as AnalysisGateway);
  render(<EquipmentSearch application={application} months={["2026-11"]} onSelect={onSelect} onClose={onClose} />);
  return { input: screen.getByRole("combobox"), onSelect, onClose, report };
}
const debounce = () => act(async () => { jest.advanceTimersByTime(250); });

test("lookup debounces typing, never loads a report and requires explicit keyboard selection", async () => {
  const equipment = jest.fn().mockResolvedValue({ values: [choice, { ...choice, area: "Area B" }], more: false });
  const { input, onSelect, report, onClose } = setup(equipment);
  expect(input).toHaveFocus();
  expect(equipment).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: "S" } });
  fireEvent.change(input, { target: { value: "SENSOR" } });
  expect(equipment).not.toHaveBeenCalled();
  await debounce();
  expect(equipment).toHaveBeenCalledTimes(1);
  expect(equipment).toHaveBeenCalledWith("SENSOR");
  expect(screen.getAllByRole("option")).toHaveLength(2);
  fireEvent.change(input, { target: { value: " SENSOR " } });
  await debounce();
  expect(screen.getAllByRole("option")).toHaveLength(2);
  expect(equipment).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(input, { key: "Enter" });
  expect(onSelect).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: "ArrowUp" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(onSelect).toHaveBeenCalledWith({ ...choice, area: "Area B" });
  expect(report).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Close Find equipment" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("late suggestions cannot replace the current search and clearing does not query", async () => {
  let complete!: (result: EquipmentSearchResult) => void;
  const equipment = jest.fn().mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }))
    .mockResolvedValueOnce({ values: [{ ...choice, code: "NEW" }], more: true });
  const { input } = setup(equipment);
  fireEvent.change(input, { target: { value: "OLD" } });
  await debounce();
  fireEvent.change(input, { target: { value: "NEW" } });
  await debounce();
  await act(async () => { complete({ values: [choice], more: false }); });
  expect(screen.getByRole("option")).toHaveTextContent("NEW");
  expect(screen.queryByText("SENSOR-1")).not.toBeInTheDocument();
  expect(screen.getByText(/Showing the first 20 matches/)).toBeInTheDocument();
  fireEvent.change(input, { target: { value: " " } });
  await debounce();
  expect(equipment).toHaveBeenCalledTimes(2);
  expect(screen.queryAllByRole("option")).toHaveLength(0);
});

test("failed lookup can be retried and empty results do not open an analysis", async () => {
  const equipment = jest.fn().mockRejectedValueOnce(new Error("Unavailable"))
    .mockResolvedValueOnce({ values: [], more: false });
  const { input, onSelect } = setup(equipment);
  fireEvent.change(input, { target: { value: "missing" } });
  await debounce();
  expect(screen.getByRole("alert")).toHaveTextContent("Equipment search could not be loaded");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await debounce();
  expect(screen.getByRole("status")).toHaveTextContent("No equipment matches this code.");
  expect(onSelect).not.toHaveBeenCalled();
});
