import { t } from "../../localization/i18n";
import {
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import { appearanceIdentity, variablesForIdentity } from "../identity";
import { useAppearance } from "../useAppearance";
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
  const shell = useRef<HTMLDivElement>(null);
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
    <IdentityRoot ref={shell} className={`iop-shell ${className ?? ""}`}>
      <a className="iop-skip" href={`#${mainId}`}>
        {skipLabel}
      </a>
      <header ref={headerElement} className="iop-top">
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
        <div className="iop-header-actions">{header}</div>
      </header>
      <aside className="iop-sidebar">{navigation}</aside>
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
