import { Button } from "./Controls";

/** A group of view-selection buttons, not an ARIA tablist with partial keyboard support. */
export function ViewNavigation<T extends string | number>({
  label,
  items,
  selected,
  onSelect,
}: {
  label: string;
  items: readonly { id: T; label: string }[];
  selected: T;
  onSelect: (id: T) => void;
}) {
  return (
    <nav className="iop-view-navigation" aria-label={label}>
      {items.map((item) => (
        <Button
          key={item.id}
          aria-pressed={selected === item.id}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </Button>
      ))}
    </nav>
  );
}
