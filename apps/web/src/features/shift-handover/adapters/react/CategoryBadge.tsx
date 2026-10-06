import type { ComponentProps } from "react";
import { Badge } from "../../../../design/components";
import type { Entry } from "../../domain/models";

const categoryTones: Record<string, ComponentProps<typeof Badge>["tone"]> = {
  successes: "success",
  problems: "attention",
  safety: "warning",
  information: "info",
};

export function CategoryBadge({
  entry,
}: {
  entry: Pick<Entry, "categoryLabel"> & {
    content: Pick<Entry["content"], "categoryId">;
  };
}) {
  return (
    <Badge tone={categoryTones[entry.content.categoryId] ?? "info"}>
      {entry.categoryLabel}
    </Badge>
  );
}
