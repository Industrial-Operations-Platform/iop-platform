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
import { WorkspaceApp } from "../src/host/WorkspaceApp";
import { AccessApplication } from "../src/features/access/application/access";
import type {
  ProfileResult,
  Report,
  ReportRequest,
} from "../src/features/analysis/domain/models";

jest.mock("../src/design/components/components.css", () => ({}));
jest.mock("../src/features/access/adapters/react/access.css", () => ({}));
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
function setup(access?: AccessApplication) {
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
      access={access}
    />,
  );
  return gateway;
}

test.each([true, false])(
  "administration defaults respect capabilities and profile preview (canAdminister=%s)",
  async (canAdminister) => {
    const users = jest.fn().mockResolvedValue([]);
    const context = jest.fn().mockResolvedValue({
      enabled: true,
      authentication: "password",
      canImport: true,
      canAdminister,
      user: { id: "admin", name: "Administrator", profile: "administrator" },
      users: [],
      scope: null,
    });
    const login = jest.fn();
    const change = jest.fn();
    setup(
      new AccessApplication({
        context,
        users,
        login,
        change,
        password: jest.fn(),
        logout: jest.fn(),
        create: jest.fn(),
      }),
    );
    await screen.findByRole("region", { name: "Administration overview" });
    expect(screen.getByRole("button", { name: "Import files" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Data preparation" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "KPI settings & goals" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("combobox", { name: "Profile view" }),
    ).not.toBeInTheDocument();
    if (canAdminister) {
      fireEvent.click(screen.getByRole("button", { name: "Manage users" }));
      await screen.findByRole("heading", { name: "Users & profiles" });
      await waitFor(() => expect(users).toHaveBeenCalledTimes(1));
    } else {
      expect(
        screen.queryByRole("button", { name: "Users & profiles" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Manage users" }),
      ).not.toBeInTheDocument();
      expect(users).not.toHaveBeenCalled();
    }
    fireEvent.click(screen.getByRole("button", { name: "Data analysis" }));
    await screen.findByText("Operations · Data Analysis");
    expect(
      screen.getByRole("button", { name: "Data administration" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "View as" }));
    expect(
      within(screen.getByRole("combobox", { name: "Profile view" }))
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Administrator", "Technician", "Task Force", "Team Leader"]);
    for (const [value, label] of [
      ["technician", "Technician"],
      ["task-force", "Task Force"],
      ["team-leader", "Team Leader"],
    ]) {
      fireEvent.change(screen.getByRole("combobox", { name: "Profile view" }), {
        target: { value },
      });
      await screen.findByRole("region", { name: "Start page" });
      expect(
        screen.getByRole("region", { name: "Profile preview" }),
      ).toHaveTextContent(`Viewing as ${label}`);
      expect(screen.getByText(`Profile: ${label}`)).toBeVisible();
      expect(
        screen.queryByRole("button", { name: "Users & profiles" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Data administration" }),
      ).not.toBeInTheDocument();
      fireEvent.click(
        screen.getByRole("button", { name: "Open Data Analysis" }),
      );
      await screen.findByText("Operations · Data Analysis");
      expect(
        screen.getByRole("region", { name: "Profile preview" }),
      ).toBeVisible();
    }
    expect(login).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
    expect(context).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Administrator · Administrator")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Return to administration" }),
    );
    await screen.findByRole("region", { name: "Administration overview" });
    expect(
      screen.queryByRole("region", { name: "Profile preview" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Data administration" }),
    );
    await screen.findByRole("heading", { name: "Add a daily CSV" });
  },
);

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
  fireEvent.click(
    await screen.findByRole("button", { name: "Data administration" }),
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

test("administration landing exposes tools without eagerly loading data and analysis retains admin navigation", async () => {
  const gateway = setup();
  await screen.findByRole("region", { name: "Administration overview" });
  expect(gateway.history).not.toHaveBeenCalled();
  expect(gateway.profile).not.toHaveBeenCalled();
  expect(gateway.report).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Data analysis" }));
  await waitFor(() => expect(gateway.report).toHaveBeenCalled());
  expect(gateway.history).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: "Data administration" }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Data administration" }));
  await screen.findByRole("heading", { name: "Add a daily CSV" });
  await waitFor(() => expect(gateway.history).toHaveBeenCalledTimes(1));
  const reportCalls = gateway.report.mock.calls.length;
  fireEvent.click(screen.getByRole("button", { name: "Refresh history" }));
  await waitFor(() => expect(gateway.history).toHaveBeenCalledTimes(2));
  expect(gateway.report).toHaveBeenCalledTimes(reportCalls);
  fireEvent.click(screen.getByRole("button", { name: "IOP · Go to Start" }));
  await screen.findByRole("region", { name: "Administration overview" });
  fireEvent.click(screen.getByRole("button", { name: "Data preparation" }));
  await screen.findByRole("button", { name: "Save historical preparation" });
});

test("administration works before the first import without analytical requests", async () => {
  const gateway = setup();
  gateway.availability.mockResolvedValue({ dates: [] });
  fireEvent.click(
    await screen.findByRole("button", { name: "Data administration" }),
  );
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

test.each(["technician", "task-force", "team-leader"])(
  "%s keeps its operational home without admin tools",
  async (profile) => {
    setup(
      new AccessApplication({
        context: jest.fn().mockResolvedValue({
          enabled: true,
          authentication: "password",
          canImport: false,
          canAdminister: false,
          user: { id: "worker", name: "Worker", profile },
          users: [],
          scope: null,
        }),
        users: jest.fn(),
        login: jest.fn(),
        password: jest.fn(),
        logout: jest.fn(),
        create: jest.fn(),
        change: jest.fn(),
      }),
    );
    await screen.findByRole("heading", { name: "Welcome, Worker" });
    expect(
      screen.queryByRole("button", { name: "View as" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Data administration" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Users & profiles" }),
    ).not.toBeInTheDocument();
  },
);

test("signing out of a preview restores the next administrator session to administration", async () => {
  const admin = {
    enabled: true,
    authentication: "password" as const,
    canImport: true,
    canAdminister: true,
    user: { id: "admin", name: "Administrator", profile: "administrator" },
    users: [],
    scope: null,
  };
  const context = jest.fn().mockResolvedValue(admin);
  const logout = jest.fn().mockImplementation(async () => {
    context.mockResolvedValue({
      ...admin,
      user: null,
      canImport: false,
      canAdminister: false,
    });
  });
  const login = jest.fn().mockImplementation(async () => {
    context.mockResolvedValue(admin);
  });
  setup(
    new AccessApplication({
      context,
      logout,
      login,
      users: jest.fn(),
      password: jest.fn(),
      create: jest.fn(),
      change: jest.fn(),
    }),
  );
  fireEvent.click(await screen.findByRole("button", { name: "View as" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Profile view" }), {
    target: { value: "technician" },
  });
  await screen.findByRole("region", { name: "Profile preview" });
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await screen.findByRole("heading", { name: "Sign in to IOP" });
  fireEvent.change(screen.getByLabelText("Username"), {
    target: { value: "admin" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "test-only-input" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  await screen.findByRole("region", { name: "Administration overview" });
  expect(
    screen.queryByRole("region", { name: "Profile preview" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Users & profiles" }),
  ).toBeVisible();
});
