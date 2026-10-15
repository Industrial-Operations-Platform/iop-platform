import { HttpAccessGateway } from "../src/features/access/adapters/http/gateway";

const originalFetch = globalThis.fetch;
const connectionMessage = "Connection unavailable. Reconnect to the local API and try again.";

afterEach(() => { globalThis.fetch = originalFetch; });

function respond(status: number, body: string) {
  globalThis.fetch = jest.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(body),
  })) as unknown as typeof fetch;
}

test.each([
  [200, '<html><h1>Proxy fallback</h1></html>'],
  [502, '<html><h1>Bad Gateway</h1></html>'],
  [503, '{"code":"service_unavailable","detail":"private diagnostic"}'],
  [200, ''],
  [200, 'null'],
])("unavailable access responses (%s) produce safe reconnection guidance", async (status, body) => {
  respond(status, body);
  await expect(new HttpAccessGateway().context()).rejects.toThrow(connectionMessage);
});

test("network failures produce safe guidance and a later request can recover", async () => {
  globalThis.fetch = jest.fn(async () => { throw new TypeError("private network diagnostic"); });
  const gateway = new HttpAccessGateway();
  await expect(gateway.context()).rejects.toThrow(connectionMessage);
  const context = { enabled: true, authentication: "password", users: [], user: null, scope: null, canImport: false };
  respond(200, JSON.stringify(context));
  await expect(gateway.context()).resolves.toEqual(context);
});

test("invalid credentials retain the actionable sign-in error", async () => {
  respond(401, '{"code":"invalid_credentials"}');
  await expect(new HttpAccessGateway().login("alex", "incorrect"))
    .rejects.toThrow("The username or password is incorrect.");
});

test("access directory reads preserve valid JSON collections", async () => {
  const users = [{ id: "alex", name: "Alex Morgan", profile: "technician", active: true }];
  respond(200, JSON.stringify(users));
  await expect(new HttpAccessGateway().users()).resolves.toEqual(users);
});
