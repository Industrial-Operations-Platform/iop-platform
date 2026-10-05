import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { Status } from "../modules/maintenance/domain/maintenance";
export class MaintenancePriorityDto {
  @ApiProperty() id!: string;
  @ApiProperty({ maxLength: 80 }) label!: string;
  @ApiProperty({ minimum: 0, maximum: 100 }) rank!: number;
}
export class MaintenanceSettingsDto {
  @ApiProperty({ minimum: 0 }) revision!: number;
  @ApiProperty({ type: [MaintenancePriorityDto], minItems: 1, maxItems: 20 })
  priorities!: MaintenancePriorityDto[];
}
export class MaintenanceConfigureDto {
  @ApiProperty({ minimum: 0 }) expectedRevision!: number;
  @ApiProperty({ type: [MaintenancePriorityDto], minItems: 1, maxItems: 20 })
  priorities!: MaintenancePriorityDto[];
}
export class MaintenanceDataDto {
  @ApiProperty({ maxLength: 160 }) title!: string;
  @ApiProperty({ maxLength: 8000 }) details!: string;
  @ApiProperty() locationId!: string;
  @ApiProperty() assetId!: string;
  @ApiProperty() priorityId!: string;
  @ApiProperty() assigneeId!: string;
  @ApiProperty() teamId!: string;
  @ApiProperty({ enum: ["open", "in-progress", "blocked", "done"] })
  status!: Status;
  @ApiProperty({ description: "Optional calendar due date, or empty string." })
  dueDate!: string;
  @ApiProperty({ maxLength: 4000 }) outcome!: string;
  @ApiProperty({ maxLength: 2000 }) blockedReason!: string;
  @ApiProperty({ maxLength: 200 }) externalReference!: string;
}
export class MaintenanceRecordDto {
  @ApiProperty() id!: string;
  @ApiProperty() revision!: number;
  @ApiProperty({ type: MaintenanceDataDto }) data!: MaintenanceDataDto;
  @ApiProperty() authorId!: string;
  @ApiProperty() authorName!: string;
  @ApiProperty({ format: "date-time" }) createdAt!: string;
  @ApiProperty({ format: "date-time" }) updatedAt!: string;
  @ApiProperty() locationLabel!: string;
  @ApiProperty() assetName!: string;
  @ApiProperty() priorityLabel!: string;
  @ApiProperty() assigneeName!: string;
  @ApiProperty() teamLabel!: string;
}
export class MaintenanceViewDto extends MaintenanceRecordDto {
  @ApiProperty() canEdit!: boolean;
  @ApiProperty() canReassign!: boolean;
}
export class MaintenanceSaveDto {
  @ApiProperty() id!: string;
  @ApiProperty({ minimum: 0 }) expectedRevision!: number;
  @ApiProperty({ type: MaintenanceDataDto }) data!: MaintenanceDataDto;
  @ApiProperty({
    maxLength: 2000,
    description: "Required explanation for edits and reopening.",
  })
  reason!: string;
}
export class MaintenanceSelectionDto {
  @ApiPropertyOptional({ enum: ["", "open", "in-progress", "blocked", "done"] })
  status?: Status | "";
  @ApiPropertyOptional() priorityId?: string;
  @ApiPropertyOptional({
    description: "Configured location and its descendants.",
  })
  locationId?: string;
  @ApiPropertyOptional() assetId?: string;
  @ApiPropertyOptional() assigneeId?: string;
  @ApiPropertyOptional() teamId?: string;
  @ApiPropertyOptional({ maxLength: 200 }) search?: string;
  @ApiPropertyOptional() dueFrom?: string;
  @ApiPropertyOptional() dueTo?: string;
  @ApiPropertyOptional({ maxLength: 300 }) cursor?: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  limit?: number;
}
export class MaintenanceCountsDto {
  @ApiProperty() open!: number;
  @ApiProperty() "in-progress"!: number;
  @ApiProperty() blocked!: number;
  @ApiProperty() done!: number;
}
export class MaintenancePageDto {
  @ApiProperty({ type: [MaintenanceViewDto] }) records!: MaintenanceViewDto[];
  @ApiProperty() total!: number;
  @ApiProperty() nextCursor!: string;
  @ApiProperty({
    type: MaintenanceCountsDto,
    description: "Counts under all filters except the selected status.",
  })
  statusCounts!: MaintenanceCountsDto;
}
export class MaintenancePersonDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
}
export class MaintenanceTeamDto {
  @ApiProperty() id!: string;
  @ApiProperty() label!: string;
}
export class MaintenanceLocationDto extends MaintenanceTeamDto {
  @ApiProperty() parentId!: string;
}
export class MaintenanceAssetDto extends MaintenancePersonDto {
  @ApiProperty() locationId!: string;
  @ApiProperty({ enum: ["unverified", "validated", "retired"] }) status!:
    | "unverified"
    | "validated"
    | "retired";
}
export class MaintenanceCatalogDto {
  @ApiProperty() actorId!: string;
  @ApiProperty() canContribute!: boolean;
  @ApiProperty() canCoordinate!: boolean;
  @ApiProperty() canAdminister!: boolean;
  @ApiProperty({ type: MaintenanceSettingsDto })
  settings!: MaintenanceSettingsDto;
  @ApiProperty({ type: [MaintenancePersonDto] })
  people!: MaintenancePersonDto[];
  @ApiProperty({ type: [MaintenanceTeamDto] }) teams!: MaintenanceTeamDto[];
  @ApiProperty({ type: [MaintenanceLocationDto] })
  locations!: MaintenanceLocationDto[];
  @ApiProperty({ type: [MaintenanceAssetDto] }) assets!: MaintenanceAssetDto[];
}
export class MaintenanceHistoryRequestDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({
    minimum: 0,
    description: "Exclusive revision boundary; zero starts at latest.",
  })
  before?: number;
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  limit?: number;
}
export class MaintenanceRevisionDto {
  @ApiProperty({ type: MaintenanceRecordDto }) record!: MaintenanceRecordDto;
  @ApiProperty() actorId!: string;
  @ApiProperty() actorName!: string;
  @ApiProperty({ format: "date-time" }) at!: string;
  @ApiProperty({ enum: ["created", "updated", "status-changed"] })
  action!: string;
  @ApiProperty() reason!: string;
}
export class MaintenanceHistoryDto {
  @ApiProperty({ type: MaintenanceViewDto }) record!: MaintenanceViewDto;
  @ApiProperty({ type: [MaintenanceRevisionDto] })
  revisions!: MaintenanceRevisionDto[];
  @ApiProperty() nextBefore!: number;
}
