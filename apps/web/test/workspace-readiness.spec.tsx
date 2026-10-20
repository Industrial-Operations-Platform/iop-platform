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
import { AssetsApplication } from "../src/features/assets/application/assets";
import { emptyAsset } from "../src/features/assets/domain/models";
import { ConnectionsApplication } from "../src/features/integrations/application/connections";
import { AssetDomainApplication } from "../src/features/assets-domain/application/domain";
import { LocatorApplication } from "../src/features/asset-locator/application/locator";
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

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});

const profile: ProfileResult = {
  version: "1",
  profile: {
    normalization: { trim: true, unicodeNfc: true, collapseWhitespace: false },
    unclassifiedLabel: "Unclassified",
    areaSectors: [{ area: "Area A", sector: "Sector A" }],
    aliases: [{ field: "area", from: "Area,A", to: "Area A" }],
  },
};
function setup(
  access?: AccessApplication,
  modules: Partial<Pick<Parameters<typeof WorkspaceApp>[0], "assets" | "assetDomain" | "connections" | "locator">> = {},
) {
  const gateway = {
    messages: jest.fn().mockResolvedValue({ values: [], nextCursor: null }),
    context: jest.fn().mockResolvedValue({
      enabled: true,
      canImport: true,
      user: { id: "admin", name: "Administrator", profile: "administrator" },
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
      {...modules}
    />,
  );
  return gateway;
}

function configurationModules() {
  const asset = {
    id: "asset", revision: 1, authorId: "admin", authorName: "Administrator",
    createdAt: "2026-10-01T08:00:00Z", updatedAt: "2026-10-01T08:00:00Z",
    content: { ...emptyAsset(), name: "Assembly conveyor", code: "AS-001" },
  };
  const assetsGateway = {
    context: jest.fn(async () => ({ actorId: "admin", canManage: true, timeZone: "UTC", locations: [] })),
    query: jest.fn(async () => ({ assets: [asset], total: 1, nextCursor: "" })),
    detail: jest.fn(async () => asset),
    history: jest.fn(async () => ({ asset, revisions: [], nextBefore: 0 })),
    timeline: jest.fn(async () => ({ asset, records: [], sources: [], total: 0, nextCursor: "" })),
    equipmentCatalog: jest.fn(), save: jest.fn(),
  };
  const connectionsGateway = { query: jest.fn(async () => ({ connections: [] })), save: jest.fn(), history: jest.fn() };
  const assetDomainGateway = {
    catalog: jest.fn(async () => ({ canManage: true, sourceId: "source", catalog: { revision: 0, types: [] } })),
    references: jest.fn(async () => ({ assets: [], enrichments: [], total: 0, nextCursor: "" })),
  };
  const locatorGateway = {
    context: jest.fn(async () => ({ canManage: true, references: [], referenceDimensions: [], locations: [], componentCatalog: [], coordinateSystem: "Image-local normalized", globalCalibration: "pending" })),
    query: jest.fn(async () => ({ scenes: [], total: 0 })),
  };
  return {
    modules: {
      assets: new AssetsApplication(assetsGateway, () => "new-asset"),
      connections: new ConnectionsApplication(connectionsGateway),
      assetDomain: new AssetDomainApplication(assetDomainGateway as never, () => "new-model"),
      locator: new LocatorApplication(locatorGateway as never, () => "new-scene"),
    },
    assetsGateway, connectionsGateway, assetDomainGateway, locatorGateway,
  };
}

test.each(["team-leader", "task-force"])(
  "%s retains operational asset evidence without configuration even with stale elevated capabilities",
  async (profile) => {
    const fixture = configurationModules();
    setup(new AccessApplication({
      context: jest.fn(async () => ({ enabled: true, authentication: "password" as const, canImport: true, canAdminister: true,
        user: { id: "worker", name: "Worker", profile }, users: [], scope: null })),
      users: jest.fn(async () => []), login: jest.fn(), password: jest.fn(), logout: jest.fn(),
      rename: jest.fn(), update: jest.fn(), activity: jest.fn(async () => []), create: jest.fn(), change: jest.fn(),
    }), fixture.modules);
    await screen.findByRole("heading", { name: "Welcome, Worker" });
    const navigation = within(screen.getByRole("navigation", { name: "Main navigation" }));
    for (const name of ["Asset management", "Integrations", "Data administration", "Users & profiles"])
      expect(navigation.queryByRole("button", { name })).not.toBeInTheDocument();
    fireEvent.click(navigation.getByRole("button", { name: "Assets" }));
    await screen.findByRole("table", { name: "Asset directory" });
    expect(screen.queryByRole("button", { name: "Register asset" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "AS-001" }));
    await screen.findByLabelText("Asset timeline");
    expect(screen.queryByRole("button", { name: "Edit asset" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Model and survey" })).not.toBeInTheDocument();
    fireEvent.click(navigation.getByRole("button", { name: "Asset Locator" }));
    await screen.findByText(/^No scenes are initialized\./);
    expect(screen.queryByRole("button", { name: "Configure scenes" })).not.toBeInTheDocument();
    expect(fixture.connectionsGateway.query).not.toHaveBeenCalled();
    expect(fixture.assetDomainGateway.catalog).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "User menu" }));
    expect(screen.queryByRole("combobox", { name: "Profile view" })).not.toBeInTheDocument();
  },
);

test("Administrator previews suppress configuration routes and restore them on return", async () => {
  const fixture = configurationModules();
  setup(new AccessApplication({
    context: jest.fn(async () => ({ enabled: true, authentication: "password" as const, canImport: true, canAdminister: true,
      user: { id: "admin", name: "Administrator", profile: "administrator" }, users: [], scope: null })),
    users: jest.fn(async () => []), login: jest.fn(), password: jest.fn(), logout: jest.fn(),
    rename: jest.fn(), update: jest.fn(), activity: jest.fn(async () => []), create: jest.fn(), change: jest.fn(),
  }), fixture.modules);
  await screen.findByRole("region", { name: "Administration overview" });
  const navigation = within(screen.getByRole("navigation", { name: "Main navigation" }));
  fireEvent.click(navigation.getByRole("button", { name: "Integrations" }));
  await screen.findByText("No integrations are configured.");
  fireEvent.click(navigation.getByRole("button", { name: "Asset management" }));
  await waitFor(() => expect(fixture.assetDomainGateway.catalog).toHaveBeenCalledTimes(1));
  for (const profile of ["team-leader", "task-force", "technician"]) {
    fireEvent.click(screen.getByRole("button", { name: "User menu" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Profile view" }), { target: { value: profile } });
    await screen.findByRole("region", { name: "Profile preview" });
    for (const name of ["Asset management", "Integrations", "Data administration", "Users & profiles"])
      expect(navigation.queryByRole("button", { name })).not.toBeInTheDocument();
    if (profile !== "technician") {
      fireEvent.click(navigation.getByRole("button", { name: "Assets" }));
      await screen.findByRole("table", { name: "Asset directory" });
      expect(screen.queryByRole("button", { name: "Register asset" })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "AS-001" }));
      await screen.findByLabelText("Asset timeline");
      expect(screen.queryByRole("button", { name: "Edit asset" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Model and survey" })).not.toBeInTheDocument();
      fireEvent.click(navigation.getByRole("button", { name: "Asset Locator" }));
      await screen.findByText(/^No scenes are initialized\./);
      expect(screen.queryByRole("button", { name: "Configure scenes" })).not.toBeInTheDocument();
    }
  }
  expect(fixture.connectionsGateway.query).toHaveBeenCalledTimes(1);
  expect(fixture.assetDomainGateway.catalog).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Return to administration" }));
  await screen.findByRole("region", { name: "Administration overview" });
  expect(navigation.getByRole("button", { name: "Asset management" })).toBeVisible();
  expect(navigation.getByRole("button", { name: "Integrations" })).toBeVisible();
  fireEvent.click(navigation.getByRole("button", { name: "Assets" }));
  await screen.findByRole("button", { name: "Register asset" });
  fireEvent.click(screen.getByRole("button", { name: "AS-001" }));
  await screen.findByRole("button", { name: "Model and survey" });
});

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
        rename: jest.fn(),
        update: jest.fn(),
        activity: jest.fn(async () => []),
        create: jest.fn(),
      }),
    );
    await screen.findByRole("region", { name: "Administration overview" });
    expect(
      screen.getByRole("heading", { name: "Latest file received" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Import files" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Profile view" }),
    ).not.toBeInTheDocument();
    if (canAdminister) {
      fireEvent.click(screen.getByRole("button", { name: "Users & profiles" }));
      await screen.findByRole("heading", { name: "Users & profiles" });
      await waitFor(() => expect(users).toHaveBeenCalledTimes(2));
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
    await screen.findByRole("heading", { name: "Data analysis" });
    expect(
      screen.getByRole("button", { name: "Data administration" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "User menu" }));
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
      if (!screen.queryByRole("combobox", { name: "Profile view" })) {
        fireEvent.click(screen.getByRole("button", { name: "User menu" }));
      }
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
      if (value === "technician") {
        expect(
          screen.queryByRole("button", { name: "Open Data Analysis" }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: "Data analysis" }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole("region", { name: "Analytical summary" }),
        ).not.toBeInTheDocument();
      } else {
        fireEvent.click(
          screen.getByRole("button", { name: "Open Data Analysis" }),
        );
        await screen.findByRole("heading", { name: "Data analysis" });
      }
      expect(
        screen.getByRole("region", { name: "Profile preview" }),
      ).toBeVisible();
    }
    expect(login).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
    expect(context).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "User menu" })).toHaveTextContent(
      "A",
    );
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

