import { ActionIcon, Button, Popover } from "../design/components";
import { LanguageControl } from "../localization/LanguageControl";
import { t } from "../localization/i18n";
import { profileLabels, type Profile } from "../features/access/domain/access";
import { ProfileViewControl } from "./ProfileViewControl";

export function AccountControl({
  name,
  profile,
  pending,
  edit,
  signOut,
  preview,
}: {
  name: string;
  profile: string;
  pending: boolean;
  edit?: () => void;
  signOut?: () => void;
  preview?: { profile: Profile; onChange: (profile: Profile) => void };
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toLocaleUpperCase();
  const role = t(profileLabels[profile as Profile] ?? "User");
  return (
    <Popover
      label={t("User menu")}
      className="iop-account-menu"
      triggerClassName="iop-account-toggle"
      trigger={
        <>
          <span className="iop-avatar" aria-hidden="true">
            {initials}
          </span>
        </>
      }
    >
      {(close) => (
        <>
          <div className="iop-account-summary">
            <strong>{name}</strong>
            <span>{role}</span>
          </div>
          <div className="iop-account-options">
            {edit && (
              <Button
                variant="text"
                className="iop-menu-action"
                onClick={() => {
                  close();
                  edit();
                }}
              >
                <ActionIcon name="user" />
                {t("My profile")}
              </Button>
            )}
            <LanguageControl expanded />
            {preview && (
              <div className="iop-account-preview">
                <ProfileViewControl
                  compact
                  profile={preview.profile}
                  onChange={(profile) => {
                    close();
                    preview.onChange(profile);
                  }}
                />
              </div>
            )}
          </div>
          {signOut && (
            <Button
              variant="text"
              className="iop-menu-action iop-menu-sign-out"
              disabled={pending}
              onClick={() => {
                close();
                signOut();
              }}
            >
              <ActionIcon name="logout" />
              {t("Sign out")}
            </Button>
          )}
        </>
      )}
    </Popover>
  );
}
