import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type {
  Kind,
  Payloads,
  ScheduleStatus,
} from "../modules/workforce/domain/workforce";
export class WorkforceRangeDto {
  @ApiProperty({ format: "date" }) from!: string;
  @ApiProperty({ format: "date" }) to!: string;
}
export class WorkforceRecordDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ["settings", "worker", "schedule", "assignment"] })
  kind!: Kind;
  @ApiProperty() revision!: number;
  @ApiProperty() deleted!: boolean;
  @ApiProperty() personName!: string;
  @ApiProperty({
    type: Object,
    description:
      "Kind-specific Workforce payload; see docs/development/workforce.md.",
  })
  data!: Payloads[Kind];
}
export class WorkforceSaveDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ["settings", "worker", "schedule", "assignment"] })
  kind!: Kind;
  @ApiProperty() expectedRevision!: number;
  @ApiProperty() deleted!: boolean;
  @ApiProperty({ type: Object }) data!: Payloads[Kind];
}
export class WorkforcePersonDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() profile!: string;
}
export class WorkforceBoardDto {
  @ApiProperty() actorId!: string;
  @ApiProperty() timeZone!: string;
  @ApiProperty() canPlan!: boolean;
  @ApiProperty() canAdminister!: boolean;
  @ApiProperty({ type: [WorkforcePersonDto] }) people!: WorkforcePersonDto[];
  @ApiProperty({ type: Object }) settings!: object;
  @ApiProperty({ type: [WorkforceRecordDto] }) records!: WorkforceRecordDto[];
}
export class WorkforceImportDto {
  @ApiProperty({ enum: ["csv", "email"] }) format!: "csv" | "email";
  @ApiProperty({ maxLength: 80000 }) text!: string;
  @ApiProperty({
    description: "Explicit target user for an email; CSV has userId per row.",
  })
  userId!: string;
}
export class WorkforceImportRevisionDto {
  @ApiProperty() id!: string;
  @ApiProperty() expectedRevision!: number;
}
export class WorkforceCommitDto {
  @ApiProperty({ type: WorkforceImportDto }) input!: WorkforceImportDto;
  @ApiProperty({ type: [WorkforceImportRevisionDto] })
  revisions!: WorkforceImportRevisionDto[];
}
export class WorkforcePreviewDto extends WorkforceImportRevisionDto {
  @ApiProperty({ type: Object }) data!: object;
  @ApiProperty({ enum: ["create", "replace", "unchanged"] }) outcome!: string;
}
export class WorkforceResultDto {
  @ApiProperty() changed!: number;
  @ApiProperty() unchanged!: number;
}
export class WorkforceHistoryRequestDto {
  @ApiProperty({ enum: ["settings", "worker", "schedule", "assignment"] })
  kind!: Kind;
  @ApiProperty() id!: string;
}
export class WorkforceRevisionDto {
  @ApiProperty({ type: WorkforceRecordDto }) record!: WorkforceRecordDto;
  @ApiProperty() actorId!: string;
  @ApiProperty() actorName!: string;
  @ApiProperty() at!: string;
  @ApiProperty() action!: string;
}

export class WorkforceWeekDayDto {
  @ApiProperty({ format: "date" }) date!: string;
  @ApiProperty({
    enum: [
      "work",
      "compensation",
      "training",
      "maintenance",
      "vacation",
      "accident",
      "sick",
      "off",
    ],
  })
  status!: ScheduleStatus;
  @ApiProperty() start!: string;
  @ApiProperty() end!: string;
  @ApiProperty({ minimum: 0 }) expectedRevision!: number;
}
export class WorkforceWeekDto {
  @ApiProperty() userId!: string;
  @ApiProperty({
    format: "date",
    description: "Monday starting the edited week.",
  })
  weekStart!: string;
  @ApiProperty({ type: [WorkforceWeekDayDto], minItems: 1, maxItems: 7 })
  days!: WorkforceWeekDayDto[];
}

