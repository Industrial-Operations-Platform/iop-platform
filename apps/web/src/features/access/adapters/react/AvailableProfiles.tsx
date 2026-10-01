import { Panel } from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import { profileLabels, type Profile } from "../../domain/access";

const descriptions: Record<Profile, string> = {
  administrator:
    "Manage users, imports, workforce configuration, planning and analysis.",
  technician: "Read your daily plan and share operational updates.",
  "team-leader": "Plan team assignments and review daily operations.",
  "task-force": "Review operational information and analytical reports.",
};

export function AvailableProfiles() {
  return (
    <Panel>
      <h2>{t("Available profiles")}</h2>
      <div className="access-profile-grid">
        {(
          ["administrator", "technician", "team-leader", "task-force"] as const
        ).map((profile) => (
          <article className="access-profile-card" key={profile}>
            <h3>{t(profileLabels[profile])}</h3>
            <p>{t(descriptions[profile])}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}
