import {
  Authentication,
  type AuthenticationTransaction,
} from "../src/modules/authentication/application/authentication";
import {
  UserAdministration,
  type AdministrationTransaction,
} from "../src/modules/users-rbac/application/administration";
import { type UserProfile } from "../src/modules/users-rbac/domain/profiles";

function authenticationFixture() {
  const tx: AuthenticationTransaction = {
    allowAttempt: jest.fn(async () => true),
    credential: jest.fn(async () => null),
    recordAttempt: jest.fn(),
    session: jest.fn(async () => null),
    issue: jest.fn(),
    revoke: jest.fn(),
    replacePassword: jest.fn(),
  };
  let committed = false;
  const store = {
    transaction: async <T>(
      work: (value: AuthenticationTransaction) => Promise<T>,
    ) => {
      const result = await work(tx);
      committed = true;
      return result;
    },
  };
  const passwords = {
    hash: jest.fn(async () => "hashed"),
    verify: jest.fn(async () => false),
    dummyHash: "dummy",
  };
  const service = new Authentication(store, passwords, {
    now: () => 100,
    token: () => "a".repeat(43),
    digest: (value) => "digest:" + value,
  });
  return { tx, service, passwords, committed: () => committed };
}
test("unknown users perform dummy verification and failed login commits before rejecting", async () => {
  const { service, passwords, committed } = authenticationFixture();
  await expect(
    service.login({ username: "unknown", password: "incorrect" }),
  ).rejects.toMatchObject({ code: "invalid_credentials" });
  expect(passwords.verify).toHaveBeenCalledWith("incorrect", "dummy");
  expect(committed()).toBe(true);
});
test("the attempt budget prevents password work and session issuance", async () => {
  const { service, tx, passwords } = authenticationFixture();
  jest.mocked(tx.allowAttempt).mockResolvedValue(false);
  await expect(
    service.login({ username: "someone", password: "incorrect" }),
  ).rejects.toMatchObject({ code: "login_throttled" });
  expect(passwords.verify).not.toHaveBeenCalled();
  expect(tx.issue).not.toHaveBeenCalled();
});
test("initial-change sessions cannot authorize business access", async () => {
  const { service, tx } = authenticationFixture();
  jest.mocked(tx.session).mockResolvedValue({
    userId: "stable-id",
    mustChangePassword: true,
    version: 1,
    credentialHash: "hash",
  });
  await expect(service.principal("a".repeat(43))).rejects.toMatchObject({
    code: "password_change_required",
  });
  await expect(service.principal("a".repeat(43), true)).resolves.toEqual({
    userId: "stable-id",
    mustChangePassword: true,
  });
});
test("last administrator protection runs before a persistence mutation", async () => {
  const administrator: UserProfile = {
    id: "admin",
    name: "Admin",
    username: "admin",
    profile: "administrator",
    active: true,
  };
  const tx: AdministrationTransaction = {
    rename: jest.fn(),
    list: async () => [administrator],
    create: jest.fn(),
    change: jest.fn(),
  };
  const service = new UserAdministration(
    {
      renameSelf: jest.fn(),
      self: async () => administrator,
      asAdministrator: async (_actor, work) => work(tx),
    },
    jest.fn(),
  );
  await expect(
    service.change("admin", "admin", "technician", true),
  ).rejects.toMatchObject({ code: "last_administrator" });
  await expect(
    service.change("admin", "admin", "administrator", false),
  ).rejects.toMatchObject({ code: "last_administrator" });
  expect(tx.change).not.toHaveBeenCalled();
});
test("invalid profiles never enter an administrator transaction", async () => {
  const asAdministrator = jest.fn();
  const service = new UserAdministration(
    { self: jest.fn(), renameSelf: jest.fn(), asAdministrator },
    jest.fn(),
  );
  await expect(
    service.create("admin", {
      name: "User",
      username: "valid",
      profile: "forged" as never,
    }),
  ).rejects.toMatchObject({ code: "invalid_user" });
  expect(asAdministrator).not.toHaveBeenCalled();
});

test("display names are validated and self-service never receives administrator capabilities", async () => {
  const rename = jest.fn(),
    renameSelf = jest.fn();
  const tx: AdministrationTransaction = {
    list: jest.fn(),
    create: jest.fn(),
    change: jest.fn(),
    rename,
  };
  const asAdministrator = jest
    .fn()
    .mockImplementation(async (_actor, work) => work(tx));
  const service = new UserAdministration(
    { self: jest.fn(), renameSelf, asAdministrator },
    jest.fn(),
  );
  await service.rename("tech", "tech", "  New Name  ");
  expect(renameSelf).toHaveBeenCalledWith("tech", "New Name");
  expect(asAdministrator).not.toHaveBeenCalled();
  await service.rename("admin", "tech", "Another Name");
  expect(asAdministrator).toHaveBeenCalledTimes(1);
  expect(rename).toHaveBeenCalledWith("tech", "Another Name");
  for (const value of ["", "   ", "a".repeat(101), "Name\nInjected", null])
    await expect(service.rename("tech", "tech", value)).rejects.toMatchObject({
      code: "invalid_user",
    });
  expect(renameSelf).toHaveBeenCalledTimes(1);
});
