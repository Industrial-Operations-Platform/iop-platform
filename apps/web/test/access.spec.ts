import {
  AccessApplication,
  type AccessGateway,
} from "../src/features/access/application/access";
function fixture() {
  const context = {
    enabled: true,
    authentication: "password" as const,
    users: [],
    user: null,
    scope: null,
    canImport: false,
  };
  const gateway: AccessGateway = {
    context: jest.fn(async () => context),
    login: jest.fn(),
    password: jest.fn(),
    logout: jest.fn(),
    users: jest.fn(),
    create: jest.fn(),
    change: jest.fn(),
  };
  return { gateway, application: new AccessApplication(gateway), context };
}
test("a mismatched password confirmation never sends credentials", async () => {
  const { application, gateway } = fixture();
  await expect(
    application.changePassword(
      "initial",
      "Synthetic password one",
      "Synthetic password two",
    ),
  ).rejects.toThrow("do not match");
  expect(gateway.password).not.toHaveBeenCalled();
});
test("login uses server context rather than inferring access from a username", async () => {
  const { application, gateway, context } = fixture();
  await expect(
    application.login("admin", "Synthetic password"),
  ).resolves.toEqual(context);
  expect(gateway.context).toHaveBeenCalledTimes(1);
});
test("logout resolves the current server session again", async () => {
  const { application, gateway, context } = fixture();
  await expect(application.logout()).resolves.toEqual(context);
  expect(gateway.logout).toHaveBeenCalledTimes(1);
});
