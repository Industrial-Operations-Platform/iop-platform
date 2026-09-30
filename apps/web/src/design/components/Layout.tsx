import { t, locale } from "../../localization/i18n";
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
  brandAction,
  navigation,
  children,
  mainId,
  skipLabel,
  className,
}: {
  header: ReactNode;
  brand: ReactNode;
  brandAction?: { label: string; onClick: () => void };
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
        {brandAction ? (
          <button
            type="button"
            className="iop-brand"
            aria-label={brandAction.label}
            onClick={brandAction.onClick}
          >
            {brand}
          </button>
        ) : (
          <div className="iop-brand">{brand}</div>
        )}
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
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="iop-page-heading">
      <div>
        {eyebrow && (
          <p className="iop-eyebrow">
            {typeof eyebrow === "string" ? t(eyebrow) : eyebrow}
          </p>
        )}
        <h1>{typeof title === "string" ? t(title) : title}</h1>
        {description && (
          <p>
            {typeof description === "string" ? t(description) : description}
          </p>
        )}
      </div>
      {actions}
    </div>
  );
}
