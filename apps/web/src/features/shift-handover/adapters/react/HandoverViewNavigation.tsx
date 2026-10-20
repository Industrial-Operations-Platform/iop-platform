import { ViewNavigation } from "../../../../design/components";
import { t } from "../../../../localization/i18n";

export type JournalView = "meeting" | "journal" | "matrix";
export type HandoverView = JournalView | "records";

/** Journal and transfer records retain independent use cases within one navigation. */
export function HandoverViewNavigation({
  selected,
  onSelect,
  dailyOverview = false,
  includeRecords = false,
  disabled = false,
  recordsDisabled = disabled,
}: {
  selected: HandoverView;
  onSelect: (view: HandoverView) => void;
  dailyOverview?: boolean;
  includeRecords?: boolean;
  disabled?: boolean;
  recordsDisabled?: boolean;
}) {
  return (
    <ViewNavigation<HandoverView>
      label={t("Handover views")}
      buttonVariant="text"
      selected={selected}
      items={[
        { id: "meeting", label: dailyOverview ? "Daily overview" : "Meeting preparation", disabled },
        { id: "journal", label: "Journal", disabled },
        { id: "matrix", label: "Department matrix", disabled },
        ...(includeRecords ? [{ id: "records" as const, label: "Shift records", disabled: recordsDisabled }] : []),
      ]}
      onSelect={onSelect}
    />
  );
}
