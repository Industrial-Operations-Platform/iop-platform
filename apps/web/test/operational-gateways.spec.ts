import { HttpAssetsGateway } from "../src/features/assets/adapters/http/gateway";
import { HttpMaintenanceGateway } from "../src/features/maintenance/adapters/http/gateway";

const previousFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = previousFetch;
});

test("first asset history request supplies the required initial cursor and continuation preserves it", async () => {
  const response = { asset: {}, revisions: [], nextBefore: 23 };
  const fetchMock = jest.fn(async () => ({
    ok: true,
    json: async () => response,
  }));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  const gateway = new HttpAssetsGateway();
  await expect(gateway.history("asset-id")).resolves.toEqual(response);
  await gateway.history("asset-id", 23);
  const requests = fetchMock.mock.calls as unknown as [string, RequestInit][];
  expect(
    requests.map(([url, options]) => [url, JSON.parse(String(options.body))]),
  ).toEqual([
    ["/api/v1/assets/history", { id: "asset-id", before: 0 }],
    ["/api/v1/assets/history", { id: "asset-id", before: 23 }],
  ]);
});

test("operational conflicts explain recovery and omit server diagnostic content", async () => {
  globalThis.fetch = jest.fn(async () => ({
    ok: false,
    json: async () => ({
      code: "maintenance_conflict",
      detail: "private database diagnostic",
    }),
  })) as unknown as typeof fetch;
  await expect(new HttpMaintenanceGateway().query({})).rejects.toThrow(
    "This maintenance record changed. Reload before saving.",
  );
  globalThis.fetch = jest.fn(async () => ({
    ok: false,
    json: async () => ({
      code: "unknown_failure",
      detail: "private database diagnostic",
    }),
  })) as unknown as typeof fetch;
  await expect(new HttpAssetsGateway().context()).rejects.toThrow(
    "Assets are unavailable. Sign in again or retry.",
  );
});
