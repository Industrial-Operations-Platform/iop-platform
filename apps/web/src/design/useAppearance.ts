import { useSyncExternalStore } from "react";
import {
  appearanceSnapshot,
  subscribeAppearance,
  type AppearancePreference,
} from "./appearance";
import type { Appearance } from "./identity";

export function useAppearance() {
  const snapshot = useSyncExternalStore(subscribeAppearance, appearanceSnapshot);
  const [preference, resolved] = snapshot.split(":") as [
    AppearancePreference,
    Appearance,
  ];
  return { preference, resolved };
}
