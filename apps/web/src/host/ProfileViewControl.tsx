import { useState } from "react";
import { Button, Field, Select } from "../design/components";
import { profileLabels, type Profile } from "../features/access/domain/access";

export function ProfileViewControl({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (profile: Profile) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <Button
        variant="secondary"
        aria-expanded={expanded}
        aria-controls="workspace-profile-view"
        onClick={() => setExpanded((value) => !value)}
      >
        View as
      </Button>
      {expanded && (
        <Field layout="inline">
          Profile view
          <Select
            id="workspace-profile-view"
            value={profile}
            onChange={(event) => onChange(event.target.value as Profile)}
          >
            {Object.entries(profileLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      )}
    </>
  );
}
