import type { Settings } from "../../modules/workforce/domain/workforce";
/** Initial site configuration from the owner's plan; core logic uses only IDs and intervals. */
export function workforceDefaults(
  locations: { id: string; label: string; role: string }[],
): Settings {
  return {
    shifts: [
      {
        id: "early",
        label: "Frühschicht",
        start: "05:00",
        end: "14:15",
        days: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        id: "late",
        label: "Spätschicht",
        start: "13:45",
        end: "23:00",
        days: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        id: "middle",
        label: "Mittelschicht",
        start: "08:45",
        end: "18:00",
        days: [0, 1, 2, 3, 4, 5, 6],
      },
    ],
    targets: locations
      .filter((l) => l.role === "department")
      .map((l) => ({ id: l.id, label: l.label, phone: `${l.label} · Handy` })),
    teams: [],
  };
}
