import { useLayoutEffect, useRef, useState, type ComponentProps } from "react";

/** Justify long table prose using its rendered lines, including after a resize. */
export function TableText({
  children,
  className = "",
  ...props
}: Omit<ComponentProps<"span">, "children"> & { children: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [justify, setJustify] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
      setJustify(element.scrollHeight > lineHeight * 2 + 1);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [children]);
  return (
    <span
      {...props}
      ref={ref}
      className={`iop-table-text ${className}`}
      data-justify={justify || undefined}
    >
      {children}
    </span>
  );
}
