import { cleanup, fireEvent, render, screen, act } from "@testing-library/react";
import { AppearanceControl } from "../src/design/AppearanceControl";
import { IdentityRoot } from "../src/design/components";
import { identity, darkIdentity } from "../src/design/identity";
import { subscribeAppearance } from "../src/design/appearance";

let dark = false;
const mediaListeners = new Set<() => void>();

beforeEach(() => {
  dark = false;
  mediaListeners.clear();
  Object.defineProperty(window, "matchMedia", { configurable: true, value: jest.fn(() => ({
    get matches() { return dark; },
    addEventListener: (_: string, listener: () => void) => mediaListeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => mediaListeners.delete(listener),
  })) });
  localStorage.clear();
  const unsubscribe = subscribeAppearance(() => {});
  window.dispatchEvent(new StorageEvent("storage", { key: null }));
  unsubscribe();
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

function mount() {
  return render(<IdentityRoot data-testid="identity"><AppearanceControl /></IdentityRoot>);
}

function changeSystem(next: boolean) {
  act(() => {
    dark = next;
    mediaListeners.forEach((listener) => listener());
  });
}

test("system appearance follows the device; an explicit choice survives subsequent device changes", () => {
  mount();
  const selector = screen.getByRole("combobox", { name: "Appearance" });
  expect(selector).toHaveValue("system");
  changeSystem(true);
  expect(screen.getByTestId("identity")).toHaveAttribute("data-appearance", "dark");
  expect(document.documentElement.style.colorScheme).toBe("dark");
  fireEvent.change(selector, { target: { value: "light" } });
  changeSystem(false);
  changeSystem(true);
  expect(screen.getByTestId("identity")).toHaveAttribute("data-appearance", "light");
  expect(localStorage.getItem("iop.appearance")).toBe("light");
  fireEvent.change(selector, { target: { value: "system" } });
  expect(screen.getByTestId("identity")).toHaveAttribute("data-appearance", "dark");
});

test("saved appearance restores and other tabs can update or clear it without remounting", () => {
  localStorage.setItem("iop.appearance", "dark");
  mount();
  expect(screen.getByRole("combobox", { name: "Appearance" })).toHaveValue("dark");
  expect(screen.getByTestId("identity").style.getPropertyValue("--iop-surface")).toBe(darkIdentity.surface);
  act(() => {
    localStorage.setItem("iop.appearance", "light");
    window.dispatchEvent(new StorageEvent("storage", { key: "iop.appearance", newValue: "light" }));
  });
  expect(screen.getByTestId("identity")).toHaveAttribute("data-appearance", "light");
  act(() => {
    localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
  expect(screen.getByRole("combobox", { name: "Appearance" })).toHaveValue("system");
});

test("invalid saved values fall back to system and blocked storage keeps a usable session preference", () => {
  localStorage.setItem("iop.appearance", "invalid");
  mount();
  expect(screen.getByRole("combobox", { name: "Appearance" })).toHaveValue("system");
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Blocked"); });
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Blocked"); });
  fireEvent.change(screen.getByRole("combobox", { name: "Appearance" }), { target: { value: "dark" } });
  expect(screen.getByTestId("identity")).toHaveAttribute("data-appearance", "dark");
});

test("closing a selector keeps the remaining root subscribed and the last unmount releases browser listeners", () => {
  const root = render(<IdentityRoot data-testid="root" />);
  const control = render(<AppearanceControl />);
  expect(mediaListeners.size).toBe(1);
  control.unmount();
  act(() => {
    localStorage.setItem("iop.appearance", "dark");
    window.dispatchEvent(new StorageEvent("storage", { key: "iop.appearance" }));
  });
  expect(screen.getByTestId("root")).toHaveAttribute("data-appearance", "dark");
  root.unmount();
  expect(mediaListeners.size).toBe(0);
});

function luminance(hex: string) {
  const channels = [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

test.each([identity, darkIdentity])("semantic text roles remain readable on their intended surfaces", (tokens) => {
  for (const [foreground, background] of [
    [tokens.ink, tokens.canvas], [tokens.muted, tokens.canvas],
    [tokens.muted, tokens.surface], [tokens.onPrimary, tokens.primary],
    [tokens.onPrimary, tokens.primaryHover], [tokens.link, tokens.surface],
    [tokens.activeInk, tokens.activeSurface], [tokens.successInk, tokens.successSurface],
    [tokens.warningInk, tokens.warningSurface], [tokens.errorInk, tokens.errorSurface],
    [tokens.onAttention, tokens.errorInk], [tokens.chartText, tokens.surface],
  ]) {
    const [low, high] = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
    expect({ foreground, background, readable: (high + 0.05) / (low + 0.05) >= 4.5 })
      .toEqual({ foreground, background, readable: true });
  }
  for (const background of [tokens.surface, tokens.canvas]) {
    const [low, high] = [luminance(tokens.focus), luminance(background)].sort((a, b) => a - b);
    expect((high + 0.05) / (low + 0.05)).toBeGreaterThanOrEqual(3);
  }
});
