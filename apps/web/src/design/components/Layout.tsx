import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { identityVariables } from "../identity";
import "./components.css";

export function IdentityRoot({
  className = "",
  ...props
}: Omit<ComponentProps<"div">, "style">) {
  return (
    <div
      {...props}
      className={`iop-ui ${className}`}
      style={identityVariables as CSSProperties}
    />
  );
}
export function AppShell({
  header,
  brand,
  navigation,
  children,
  mainId,
  skipLabel,
  className,
}: {
  header: ReactNode;
  brand: ReactNode;
  navigation: ReactNode;
  children: ReactNode;
  mainId: string;
  skipLabel: string;
  className?: string;
}) {
  return (
    <IdentityRoot className={className}>
      <a className="iop-skip" href={`#${mainId}`}>
        {skipLabel}
      </a>
      <header className="iop-top">{header}</header>
      <aside className="iop-sidebar">
        <div className="iop-brand">{brand}</div>
        {navigation}
      </aside>
      <main id={mainId} className="iop-main">
        {children}
      </main>
    </IdentityRoot>
  );
}
export function PageHeading({
  title,
  eyebrow,
  description,
  actions,
}: {
  title: string;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="iop-page-heading">
      <div>
        {eyebrow && <p className="iop-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions}
    </div>
  );
}
