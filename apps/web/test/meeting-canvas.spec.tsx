import { fireEvent, render, screen, within } from "@testing-library/react";
import { MeetingCanvas } from "../src/features/shift-handover/adapters/react/MeetingCanvas";
import type { Entry } from "../src/features/shift-handover/domain/models";

const categories = [
  "Safety",
  "Information",
  "Successes",
  "People",
  "Performance",
  "Problems",
].map((label) => ({ id: label.toLowerCase(), label }));
test("the canvas retains six sections and cards expose only title and department", () => {
  const entry = {
    id: "entry",
    departmentLabel: "Workshop",
    authorName: "Private author detail",
    content: { summary: "Guard replaced", details: "Detailed root cause" },
  } as Entry;
  const sections = categories.map((category) => ({
    category,
    page: {
      entries: category.id === "problems" ? [entry] : [],
      total: category.id === "problems" ? 21 : 0,
      nextCursor: category.id === "problems" ? "next" : "",
    },
  }));
  const open = jest.fn(),
    more = jest.fn().mockResolvedValue(undefined);
  render(
    <MeetingCanvas sections={sections} open={open} more={more} busy={false} />,
  );
  for (const category of categories)
    expect(
      screen.getByRole("region", { name: `${category.label} section` }),
    ).toBeVisible();
  expect(screen.getAllByText("No entries for this day.")).toHaveLength(5);
  const problems = screen.getByRole("region", { name: "Problems section" });
  const card = within(problems).getByRole("button", {
    name: "Guard replaced Workshop",
  });
  expect(card).toHaveTextContent("Workshop");
  expect(screen.queryByText("Detailed root cause")).not.toBeInTheDocument();
  expect(screen.queryByText("Private author detail")).not.toBeInTheDocument();
  fireEvent.click(card);
  expect(open).toHaveBeenCalledWith("entry");
  fireEvent.click(
    within(problems).getByRole("button", { name: /More Problems entries/ }),
  );
  expect(more).toHaveBeenCalledWith("problems");
});