test("administration landing loads its latest file and analysis retains admin navigation", async () => {
  const gateway = setup();
  await screen.findByRole("region", { name: "Administration overview" });
  expect(gateway.history).toHaveBeenCalledTimes(1);
  expect(gateway.profile).not.toHaveBeenCalled();
  expect(gateway.report).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Data analysis" }));
  await waitFor(() => expect(gateway.report).toHaveBeenCalled());
  expect(gateway.history).toHaveBeenCalledTimes(1);
  expect(
    screen.getByRole("button", { name: "Data administration" }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Data administration" }));
  await screen.findByRole("heading", { name: "Add a daily CSV" });
  await waitFor(() => expect(gateway.history).toHaveBeenCalledTimes(2));
  const reportCalls = gateway.report.mock.calls.length;
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Refresh history" }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Refresh history" }));
  await waitFor(() => expect(gateway.history).toHaveBeenCalledTimes(3));
  expect(gateway.report).toHaveBeenCalledTimes(reportCalls);
  fireEvent.click(screen.getByRole("button", { name: "IOP · Go to Start" }));
  await screen.findByRole("region", { name: "Administration overview" });
  fireEvent.click(screen.getByRole("button", { name: "Data administration" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Data preparation" }),
  );
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
        users: jest.fn(async () => []),
        login: jest.fn(),
        password: jest.fn(),
        logout: jest.fn(),
        rename: jest.fn(),
        update: jest.fn(),
        activity: jest.fn(async () => []),
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
      rename: jest.fn(),
      update: jest.fn(),
      activity: jest.fn(async () => []),
      login,
      users: jest.fn(async () => []),
      password: jest.fn(),
      create: jest.fn(),
      change: jest.fn(),
    }),
  );
  fireEvent.click(await screen.findByRole("button", { name: "User menu" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Profile view" }), {
    target: { value: "technician" },
  });
  await screen.findByRole("region", { name: "Profile preview" });
  fireEvent.click(screen.getByRole("button", { name: "User menu" }));
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await screen.findByRole("heading", { name: "Bring operations into focus." });
  expect(screen.queryByLabelText("Username")).not.toBeInTheDocument();
  fireEvent.click(within(screen.getByRole("navigation", { name: "Platform navigation" }))
    .getByRole("button", { name: /^Sign in$/ }));
  const accessDialog = await screen.findByRole("dialog", { name: /^Workspace access$/ });
  expect(within(accessDialog).getByRole("heading", { name: "Sign in to IOP" })).toBeVisible();
  fireEvent.change(within(accessDialog).getByLabelText("Username"), {
    target: { value: "admin" },
  });
  fireEvent.change(within(accessDialog).getByLabelText("Password"), {
    target: { value: "test-only-input" },
  });
  fireEvent.click(within(accessDialog).getByRole("button", { name: /^Sign in$/ }));
  await screen.findByRole("region", { name: "Administration overview" });
  expect(
    screen.queryByRole("region", { name: "Profile preview" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Users & profiles" }),
  ).toBeVisible();
});

test("Technician home has no analytical entry points or requests", async () => {
  const gateway = setup(
    new AccessApplication({
      context: jest.fn().mockResolvedValue({
        enabled: true,
        authentication: "password",
        canImport: false,
        canReadAnalytics: false,
        user: { id: "tech", name: "Technician", profile: "technician" },
        users: [],
        scope: null,
      }),
      users: jest.fn(async () => []),
      login: jest.fn(),
      password: jest.fn(),
      logout: jest.fn(),
      rename: jest.fn(),
      update: jest.fn(),
      activity: jest.fn(async () => []),
      create: jest.fn(),
      change: jest.fn(),
    }),
  );
  await screen.findByRole("heading", { name: "Welcome, Technician" });
  expect(
    screen.queryByRole("button", { name: "Data analysis" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Open Data Analysis" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("region", { name: "Analytical summary" }),
  ).not.toBeInTheDocument();
  expect(gateway.availability).not.toHaveBeenCalled();
  expect(gateway.report).not.toHaveBeenCalled();
});
