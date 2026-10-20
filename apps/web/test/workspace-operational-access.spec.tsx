import type { ComponentProps } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { WorkspaceApp } from "../src/host/WorkspaceApp";
import { AnalysisWorkspace, type AnalysisGateway } from "../src/features/analysis/application/workspace";
import type { Target } from "../src/features/operational-overview/domain/models";
import type { JournalView } from "../src/features/shift-handover/adapters/react/HandoverViewNavigation";

jest.mock("../src/host/ActivityNotifications", () => ({ ActivityNotifications: () => null }));
jest.mock("../src/features/shift-handover/adapters/react/InformationNotices", () => ({ InformationNotices: () => null }));
jest.mock("../src/features/shift-handover/adapters/react/HandoverHighlights", () => ({ HandoverHighlights: () => null }));
jest.mock("../src/features/analysis/adapters/react/StartOverview", () => ({ StartOverview: () => <h1>Operational home</h1> }));
jest.mock("../src/host/AdministrationOverview", () => ({ AdministrationOverview: () => <h1>Administrator home</h1> }));
jest.mock("../src/features/operational-overview/adapters/react/GlobalSearch", () => ({
  GlobalSearch: ({ onNavigate }: { onNavigate: (target: Target) => void }) => <>
    <button onClick={() => onNavigate({ source: "assets", id: "search-exact-asset", locationId: "area" })}>Search asset target</button>
    <button onClick={() => onNavigate({ source: "shift", id: "actual-shift-record", locationId: "area" })}>Search actual shift target</button>
  </>,
}));
jest.mock("../src/features/operational-overview/adapters/react/AreaOverview", () => ({
  AreaOverview: ({ onNavigate }: { onNavigate: (target: Target) => void }) => <button onClick={() => onNavigate({ source: "assets", id: "area-exact-asset", locationId: "area" })}>Area asset target</button>,
}));
jest.mock("../src/features/improvement-tracking/adapters/react/ImprovementWorkspace", () => ({
  ImprovementWorkspace: ({ onOpenAsset }: { onOpenAsset?: (id: string) => void }) => <button onClick={() => onOpenAsset?.("action-exact-asset")}>Action asset target</button>,
}));
jest.mock("../src/features/maintenance/adapters/react/MaintenanceWorkspace", () => ({
  MaintenanceWorkspace: ({ onOpenAsset }: { onOpenAsset?: (id: string) => void }) => <button onClick={() => onOpenAsset?.("maintenance-exact-asset")}>Maintenance asset target</button>,
}));
jest.mock("../src/features/assets/adapters/react/AssetsWorkspace", () => ({
  AssetsWorkspace: ({ initialAssetId, onManageModel }: { initialAssetId?: string; onManageModel?: (id: string) => void }) => <section aria-label="Standalone asset view" data-asset={initialAssetId}>
    <h1>Digital Asset Record test boundary</h1><button onClick={() => onManageModel?.(initialAssetId ?? "")}>Manage asset model</button>
  </section>,
}));
jest.mock("../src/features/assets-domain/adapters/react/AssetDomainWorkspace", () => ({
  AssetDomainWorkspace: () => <h1>Asset management test boundary</h1>,
}));
jest.mock("../src/features/asset-locator/adapters/react/LocatorWorkspace", () => ({
  LocatorWorkspace: ({ initialAssetId, homeVisit, readOnly, onAsset, onCreateAsset }: { initialAssetId?: string; homeVisit?: number; readOnly?: boolean; onAsset?: (id: string) => void; onCreateAsset?: () => void }) =>
    <section aria-label="Locator view" data-asset={initialAssetId} data-readonly={String(readOnly)} data-visit={homeVisit}>
      <h1>Locator test boundary</h1>{onAsset && <button onClick={() => onAsset(initialAssetId ?? "")}>Open standalone asset</button>}
      {onCreateAsset && <button onClick={onCreateAsset}>Register new installation</button>}
    </section>,
}));
jest.mock("../src/features/shift-handover/adapters/react/HandoverWorkspace", () => ({
  HandoverWorkspace: ({ initialView = "meeting", initialEntry, onShiftRecords }: { initialView?: JournalView; initialEntry?: string; onShiftRecords?: () => void }) =>
    <section aria-label="Journal view" data-view={initialView} data-entry={initialEntry}><h1>Journal test boundary</h1>
      {onShiftRecords && <button onClick={onShiftRecords}>Shift records</button>}
    </section>,
}));
jest.mock("../src/features/shift-handover/adapters/react/FormalHandoverWorkspace", () => ({
  FormalHandoverWorkspace: ({ initialRecordId, onJournalView, onEntry }: { initialRecordId?: string; onJournalView?: (view: JournalView) => void; onEntry?: (id: string) => void }) =>
    <section aria-label="Shift record view" data-record={initialRecordId}><h1>Shift record test boundary</h1>
      <button onClick={() => onJournalView?.("journal")}>Return to Journal</button>
      <button onClick={() => onEntry?.("retained-exact-report")}>Open retained journal report</button>
    </section>,
}));

beforeAll(() => { window.scrollTo = jest.fn(); });

