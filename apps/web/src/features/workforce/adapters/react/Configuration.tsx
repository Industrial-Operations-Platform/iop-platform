import { useState } from "react";
import {
  Actions,
  Button,
  DeleteButton,
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
    [targetId, setTargetId] = useState(""),
    [technicalLevelId, setTechnicalLevelId] = useState("");
  const current = entries(board, "settings")[0];
  const selectWorker = (id: string) => {
    setUserId(id);
    const worker = entries(board, "worker").find((record) => record.id === id)?.data;
    setTeamId(worker?.teamId ?? "");
    setTargetId(worker?.homeTargetId ?? "");
    setTechnicalLevelId(worker?.technicalLevelId ?? "");
  };
  return (
    <>
      <Panel>
        <form
          className="workforce-configuration-form"
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
          <fieldset className="workforce-config-fields" disabled={pending}>
            <section className="workforce-config-section">
              <div className="workforce-config-heading">
                <h2>{t("Shift definitions")}</h2>
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
                  {t("Add shift")}
                </Button>
              </div>
              {config.shifts.map((s, index) => (
                <FieldRow className="workforce-config-row" key={index}>
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
                  <DeleteButton
                    label={t("Remove {0}", [s.label])}
                    onClick={() =>
                      setConfig((c) => ({
                        ...c,
                        shifts: c.shifts.filter((_, i) => i !== index),
                      }))
                    }
                  />
                </FieldRow>
              ))}
            </section>
            <section className="workforce-config-section">
              <div className="workforce-config-heading">
                <h2>{t("Targets and phones")}</h2>
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
                  {t("Add zone")}
                </Button>
              </div>
              <p>{t("Keep phone labels unique across zones.")}</p>
              {config.targets.map((target, index) => (
                <FieldRow className="workforce-config-row" key={index}>
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
                  <DeleteButton
                    label={t("Remove {0}", [target.label])}
                    onClick={() =>
                      setConfig((c) => ({
                        ...c,
                        targets: c.targets.filter((_, i) => i !== index),
                      }))
                    }
                  />
                </FieldRow>
              ))}
            </section>
            <section className="workforce-config-section">
              <div className="workforce-config-heading">
                <h2>{t("Teams")}</h2>
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
                  {t("Add team")}
                </Button>
              </div>
              {config.teams.map((team, index) => (
                <FieldRow className="workforce-config-row" key={index}>
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
                            i === index
                              ? { ...v, leaderId: e.target.value }
                              : v,
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
                  <DeleteButton
                    label={t("Remove {0}", [team.label])}
                    onClick={() =>
                      setConfig((c) => ({
                        ...c,
                        teams: c.teams.filter((_, i) => i !== index),
                      }))
                    }
                  />
                </FieldRow>
              ))}
            </section>
            <section className="workforce-config-section">
              <div className="workforce-config-heading">
                <h2>{t("Technical levels")}</h2>
                <Button variant="secondary" onClick={() => setConfig((value) => ({
                  ...value, technicalLevels: [...(value.technicalLevels ?? []), {
                    id: "level-" + ((value.technicalLevels?.length ?? 0) + 1), label: "New level",
                  }],
                }))}>{t("Add technical level")}</Button>
              </div>
              {(config.technicalLevels ?? []).map((level, index) => (
                <FieldRow className="workforce-config-row" key={index}>
                  {(["id", "label"] as const).map((key) => (
                    <Field key={key}>{t(key === "id" ? "ID" : "Name")}
                      <Input required value={level[key]} onChange={(event) => setConfig((value) => ({
                        ...value, technicalLevels: value.technicalLevels?.map((item, i) => i === index ? { ...item, [key]: event.target.value } : item),
                      }))} />
                    </Field>
                  ))}
                  <DeleteButton label={t("Remove {0}", [level.label])} onClick={() => setConfig((value) => ({
                    ...value, technicalLevels: value.technicalLevels?.filter((_, i) => i !== index),
                  }))} />
                </FieldRow>
              ))}
            </section>
            <Actions className="iop-form-actions">
              <Button type="submit" disabled={pending}>
                {t("Save configuration")}
              </Button>
            </Actions>
          </fieldset>
        </form>
      </Panel>
      <Panel>
        <h2>{t("Worker profiles")}</h2>
        <p className="workforce-availability">{t("Primary teams organize people. Every authorized Team Leader can still coordinate all workers.")}</p>
        <form
          className="workforce-configuration-form"
          onSubmit={(e) => {
            e.preventDefault();
            save({
              kind: "worker",
              id: userId,
              expectedRevision:
                entries(board, "worker").find((r) => r.id === userId)
                  ?.revision ?? 0,
              deleted: false,
              data: { userId, teamId, homeTargetId: targetId, technicalLevelId },
            });
          }}
        >
          <fieldset className="workforce-config-fields" disabled={pending}>
            <FieldRow>
              <Field>
                {t("Person")}
                <Select
                  required
                  value={userId}
                  onChange={(e) => selectWorker(e.target.value)}
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
                {t("Primary team")}
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
                {t("Technical level")}
                <Select value={technicalLevelId} onChange={(event) => setTechnicalLevelId(event.target.value)}>
                  <option value="">{t("Not specified")}</option>
                  {(board.settings.technicalLevels ?? []).map((level) => (
                    <option key={level.id} value={level.id}>{level.label}</option>
                  ))}
                  {technicalLevelId && !board.settings.technicalLevels?.some((level) => level.id === technicalLevelId) && (
                    <option value={technicalLevelId}>{t("Retired technical level")}</option>
                  )}
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
            <Actions className="iop-form-actions">
              <Button type="submit" disabled={pending || !userId}>
                {t("Save worker profile")}
              </Button>
            </Actions>
          </fieldset>
        </form>
        <div className="workforce-team-rosters">
          {[...board.settings.teams, { id: "", label: t("No primary team"), leaderId: "" }].map((team) => {
            const members = board.people.filter((person) => !["administrator", "team-leader"].includes(person.profile) &&
              (entries(board, "worker").find((record) => record.id === person.id)?.data.teamId ?? "") === team.id);
            const leader = board.people.find((person) => person.id === team.leaderId);
            return <section className="workforce-team-roster" key={team.id}>
              <h3>{team.label}{leader ? ` · ${leader.name}` : ""}</h3>
              {members.length ? <ul>{members.map((person) => {
                const worker = entries(board, "worker").find((record) => record.id === person.id)?.data;
                const level = board.settings.technicalLevels?.find((item) => item.id === worker?.technicalLevelId)?.label ?? worker?.technicalLevelLabel;
                return <li key={person.id}><Button variant="text" onClick={() => selectWorker(person.id)}>{person.name}</Button>
                  <small>{level || t("Not specified")}</small></li>;
              })}</ul> : <p className="workforce-empty">{t("No workers in this team")}</p>}
            </section>;
          })}
        </div>
      </Panel>
    </>
  );
}
