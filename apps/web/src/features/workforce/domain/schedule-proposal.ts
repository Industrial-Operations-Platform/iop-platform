import { weekDates, type Board } from "./models";
import { changedDays, weekDrafts, type ScheduleDayDraft, type WeeklyScheduleInput } from "./weekly-schedule";

export interface ScheduleProposal {
  weeks: WeeklyScheduleInput[];
  replanAssignments?: boolean;
  assignmentRevisions?: { id: string; expectedRevision: number }[];
}
export interface ScheduleProposalPreviewRequest extends ScheduleProposal { from: string; to: string }
export interface ScheduleLoad {
  days: number;
  minutes: number;
  saturdays: number;
  sundays: number;
  unknownDays: number;
  shifts: { id: string; label: string; count: number }[];
}
export interface ScheduleProposalPreview {
  from: string;
  to: string;
  people: { userId: string; name: string; before: ScheduleLoad; after: ScheduleLoad }[];
  canSave: boolean;
  issues: { userId: string; date: string; assignmentId: string; code: "custom-hours" | "assignment-conflict" }[];
  assignmentRevisions: { id: string; expectedRevision: number }[];
  assignmentChanges: {
    id: string;
    userId: string;
    date: string;
    action: "move" | "remove";
    targetLabel: string;
    phoneLabel: string;
    before: { shiftId: string; start: string; end: string };
    after: { shiftId: string; start: string; end: string } | null;
  }[];
}
export type ProposalDrafts = Record<string, ScheduleDayDraft[]>;
export function proposalInput(board: Board, weekStart: string, drafts: ProposalDrafts): ScheduleProposal {
  return { weeks: Object.entries(drafts).map(([userId, days]) => ({
    userId, weekStart, days: changedDays(weekDrafts(board, userId, weekStart), days),
  })).filter((week) => week.days.length > 0) };
}
export function defaultAnalysisPeriod(weekStart: string) {
  return { from: weekStart.slice(0, 8) + "01", to: weekDates(weekStart)[6] };
}
