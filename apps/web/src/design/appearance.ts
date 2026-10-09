import type { Appearance } from "./identity";
import { appearanceIdentity, variablesForIdentity } from "./identity";

export type AppearancePreference = Appearance | "system";
const storageKey = "iop.appearance";
const listeners = new Set<() => void>();
let preference: AppearancePreference | undefined;
let removeBrowserListeners: (() => void) | undefined;

function isPreference(value: unknown): value is AppearancePreference {
  return value === "light" || value === "dark" || value === "system";
}

function readPreference(): AppearancePreference {
  try {
    const saved = localStorage.getItem(storageKey);
    return isPreference(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

export function appearancePreference(): AppearancePreference {
  return preference ?? readPreference();
}

export function resolvedAppearance(): Appearance {
  const selected = appearancePreference();
  if (selected !== "system") return selected;
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark" : "light";
}

/** A primitive snapshot remains stable between React subscription reads. */
export function appearanceSnapshot(): string {
  return `${appearancePreference()}:${resolvedAppearance()}`;
}

export function applyAppearance() {
  if (typeof document === "undefined") return;
  const mode = resolvedAppearance();
  document.documentElement.dataset.appearance = mode;
  document.documentElement.style.colorScheme = mode;
  for (const [name, value] of Object.entries(
    variablesForIdentity(appearanceIdentity(mode)),
  )) document.documentElement.style.setProperty(name, value);
}

function notify() {
  applyAppearance();
  listeners.forEach((listener) => listener());
}

export function setAppearance(next: AppearancePreference) {
  if (!isPreference(next)) return;
  preference = next;
  try {
    localStorage.setItem(storageKey, next);
  } catch {
    // Keep the active preference for this session when browser storage is unavailable.
  }
  notify();
}

function storageChanged(event: StorageEvent) {
  if (event.key !== storageKey && event.key !== null) return;
  // Storage events describe another tab; re-read instead of retaining this tab's override.
  preference = undefined;
  notify();
}

/** Browser presentation adapter: no feature/domain or remote-preference dependency. */
export function subscribeAppearance(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const systemChanged = () => {
      if (appearancePreference() === "system") notify();
    };
    media?.addEventListener("change", systemChanged);
    window.addEventListener("storage", storageChanged);
    removeBrowserListeners = () => {
      media?.removeEventListener("change", systemChanged);
      window.removeEventListener("storage", storageChanged);
    };
  }
  applyAppearance();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      removeBrowserListeners?.();
      removeBrowserListeners = undefined;
    }
  };
}
