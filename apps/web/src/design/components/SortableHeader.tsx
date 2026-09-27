import type { ReactNode } from "react";
import { Button } from "./Controls";
export function SortableHeader({
  children,
  direction,
  priority,
  onClick,
}: {
  children: ReactNode;
  direction?: "asc" | "desc";
  priority?: number;
  onClick: () => void;
}) {
  return (
    <th
      scope="col"
      aria-sort={
        direction === "asc"
          ? "ascending"
          : direction === "desc"
            ? "descending"
            : "none"
      }
    >
      <Button variant="text" onClick={onClick}>
        {children}
        {direction && (
          <span aria-hidden="true">
            {" "}
            {direction === "asc" ? "↑" : "↓"}
            {priority}
          </span>
        )}
      </Button>
    </th>
  );
}
