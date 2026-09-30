import { ApiProperty } from "@nestjs/swagger";
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
