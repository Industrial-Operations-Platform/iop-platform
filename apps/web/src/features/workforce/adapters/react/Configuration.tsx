import { useState } from "react";
import {
  Actions,
  Button,
  Field,
  FieldRow,
  Input,
  Panel,
  Select,
} from "../../../../design/components";
import {
  entries,
  type Board,
  type SaveInput,
  type Settings,
} from "../../domain/models";
import { t } from "../../../../localization/i18n";
export function Configuration({
  board,
  save,
  pending,
}: {
  board: Board;
  save: (input: SaveInput) => void;
  pending: boolean;
}) {
  const [config, setConfig] = useState<Settings>(
      structuredClone(board.settings),
    ),
    [userId, setUserId] = useState(""),
    [teamId, setTeamId] = useState(""),
    [targetId, setTargetId] = useState("");
  const current = entries(board, "settings")[0];
  return (
    <>
      <Panel>
        <h2>{t("Shift definitions")}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save({
              kind: "settings",
              id: "site",
              expectedRevision: current?.revision ?? 0,
              deleted: false,
              data: config,
            });
          }}
        >
          {config.shifts.map((s, index) => (
            <FieldRow key={index}>
              <Field>
                {t("ID")}
                <Input
                  required
                  value={s.id}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      shifts: c.shifts.map((v, i) =>
                        i === index ? { ...v, id: e.target.value } : v,
                      ),
                    }))
                  }
                />
              </Field>
              <Field>
                {t("Name")}
                <Input
                  required
                  value={s.label}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      shifts: c.shifts.map((v, i) =>
                        i === index ? { ...v, label: e.target.value } : v,
                      ),
                    }))
                  }
                />
              </Field>
              {(["start", "end"] as const).map((key) => (
                <Field key={key}>
                  {t(key === "start" ? "Start time" : "End time")}
                  <Input
                    type="time"
                    required
                    value={s[key]}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        shifts: c.shifts.map((v, i) =>
                          i === index ? { ...v, [key]: e.target.value } : v,
                        ),
                      }))
                    }
                  />
                </Field>
              ))}
              <Field>
                {t("Active days (0 Sunday – 6 Saturday)")}
                <Input
                  required
                  value={s.days.join(",")}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      shifts: c.shifts.map((v, i) =>
                        i === index
                          ? {
                              ...v,
                              days: e.target.value.split(",").map(Number),
                            }
                          : v,
                      ),
                    }))
                  }
                />
              </Field>
              <Button
                variant="text"
                onClick={() =>
                  setConfig((c) => ({
                    ...c,
                    shifts: c.shifts.filter((_, i) => i !== index),
                  }))
                }
              >
                {t("Remove")}
              </Button>
            </FieldRow>
          ))}
          <Button
            variant="secondary"
            onClick={() =>
              setConfig((c) => ({
                ...c,
                shifts: [
                  ...c.shifts,
                  {
                    id: "shift-" + (c.shifts.length + 1),
                    label: "New shift",
                    start: "08:00",
                    end: "17:00",
                    days: [1, 2, 3, 4, 5],
                  },
                ],
              }))
            }
          >
            {t("Add")}
          </Button>
          <h2>{t("Targets and phones")}</h2>
          <p>{t("Keep phone labels unique across zones.")}</p>
          {config.targets.map((target, index) => (
            <FieldRow key={index}>
              {(["id", "label", "phone"] as const).map((key) => (
                <Field key={key}>
                  {t({ id: "ID", label: "Name", phone: "Phone" }[key])}
                  <Input
                    required={key !== "phone"}
                    value={target[key]}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        targets: c.targets.map((v, i) =>
                          i === index ? { ...v, [key]: e.target.value } : v,
                        ),
                      }))
                    }
                  />
                </Field>
              ))}
              <Button
                variant="text"
                onClick={() =>
                  setConfig((c) => ({
                    ...c,
                    targets: c.targets.filter((_, i) => i !== index),
                  }))
                }
              >
                {t("Remove")}
              </Button>
            </FieldRow>
          ))}
          <Button
            variant="secondary"
            onClick={() =>
              setConfig((c) => ({
                ...c,
                targets: [
                  ...c.targets,
                  {
                    id: "zone-" + (c.targets.length + 1),
                    label: "New zone",
                    phone: "",
                  },
                ],
              }))
            }
          >
            {t("Add")}
          </Button>
          <h2>{t("Teams")}</h2>
          {config.teams.map((team, index) => (
            <FieldRow key={index}>
              <Field>
                {t("ID")}
                <Input
                  required
                  value={team.id}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      teams: c.teams.map((v, i) =>
                        i === index ? { ...v, id: e.target.value } : v,
                      ),
                    }))
                  }
                />
              </Field>
              <Field>
                {t("Name")}
                <Input
                  required
                  value={team.label}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      teams: c.teams.map((v, i) =>
                        i === index ? { ...v, label: e.target.value } : v,
                      ),
                    }))
                  }
                />
              </Field>
              <Field>
                {t("Team Leader")}
                <Select
                  value={team.leaderId}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      teams: c.teams.map((v, i) =>
                        i === index ? { ...v, leaderId: e.target.value } : v,
                      ),
                    }))
                  }
                >
                  <option value="">—</option>
                  {board.people
                    .filter((p) =>
                      ["team-leader", "administrator"].includes(p.profile),
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </Select>
              </Field>
              <Button
                variant="text"
                onClick={() =>
                  setConfig((c) => ({
                    ...c,
                    teams: c.teams.filter((_, i) => i !== index),
                  }))
                }
              >
                {t("Remove")}
              </Button>
            </FieldRow>
          ))}
          <Button
            variant="secondary"
            onClick={() =>
              setConfig((c) => ({
                ...c,
                teams: [
                  ...c.teams,
                  {
                    id: "team-" + (c.teams.length + 1),
                    label: "New team",
                    leaderId: "",
                  },
                ],
              }))
            }
          >
            {t("Add")}
          </Button>
          <Actions>
            <Button type="submit" disabled={pending}>
              {t("Save")}
            </Button>
          </Actions>
        </form>
      </Panel>
      <Panel>
        <h2>{t("Worker profiles")}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save({
              kind: "worker",
              id: userId,
              expectedRevision:
                entries(board, "worker").find((r) => r.id === userId)
                  ?.revision ?? 0,
              deleted: false,
              data: { userId, teamId, homeTargetId: targetId },
            });
          }}
        >
          <FieldRow>
            <Field>
              {t("Person")}
              <Select
                required
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  const worker = entries(board, "worker").find(
                    (r) => r.id === e.target.value,
                  )?.data;
                  setTeamId(worker?.teamId ?? "");
                  setTargetId(worker?.homeTargetId ?? "");
                }}
              >
                <option value="">{t("Select a person")}</option>
                {board.people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              {t("Team")}
              <Select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
              >
                <option value="">—</option>
                {board.settings.teams.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              {t("Home zone")}
              <Select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              >
                <option value="">—</option>
                {board.settings.targets.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </Field>
          </FieldRow>
          <Button type="submit" disabled={pending || !userId}>
            {t("Save")}
          </Button>
        </form>
      </Panel>
    </>
  );
}
