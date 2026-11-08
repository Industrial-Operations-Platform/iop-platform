import { t } from "../../localization/i18n";
import {
  useLayoutEffect,
  useId,
  useRef,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import { appearanceIdentity, variablesForIdentity } from "../identity";
import { useAppearance } from "../useAppearance";
import { Button } from "./Controls";
import "./components.css";

export function IdentityRoot({
  className = "",
  ...props
}: Omit<ComponentProps<"div">, "style">) {
  const { resolved } = useAppearance();
  return (
    <div
      {...props}
      className={`iop-ui ${className}`}
      data-appearance={resolved}
      style={variablesForIdentity(appearanceIdentity(resolved)) as CSSProperties}
    />
  );
}
export function AppShell({
  header,
  brand,
  brandAction,
  navigation,
  navigationCollapsed = false,
  onToggleNavigation,
  children,
  mainId,
  skipLabel,
  className,
}: {
  header: ReactNode;
  brand: ReactNode;
  brandAction?: { label: string; onClick: () => void };
  navigation: ReactNode;
  navigationCollapsed?: boolean;
  onToggleNavigation?: () => void;
  children: ReactNode;
  mainId: string;
  skipLabel: string;
  className?: string;
}) {
  const shell = useRef<HTMLDivElement>(null);
  const navigationId = useId();
  const headerElement = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const element = headerElement.current;
    if (!element) return;
    const measure = () => {
      shell.current?.style.setProperty(
        "--shell-header-height",
        `${element.getBoundingClientRect().height}px`,
      );
    };
    measure();
    const observer = typeof ResizeObserver === "undefined"
      ? undefined
      : new ResizeObserver(measure);
    observer?.observe(element);
    return () => observer?.disconnect();
  }, []);
  return (
    <IdentityRoot ref={shell} className={`iop-shell ${className ?? ""}`} data-navigation-collapsed={navigationCollapsed}>
      <a className="iop-skip" href={`#${mainId}`}>
        {skipLabel}
      </a>
      <header ref={headerElement} className="iop-top">
        <div className="iop-shell-identity">
          {onToggleNavigation && (
            <Button
              variant="text"
              className="iop-icon-button iop-navigation-toggle"
              aria-label={t(navigationCollapsed ? "Show navigation" : "Hide navigation")}
              title={t(navigationCollapsed ? "Show navigation" : "Hide navigation")}
              aria-expanded={!navigationCollapsed}
              aria-controls={navigationId}
              onClick={onToggleNavigation}
            >
              <svg className="iop-toolbar-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={navigationCollapsed ? "m5 6 6 6-6 6m6-12 6 6-6 6" : "m13 6-6 6 6 6m6-12-6 6 6 6"} />
              </svg>
            </Button>
          )}
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
        </div>
        <div className="iop-header-actions">{header}</div>
      </header>
      <aside id={navigationId} className="iop-sidebar" hidden={navigationCollapsed}>{navigation}</aside>
      <main id={mainId} className="iop-main">
        <div className="iop-content">{children}</div>
      </main>
    </IdentityRoot>
  );
}
export function PageHeading({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="iop-page-heading">
      <div>
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

export function PageStack({ className = "", ...props }: ComponentProps<"div">) {
  return <div {...props} className={`iop-page-stack ${className}`} />;
}

export function DetailFacts({
  items,
  className = "",
  ...props
}: ComponentProps<"dl"> & {
  items: readonly { label: ReactNode; value: ReactNode }[];
}) {
  return (
    <dl {...props} className={`iop-detail-facts ${className}`}>
      {items.map(({ label, value }, index) => (
        <div key={index}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
