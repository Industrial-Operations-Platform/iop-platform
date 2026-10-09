import { Panel } from "../design/components";
import { t } from "../localization/i18n";

const modules = [
  {
    title: "Data Analysis",
    purpose: "Understand the evidence",
    description: "Explore imported alarm frequency and accumulated duration, compare reporting periods and trace results to their source.",
    icon: "M4 19h16M6 15V9m6 6V5m6 10v-7",
  },
  {
    title: "Shift Handover",
    purpose: "Keep the next shift informed",
    description: "Share daily reports, safety observations and open issues. Prepare team meetings and retain the history of each follow-up.",
    icon: "M5 4h14v16H5zM9 8h6M9 12h6M9 16h3",
  },
  {
    title: "Workforce",
    purpose: "Coordinate people and shifts",
    description: "See personal schedules and daily assignments, plan the week and keep teams and operational responsibilities in view.",
    icon: "M8 3v4m8-4v4M4 9h16M4 5h16v15H4zM8 13h2m4 0h2m-8 4h2",
  },
  {
    title: "Maintenance",
    purpose: "Turn reports into action",
    description: "Plan technical work, assign responsibility and track progress. Link reported issues to a reviewed repair scope and its completion.",
    icon: "m14 6 4 4M4 20l4-1L20 7l-3-3L5 16zM4 4l4 4m-4 0 4-4",
  },
  {
    title: "Digital Asset Record",
    purpose: "Retain the equipment context",
    description: "Register equipment identities and review linked maintenance, handover and analytical evidence in one source-linked history.",
    icon: "m12 3 8 4v10l-8 4-8-4V7zM4 7l8 4 8-4M12 11v10",
  },
  {
    title: "Access administration",
    purpose: "Give each person their workspace",
    description: "Administrators manage individual accounts and profiles. Each person opens the tools available to their assigned role.",
    icon: "M8 11V7a4 4 0 0 1 8 0v4M5 11h14v10H5zM12 15v2",
  },
] as const;

const workflow = [
  { title: "Report and understand", description: "Record the shift context and consult the analytical evidence.", module: "Shift Handover · Data Analysis" },
  { title: "Coordinate and resolve", description: "Make responsibilities visible and follow technical work through completion.", module: "Workforce · Maintenance" },
  { title: "Keep the history", description: "Return to the original reports, interventions and source records when you need context.", module: "Digital Asset Record" },
] as const;

/** Platform details composed by the host's About view. */
export function PlatformAbout() {
  return (
    <div className="intro-about">
      <p>{t("IOP brings operational reports, people, maintenance and analytical evidence into a modular workspace. Keep the next shift informed and the work ahead visible.")}</p>

      <section aria-labelledby="about-platform-title">
        <div className="intro-about-heading">
          <h2 id="about-platform-title">{t("The tools behind your daily operations")}</h2>
          <p>{t("Independent modules, brought together around the work of your team.")}</p>
        </div>
        <div className="intro-about-modules">
          {modules.map((module) => (
            <Panel key={module.title} className="intro-about-module">
              <div className="intro-about-module-heading">
                <span className="intro-about-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={module.icon} />
                  </svg>
                </span>
                <h3>{t(module.title)}</h3>
              </div>
              <p className="intro-about-purpose">{t(module.purpose)}</p>
              <p>{t(module.description)}</p>
            </Panel>
          ))}
        </div>
      </section>

      <section aria-labelledby="about-workflow-title">
        <div className="intro-about-heading">
          <h2 id="about-workflow-title">{t("From shift context to retained history")}</h2>
          <p>{t("Each module keeps its own records, while explicit links help your team follow the work.")}</p>
        </div>
        <ol className="intro-about-steps">
          {workflow.map((step, index) => (
            <li key={step.title}>
              <span className="intro-about-step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <h3>{t(step.title)}</h3>
              <p>{t(step.description)}</p>
              <span className="intro-about-step-modules">{t(step.module)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
