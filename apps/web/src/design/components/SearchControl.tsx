import { useEffect, useId, useRef, useState } from "react";
import { t } from "../../localization/i18n";
import { IconButton, Input } from "./Controls";

/** A disclosed search field; matching remains the caller's responsibility. */
export function SearchControl({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(Boolean(value));
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (expanded) input.current?.focus();
  }, [expanded]);
  const close = () => {
    onChange("");
    setExpanded(false);
    toggle.current?.focus();
  };
  return (
    <div className="iop-search-control" data-expanded={expanded}>
      <IconButton
        ref={toggle}
        label={expanded ? t("Close search") : label}
        aria-expanded={expanded}
        aria-controls={inputId}
        onClick={() => (expanded ? close() : setExpanded(true))}
      >
        <svg
          className="iop-toolbar-glyph"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {expanded ? (
            <path d="m6 6 12 12M6 18 18 6" />
          ) : (
            <>
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5" />
            </>
          )}
        </svg>
      </IconButton>
      <Input
        ref={input}
        id={inputId}
        type="search"
        hidden={!expanded}
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
        }}
      />
    </div>
  );
}
