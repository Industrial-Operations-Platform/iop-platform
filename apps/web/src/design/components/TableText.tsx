import type { ComponentProps } from "react";

/** Keep narrative alignment stable while columns wrap or resize. */
export function TableText({
  children,
  className = "",
  ...props
}: Omit<ComponentProps<"span">, "children"> & { children: string }) {
  return (
    <span
      {...props}
      className={`iop-table-text ${className}`}
    >
      {children}
    </span>
  );
}
