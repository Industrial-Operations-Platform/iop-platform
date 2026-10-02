import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "./Controls";

/** Anchored, non-modal disclosure with native controls and ordinary Tab navigation. */
export function Popover({
  label,
  description,
  trigger,
  children,
  className = "",
  triggerClassName = "",
}: {
  label: string;
  description?: string;
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  className?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = () => {
    setOpen(false);
    toggle.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    panel.current
      ?.querySelector<HTMLElement>(
        "button:not(:disabled), select, input, [tabindex='0']",
      )
      ?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return (
    <div
      ref={root}
      className={`iop-popover ${className}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
      onBlur={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          setOpen(false);
      }}
    >
      <Button
        ref={toggle}
        variant="secondary"
        className={`iop-popover-toggle ${triggerClassName}`}
        aria-label={label}
        aria-description={description}
        title={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        {trigger}
      </Button>
      {open && (
        <div
          ref={panel}
          id={id}
          role="dialog"
          aria-label={label}
          className="iop-popover-panel"
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}
