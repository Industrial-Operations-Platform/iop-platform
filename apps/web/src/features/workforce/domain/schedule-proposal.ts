import { weekDates, type Board } from "./models";
import { changedDays, weekDrafts, type ScheduleDayDraft, type WeeklyScheduleInput } from "./weekly-schedule";

export interface ScheduleProposal { weeks: WeeklyScheduleInput[] }
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
