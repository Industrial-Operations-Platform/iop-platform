import {
  EntryNotifications,
  notificationEpoch,
} from "../src/features/shift-handover/application/notifications";
import { BrowserNotificationCheckpoint } from "../src/features/shift-handover/adapters/browser/notification-checkpoint";
import type { Entry, Page } from "../src/features/shift-handover/domain/models";

const publication = (id: string, at: string) =>
  ({ id, createdAt: at }) as Entry;
const page = (entries: Entry[], total = entries.length): Page => ({
  entries,
  total,
  nextCursor: "",
});

test("first use establishes a baseline; later publications survive refresh until explicitly acknowledged", async () => {
  const old = publication("old", "2026-10-01T12:00:00.000Z");
  const newest = publication("new", "2026-10-02T12:00:00.000Z");
  const checkpoint = { load: () => null, save: jest.fn() };
  const list = jest
    .fn()
    .mockResolvedValueOnce(page([old]))
    .mockResolvedValue(page([newest], 25));
  const app = new EntryNotifications({ list }, checkpoint);
  expect((await app.refresh()).total).toBe(0);
  expect(checkpoint.save).toHaveBeenLastCalledWith(old.createdAt);
  expect((await app.refresh()).total).toBe(25);
  expect((await app.refresh()).entries).toEqual([newest]);
  expect(list).toHaveBeenLastCalledWith(
    expect.objectContaining({ notificationsAfter: old.createdAt }),
  );
  expect(app.markAllRead().total).toBe(0);
  expect(checkpoint.save).toHaveBeenLastCalledWith(newest.createdAt);
  await app.refresh();
  expect(list).toHaveBeenLastCalledWith(
    expect.objectContaining({ notificationsAfter: newest.createdAt }),
  );
});

test("concurrent mounts share the baseline request and failed reads never advance the checkpoint", async () => {
  let resolve!: (page: Page) => void;
  const list = jest.fn().mockReturnValueOnce(
    new Promise<Page>((done) => {
      resolve = done;
    }),
  );
  const checkpoint = { load: () => null, save: jest.fn() };
  const app = new EntryNotifications({ list }, checkpoint);
  const first = app.refresh(),
    second = app.refresh();
  expect(first).toBe(second);
  expect(list).toHaveBeenCalledTimes(1);
  resolve(page([]));
  await first;
  expect(checkpoint.save).toHaveBeenCalledWith(notificationEpoch);
  list.mockRejectedValueOnce(new Error("Offline"));
  await expect(app.refresh()).rejects.toThrow("Offline");
  expect(checkpoint.save).toHaveBeenCalledTimes(1);
  list.mockResolvedValueOnce(
    page([publication("recovered", "2026-10-02T12:00:00.000Z")]),
  );
  expect((await app.refresh()).total).toBe(1);
});

test("read checkpoints survive reload and isolate accounts, sites and organizations", () => {
  localStorage.clear();
  const first = new BrowserNotificationCheckpoint("org", "site", "alice");
  first.save("2026-10-02T12:00:00.000Z");
  expect(new BrowserNotificationCheckpoint("org", "site", "alice").load()).toBe(
    "2026-10-02T12:00:00.000Z",
  );
  expect(
    new BrowserNotificationCheckpoint("org", "site", "bob").load(),
  ).toBeNull();
  expect(
    new BrowserNotificationCheckpoint("org", "other", "alice").load(),
  ).toBeNull();
  expect(
    new BrowserNotificationCheckpoint("other", "site", "alice").load(),
  ).toBeNull();
  const storage = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("Storage denied");
    });
  first.save("2026-10-03T12:00:00.000Z");
  const read = jest
    .spyOn(Storage.prototype, "getItem")
    .mockImplementation(() => {
      throw new Error("Storage denied");
    });
  expect(first.load()).toBe("2026-10-03T12:00:00.000Z");
  storage.mockRestore();
  read.mockRestore();
  localStorage.clear();
});

test("mention updates advance the checkpoint by notification time rather than the original publication", async () => {
  const update = { ...publication("existing", "2026-09-01T12:00:00.000Z"), notificationAt: "2026-10-06T12:00:00.000Z" };
  const checkpoint = { load: () => "2026-10-05T12:00:00.000Z", save: jest.fn() };
  const list = jest.fn().mockResolvedValue(page([update]));
  const notifications = new EntryNotifications({ list }, checkpoint);
  expect((await notifications.refresh()).total).toBe(1);
  notifications.markAllRead();
  expect(checkpoint.save).toHaveBeenCalledWith(update.notificationAt);
  await notifications.refresh();
  expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ notificationsAfter: update.notificationAt }));
});
