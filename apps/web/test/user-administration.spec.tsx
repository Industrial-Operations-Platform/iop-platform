import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { UserAdministration } from "../src/features/access/adapters/react/UserAdministration";
import {
  AccessApplication,
  type AccessGateway,
} from "../src/features/access/application/access";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
function setup() {
  const user = {
    id: "tech",
    name: "Test User",
    username: "test.user",
    profile: "technician" as const,
    active: true,
  };
  const gateway: AccessGateway = {
    context: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    password: jest.fn(),
    rename: jest.fn(),
    create: jest.fn(),
    change: jest.fn(),
    remove: jest.fn(async () => {}),
    update: jest.fn(async () => {}),
    users: jest.fn(async () => [user]),
    activity: jest.fn(),
  };
  render(
    <UserAdministration
      application={new AccessApplication(gateway)}
      onChanged={jest.fn(async () => {})}
    />,
  );
  return { gateway, user };
}
test("list restricts edits to details, with short access and accessible deletion actions", async () => {
  const { gateway } = setup();
  const table = await screen.findByRole("table", {
    name: "Accounts for this site",
  });
  await screen.findByRole("button", { name: "User details for test.user" });
  expect(within(table).queryByRole("combobox")).toBeNull();
  const toggle = within(table).getByRole("button", {
    name: "Disable test.user",
  });
  expect(toggle).toHaveTextContent(/^Disable$/);
  fireEvent.click(toggle);
  await waitFor(() =>
    expect(gateway.change).toHaveBeenCalledWith("tech", "technician", false),
  );
  const remove = within(table).getByRole("button", {
    name: "Delete profile for test.user",
  });
  await waitFor(() => expect(remove).toBeEnabled());
  expect(remove.querySelector("svg")).not.toBeNull();
  fireEvent.click(remove);
  await waitFor(() => expect(gateway.remove).toHaveBeenCalledWith("tech"));
});
test("details show account identity, discard on cancel and save all editable fields together", async () => {
  const { gateway, user } = setup();
  fireEvent.click(
    await screen.findByRole("button", { name: "User details for test.user" }),
  );
  let dialog = within(screen.getByRole("dialog", { name: "User details" }));
  expect(dialog.getByText(user.username)).toBeVisible();
  expect(dialog.getByText(user.id)).toBeVisible();
  fireEvent.change(dialog.getByLabelText("Name"), {
    target: { value: "Discarded name" },
  });
  fireEvent.click(dialog.getByRole("button", { name: "Cancel" }));
  expect(gateway.update).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "User details for test.user" }),
  );
  dialog = within(screen.getByRole("dialog"));
  expect(dialog.getByLabelText("Name")).toHaveValue(user.name);
  fireEvent.change(dialog.getByLabelText("Name"), {
    target: { value: "Updated user" },
  });
  fireEvent.change(dialog.getByLabelText("Profile"), {
    target: { value: "team-leader" },
  });
  fireEvent.change(dialog.getByLabelText("Access"), {
    target: { value: "disabled" },
  });
  fireEvent.click(dialog.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(gateway.update).toHaveBeenCalledWith({
      id: "tech",
      name: "Updated user",
      profile: "team-leader",
      active: false,
    }),
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(gateway.rename).not.toHaveBeenCalled();
  expect(gateway.change).not.toHaveBeenCalled();
});
test("failed detail save keeps the draft visible for correction", async () => {
  const { gateway } = setup();
  jest
    .mocked(gateway.update)
    .mockRejectedValue(new Error("Keep at least one active administrator."));
  fireEvent.click(
    await screen.findByRole("button", { name: "User details for test.user" }),
  );
  const dialog = within(screen.getByRole("dialog"));
  fireEvent.change(dialog.getByLabelText("Name"), {
    target: { value: "Keep draft" },
  });
  fireEvent.click(dialog.getByRole("button", { name: "Save changes" }));
  expect(await dialog.findByRole("alert")).toHaveTextContent(
    "Keep at least one",
  );
  expect(dialog.getByLabelText("Name")).toHaveValue("Keep draft");
});