export class WorkforcePersonalShiftDto {
  @ApiProperty() id!: string;
  @ApiProperty() label!: string;
  @ApiProperty() count!: number;
  @ApiProperty() percentage!: number;
}
export class WorkforcePersonalSummaryDto {
  @ApiProperty() actorId!: string;
  @ApiProperty() today!: string;
  @ApiProperty() currentFrom!: string;
  @ApiProperty() previousFrom!: string;
  @ApiProperty() previousTo!: string;
  @ApiProperty() homeTargetId!: string;
  @ApiProperty() homeTargetLabel!: string;
  @ApiProperty() teamLabel!: string;
  @ApiProperty() scheduledDays!: number;
  @ApiProperty({ type: [WorkforcePersonalShiftDto] }) shifts!: WorkforcePersonalShiftDto[];
  @ApiProperty() saturdays!: number;
  @ApiProperty() sundays!: number;
}

export class WorkforceProposalDto {
  @ApiProperty({ type: [WorkforceWeekDto], minItems: 1, maxItems: 100 })
  weeks!: WorkforceWeekDto[];
  @ApiPropertyOptional({ description: "Preview and atomically apply dependent full-shift duty moves/removals with schedule edits." })
  replanAssignments?: boolean;
  @ApiPropertyOptional({ type: [WorkforceImportRevisionDto], description: "Exact active dependent-duty revisions returned by preview, required when saving with replanning." })
  assignmentRevisions?: WorkforceImportRevisionDto[];
}
export class WorkforceProposalPreviewRequestDto extends WorkforceProposalDto {
  @ApiProperty({ type: [WorkforceWeekDto], minItems: 0, maxItems: 100, description: "An empty list views saved schedules without changes." })
  declare weeks: WorkforceWeekDto[];
  @ApiProperty({ format: "date", description: "Inclusive analysis period, at most 93 days, containing the entire edited week." }) from!: string;
  @ApiProperty({ format: "date" }) to!: string;
}
export class WorkforceShiftLoadDto {
  @ApiProperty() id!: string;
  @ApiProperty() label!: string;
  @ApiProperty() count!: number;
}
export class WorkforceScheduleLoadDto {
  @ApiProperty() days!: number;
  @ApiProperty({ description: "Elapsed scheduled minutes, including training and maintenance; not attendance or paid time." }) minutes!: number;
  @ApiProperty() saturdays!: number;
  @ApiProperty() sundays!: number;
  @ApiProperty() unknownDays!: number;
  @ApiProperty({ type: [WorkforceShiftLoadDto] }) shifts!: WorkforceShiftLoadDto[];
}
export class WorkforcePersonLoadDto {
  @ApiProperty() userId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: WorkforceScheduleLoadDto }) before!: WorkforceScheduleLoadDto;
  @ApiProperty({ type: WorkforceScheduleLoadDto }) after!: WorkforceScheduleLoadDto;
}
export class WorkforceProposalIssueDto {
  @ApiProperty() userId!: string;
  @ApiProperty({ format: "date" }) date!: string;
  @ApiProperty() assignmentId!: string;
  @ApiProperty({ enum: ["custom-hours", "assignment-conflict"] }) code!: string;
}
export class WorkforceAssignmentIntervalDto {
  @ApiProperty() shiftId!: string;
  @ApiProperty() start!: string;
  @ApiProperty() end!: string;
}
export class WorkforceProposalAssignmentChangeDto {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty({ format: "date" }) date!: string;
  @ApiProperty({ enum: ["move", "remove"] }) action!: string;
  @ApiProperty() targetLabel!: string;
  @ApiProperty() phoneLabel!: string;
  @ApiProperty({ type: WorkforceAssignmentIntervalDto }) before!: WorkforceAssignmentIntervalDto;
  @ApiProperty({ type: WorkforceAssignmentIntervalDto, nullable: true }) after!: WorkforceAssignmentIntervalDto | null;
}
export class WorkforceProposalPreviewDto extends WorkforceRangeDto {
  @ApiProperty({ type: [WorkforcePersonLoadDto] }) people!: WorkforcePersonLoadDto[];
  @ApiProperty() canSave!: boolean;
  @ApiProperty({ type: [WorkforceProposalIssueDto] }) issues!: WorkforceProposalIssueDto[];
  @ApiProperty({ type: [WorkforceProposalAssignmentChangeDto] }) assignmentChanges!: WorkforceProposalAssignmentChangeDto[];
  @ApiProperty({ type: [WorkforceImportRevisionDto] }) assignmentRevisions!: WorkforceImportRevisionDto[];
}
