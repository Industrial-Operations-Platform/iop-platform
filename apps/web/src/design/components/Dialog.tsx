import { t } from "../../localization/i18n";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./Controls";

/** Native modal semantics provide focus containment and an inert background. */
export function Dialog({
  title,
  onClose,
  busy = false,
  children,
}: {
  title: string;
  onClose: () => void;
  busy?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="iop-dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="iop-dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <Button
          variant="text"
          aria-label={t("Close {0}", [title])}
          disabled={busy}
          onClick={onClose}
        >
          ×
        </Button>
      </div>
      {children}
    </dialog>
  );
}