function fixture(profile: string) {
  const context = { enabled: true, authentication: "password", canImport: profile === "administrator", canAdminister: false, canReadAnalytics: false,
    user: { id: "actor", name: "Test actor", profile }, users: [], scope: { organizationId: "org", siteId: "site", sourceId: "source", siteTimeZone: "UTC" } };
  const gateway = { context: jest.fn(async () => context) } as unknown as AnalysisGateway;
  type Props = ComponentProps<typeof WorkspaceApp>;
  const props = { application: new AnalysisWorkspace(gateway), handover: {}, maintenance: {}, assets: {}, assetDomain: {}, overview: {}, locator: {}, formalHandover: {}, improvements: {} } as Props;
  render(<WorkspaceApp {...props} />);
}

test.each(["team-leader", "task-force"])("%s routes search, Area, Maintenance and Tracking asset identities to reader Locator", async profile => {
  fixture(profile);
  await screen.findByRole("heading", { name: "Operational home" });
  const navigation = within(screen.getByRole("navigation", { name: "Main navigation" }));
  for (const label of ["Assets", "Asset management", "Formal Handover"])
    expect(navigation.queryByRole("button", { name: label })).not.toBeInTheDocument();
  expect(navigation.getByRole("button", { name: "Asset Locator" })).toBeVisible();
  for (const [section, target, id] of [
    ["", "Search asset target", "search-exact-asset"],
    ["Area overview", "Area asset target", "area-exact-asset"],
    ["Maintenance", "Maintenance asset target", "maintenance-exact-asset"],
    ["Improvements", "Action asset target", "action-exact-asset"],
  ]) {
    if (section) fireEvent.click(navigation.getByRole("button", { name: section }));
    fireEvent.click(screen.getByRole("button", { name: target }));
    const locator = screen.getByRole("region", { name: "Locator view" });
    expect(locator).toHaveAttribute("data-asset", id);
    expect(locator).toHaveAttribute("data-readonly", "true");
    expect(screen.queryByRole("button", { name: "Open standalone asset" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Register new installation" })).not.toBeInTheDocument();
  }
});

test.each(["administrator", "team-leader", "task-force"])("%s retains exact shift/report links under the single Shift Handover sidebar entry", async profile => {
  fixture(profile);
  const navigation = within(await screen.findByRole("navigation", { name: "Main navigation" }));
  await screen.findByRole("button", { name: "Shift Handover" });
  fireEvent.click(screen.getByRole("button", { name: "Search actual shift target" }));
  expect(screen.getByRole("region", { name: "Shift record view" })).toHaveAttribute("data-record", "actual-shift-record");
  expect(navigation.getByRole("button", { name: "Shift Handover" })).toHaveAttribute("aria-current", "page");
  expect(navigation.queryByRole("button", { name: "Formal Handover" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Return to Journal" }));
  expect(screen.getByRole("region", { name: "Journal view" })).toHaveAttribute("data-view", "journal");
  fireEvent.click(screen.getByRole("button", { name: "Shift records" }));
  expect(screen.getByRole("region", { name: "Shift record view" })).toHaveAttribute("data-record", "");
  fireEvent.click(screen.getByRole("button", { name: "Open retained journal report" }));
  expect(screen.getByRole("region", { name: "Journal view" })).toHaveAttribute("data-entry", "retained-exact-report");
});

test("Administrator keeps standalone management and the Locator new-installation shortcut, while reader preview removes both", async () => {
  fixture("administrator");
  await screen.findByRole("heading", { name: "Administrator home" });
  const navigation = within(screen.getByRole("navigation", { name: "Main navigation" }));
  expect(navigation.getByRole("button", { name: "Assets" })).toBeVisible();
  expect(navigation.getByRole("button", { name: "Asset management" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Search asset target" }));
  expect(screen.getByRole("region", { name: "Standalone asset view" })).toHaveAttribute("data-asset", "search-exact-asset");
  fireEvent.click(navigation.getByRole("button", { name: "Asset Locator" }));
  expect(screen.getByRole("region", { name: "Locator view" })).toHaveAttribute("data-readonly", "false");
  fireEvent.click(screen.getByRole("button", { name: "Register new installation" }));
  expect(screen.getByRole("region", { name: "Standalone asset view" })).toHaveAttribute("data-asset", "");
  fireEvent.click(screen.getByRole("button", { name: "User menu" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Profile view" }), { target: { value: "team-leader" } });
  expect(navigation.queryByRole("button", { name: "Assets" })).not.toBeInTheDocument();
  expect(navigation.queryByRole("button", { name: "Asset management" })).not.toBeInTheDocument();
  fireEvent.click(navigation.getByRole("button", { name: "Asset Locator" }));
  expect(screen.getByRole("region", { name: "Locator view" })).toHaveAttribute("data-readonly", "true");
  expect(screen.queryByRole("button", { name: "Open standalone asset" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Register new installation" })).not.toBeInTheDocument();
});

test("Technician retains ordinary journal navigation without the new advanced destinations", async () => {
  fixture("technician");
  await screen.findByRole("heading", { name: "Operational home" });
  const navigation = within(screen.getByRole("navigation", { name: "Main navigation" }));
  for (const label of ["Assets", "Asset management", "Asset Locator", "Improvements", "Formal Handover"])
    expect(navigation.queryByRole("button", { name: label })).not.toBeInTheDocument();
  fireEvent.click(navigation.getByRole("button", { name: "Shift Handover" }));
  expect(screen.getByRole("region", { name: "Journal view" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Shift records" })).not.toBeInTheDocument();
});
