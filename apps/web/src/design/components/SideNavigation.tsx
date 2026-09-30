import { t, locale } from "../../localization/i18n";
import { Button } from "./Controls";
export function SideNavigation<T extends string>({
  items,
  selected,
  onSelect,
  label = "Main navigation",
}: {
  items: { id: T; label: string }[];
  selected: T;
  onSelect: (id: T) => void;
  label?: string;
}) {
  return (
    <nav className="iop-side-navigation" aria-label={t(label)}>
      {items.map((item) => (
        <Button
          key={item.id}
          variant="text"
          aria-current={selected === item.id ? "page" : undefined}
          onClick={() => onSelect(item.id)}
        >
          {t(item.label)}
        </Button>
      ))}
    </nav>
  );
}
