import { createRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  Alert,
  AppShell,
  Button,
  Disclosure,
  Field,
  FieldRow,
  FilterForm,
  IdentityRoot,
  Input,
  MetricCard,
  MetricGrid,
  Panel,
  Select,
  Table,
  TableViewport,
  ViewNavigation,
} from "../src/design/components";

jest.mock("../src/design/components/components.css", () => ({}));

test("shared form controls preserve native labels, changes, refs, disabled state and explicit submission", () => {
  const submit = jest.fn(),
    changed = jest.fn(),
    action = jest.fn(),
    input = createRef<HTMLInputElement>();
  render(
    <IdentityRoot>
      <FilterForm
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <FieldRow>
          <Field>
            Name
            <Input ref={input} onChange={changed} />
          </Field>
          <Field>
            Period
            <Select aria-label="Period" defaultValue="day">
              <option value="day">Daily</option>
              <option value="month">Monthly</option>
            </Select>
          </Field>
        </FieldRow>
        <Button onClick={action}>Inspect</Button>
        <Button type="submit">Apply</Button>
        <Button disabled onClick={action}>
          Unavailable
        </Button>
      </FilterForm>
    </IdentityRoot>,
  );
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Example" },
  });
  expect(changed).toHaveBeenCalledTimes(1);
  input.current?.focus();
  expect(screen.getByLabelText("Name")).toHaveFocus();
  fireEvent.change(screen.getByLabelText("Period", { exact: true }), {
    target: { value: "month" },
  });
  expect(screen.getByLabelText("Period", { exact: true })).toHaveValue("month");
  fireEvent.click(screen.getByRole("button", { name: "Inspect" }));
  fireEvent.click(screen.getByRole("button", { name: "Unavailable" }));
  expect(action).toHaveBeenCalledTimes(1);
  expect(submit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
  expect(submit).toHaveBeenCalledTimes(1);
});

test("another feature can compose the identity shell, surfaces and view navigation without analysis dependencies", () => {
  function ExampleFeature() {
    const [view, setView] = useState("overview");
    return (
      <AppShell
        mainId="example-main"
        skipLabel="Skip to example"
        header={
          <Field layout="inline">
            User
            <Select aria-label="User">
              <option>Administrator</option>
            </Select>
          </Field>
        }
        brand={
          <>
            IOP<span>Example feature</span>
          </>
        }
        navigation={<nav aria-label="Main navigation">Example</nav>}
      >
        <MetricGrid>
          <MetricCard label="Open tasks" value="12">
            <small>All teams</small>
          </MetricCard>
        </MetricGrid>
        <Panel>
          <h1>{view === "overview" ? "Overview" : "Details"}</h1>
          <Disclosure summary="Inspect items">
            <TableViewport>
              <Table>
                <caption>Tasks</caption>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Example</td>
                  </tr>
                </tbody>
              </Table>
            </TableViewport>
          </Disclosure>
        </Panel>
        <Alert>Connection unavailable</Alert>
        <ViewNavigation
          label="Example views"
          items={[
            { id: "overview", label: "Overview" },
            { id: "details", label: "Details" },
          ]}
          selected={view}
          onSelect={setView}
        />
      </AppShell>
    );
  }
  render(<ExampleFeature />);
  expect(screen.getByRole("link", { name: "Skip to example" })).toHaveAttribute(
    "href",
    "#example-main",
  );
  expect(screen.getByRole("main")).toHaveAttribute("id", "example-main");
  expect(screen.getByText("Open tasks")).toBeVisible();
  fireEvent.click(screen.getByText("Inspect items"));
  expect(screen.getByRole("table", { name: "Tasks" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Details" }));
  expect(screen.getByRole("heading", { name: "Details" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("button", { name: "Overview" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Connection unavailable");
});
