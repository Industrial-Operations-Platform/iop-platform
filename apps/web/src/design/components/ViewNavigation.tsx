import { useEffect, useRef } from "react";
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
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    const revealSelected = () => {
      const nav = navigation.current;
      const active = nav?.querySelector<HTMLButtonElement>(
        '[aria-pressed="true"]',
      );
      if (!nav || !active) return;
      const left = active.offsetLeft;
      const right = left + active.offsetWidth;
      if (left < nav.scrollLeft) nav.scrollLeft = left;
      else if (right > nav.scrollLeft + nav.clientWidth)
        nav.scrollLeft = right - nav.clientWidth;
    };
    revealSelected();
    window.addEventListener("resize", revealSelected);
    return () => window.removeEventListener("resize", revealSelected);
  }, [selected]);
  return (
    <nav ref={navigation} className="iop-view-navigation" aria-label={label}>
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
