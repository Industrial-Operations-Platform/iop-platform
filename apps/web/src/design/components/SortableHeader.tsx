import { useId, type ReactNode } from "react";
import { Button } from "./Controls";
import { t } from "../../localization/i18n";
export function SortableHeader({
  children,
  direction,
  priority,
  onClick,
  align,
}: {
  children: ReactNode;
  direction?: "asc" | "desc";
  priority?: number;
  onClick: () => void;
  align?: "text" | "number" | "status";
}) {
  const descriptionId = useId();
  const hasPriority = direction !== undefined && priority !== undefined;
  return (
    <th
      scope="col"
      data-align={align}
      aria-sort={
        direction === "asc"
          ? "ascending"
          : direction === "desc"
            ? "descending"
            : "none"
      }
    >
      <Button
        variant="text"
        onClick={onClick}
        aria-describedby={hasPriority ? descriptionId : undefined}
      >
        {children}
        {direction && (
          <span aria-hidden="true">
            {" "}
            {direction === "asc" ? "↑" : "↓"}
            {priority}
          </span>
        )}
      </Button>
      {hasPriority && (
        <span id={descriptionId} hidden>
          {t("Sort priority {0}", [priority])}
        </span>
      )}
    </th>
  );
}
