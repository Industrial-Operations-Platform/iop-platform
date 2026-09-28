import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  AnalysisWorkspace,
  type AnalysisGateway,
} from "../src/features/analysis/application/workspace";
import { WorkspaceApp } from "../src/host/WorkspaceApp";

jest.mock("../src/design/components/components.css", () => ({}));
jest.mock("../src/features/access/adapters/react/access.css", () => ({}));

jest.mock("../src/features/analysis/adapters/react/workspace.css", () => ({}));
jest.mock("../src/features/analysis/adapters/echarts/charts", () => ({
  mountChart: jest.fn(),
  number: String,
}));

test("an API startup failure can be retried without reloading or submitting any data", async () => {
  const context = jest
    .fn()
    .mockRejectedValueOnce(new Error("Backend unavailable"))
    .mockResolvedValueOnce({
      enabled: true,
      canImport: false,
      users: [{ id: "reader", name: "Analyst" }],
      user: null,
      scope: null,
    });
  const gateway = { context } as unknown as AnalysisGateway;
  render(<WorkspaceApp application={new AnalysisWorkspace(gateway)} />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Backend unavailable",
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Retry connection" }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Retry connection" }));
  expect(
    await screen.findByRole("option", { name: "Analyst" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(context).toHaveBeenCalledTimes(2);
});
