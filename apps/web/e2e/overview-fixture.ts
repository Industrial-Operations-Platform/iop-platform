import { expect, type Route } from "@playwright/test";
import type { components } from "../src/contracts/schema";

type Context = components["schemas"]["OverviewContextDto"];
type Source = Context["sources"][number]["source"];
type Coverage = Context["sources"][number]["coverage"];

/** Background context only; callers explicitly retain their source/area fixture semantics. */
export function overviewContextFixture(input: {
  locations: Context["locations"];
  timeZone: string;
  today: string;
  coverage: Partial<Record<Source, Coverage>>;
}): Context {
  return {
    locations: input.locations.map(({ id, label, parentId, role }) => ({ id, label, parentId, role })),
    timeZone: input.timeZone,
    today: input.today,
    sources: (["assets", "handover", "maintenance", "analytics", "shifts"] as const)
      .map(source => ({ source, coverage: input.coverage[source] ?? "not-authorized" })),
  };
}

/** This branch cannot accept another method, body or route and never passes through to a real API. */
export async function fulfillOverviewContext(route: Route, context: Context) {
  expect(new URL(route.request().url()).pathname).toBe("/api/v1/overview/context");
  expect(route.request().method()).toBe("POST");
  expect(route.request().postDataJSON()).toEqual({});
  return route.fulfill({ json: context });
}
