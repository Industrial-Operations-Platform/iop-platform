import { useState, type ReactNode } from "react";
import { Button, Dialog, IdentityRoot } from "../design/components";
import { PlatformMark } from "../design/components/PlatformMark";
import { LanguageControl } from "../localization/LanguageControl";
import { t } from "../localization/i18n";
import { IntroScene, type IntroModule } from "./IntroScene";
import { PlatformAbout } from "./PlatformAbout";
import "./landing.css";

const mainModules = [
  { id: "analysis", label: "Data Analysis", caption: "See the patterns. Follow the evidence." },
  { id: "maintenance", label: "Maintenance", caption: "Bring the work into view. Follow it through." },
  { id: "workforce", label: "Workforce", caption: "People, shifts and responsibilities. In perspective." },
] as const;

/** Presentation state stays in the host; Access still owns sign-in behavior. */
export function LandingPage({ children, busy = false }: { children: ReactNode; busy?: boolean }) {
  const [view, setView] = useState<"access" | "about" | null>(null);
  const [selected, setSelected] = useState<IntroModule>("analysis");
  const [paused, setPaused] = useState(false);
  const activeModule = mainModules.find((module) => module.id === selected)!;

  return (
    <IdentityRoot className="landing" data-motion={paused ? "paused" : "running"}>
      <div className="intro-background" aria-hidden="true">
        <div className="intro-background-light" />
        <div className="intro-background-orbit intro-background-orbit--one" />
        <div className="intro-background-orbit intro-background-orbit--two" />
        <div className="intro-background-grid" />
      </div>
      <a className="iop-skip" href="#landing-main">{t("Skip to platform overview")}</a>
      <header className="intro-header intro-container">
        <a className="intro-brand" href="#landing-main" aria-label={t("IOP platform overview")}>
          <PlatformMark />
          <span><strong>IOP</strong><span>{t("Industrial Operations Platform")}</span></span>
        </a>
        <nav className="intro-navigation" aria-label={t("Platform navigation")}>
          <Button variant="text" aria-label={t("About IOP")} onClick={() => setView("about")}>{t("About")}</Button>
          <LanguageControl />
          <Button onClick={() => setView("access")}>
            {t("Sign in")}<span aria-hidden="true">↗</span>
          </Button>
        </nav>
      </header>

      <main id="landing-main" className="intro-main intro-container" tabIndex={-1}>
        <div className="intro-composition">
          <div className="intro-copy">
            <p className="intro-eyebrow"><span aria-hidden="true" />{t("Connected operations")}</p>
            <h1>{t("Bring operations into focus.")}</h1>
            <p className="intro-description">{t("A shared space for analytical insight, technical work and the people behind every shift.")}</p>
            <span className="intro-copy-rule" aria-hidden="true" />
          </div>
          <IntroScene active={selected} paused={paused} />
        </div>

        <div className="intro-explore">
          <nav className="intro-module-navigation" aria-label={t("Explore main modules")}>
            {mainModules.map((module, index) => (
              <Button key={module.id} variant="text" aria-pressed={selected === module.id}
                onClick={() => setSelected(module.id)}>
                <span className="intro-module-index" aria-hidden="true">0{index + 1}</span>
                <span>{t(module.label)}</span>
                <span className="intro-module-arrow" aria-hidden="true">↗</span>
              </Button>
            ))}
          </nav>
          <p className="intro-module-caption" aria-live="polite">{t(activeModule.caption)}</p>
        </div>
      </main>

      <footer className="intro-footer intro-container">
        <span>{t("One platform. A clearer perspective.")}</span>
        <Button variant="text" className="intro-motion" onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            {paused ? <path d="m8 5 11 7-11 7Z" /> : <path d="M8 5v14M16 5v14" />}
          </svg>
          {paused ? t("Resume animation") : t("Pause animation")}
        </Button>
      </footer>

      {view === "about" && (
        <Dialog title={t("About IOP")} onClose={() => setView(null)}>
          <PlatformAbout />
        </Dialog>
      )}
      {view === "access" && (
        <Dialog title={t("Workspace access")} busy={busy} onClose={() => setView(null)}>
          <div className="intro-access">
            {children}
            <p className="intro-access-note">{t("Your profile determines which tools are available. Contact your administrator if you need access.")}</p>
          </div>
        </Dialog>
      )}
    </IdentityRoot>
  );
}
