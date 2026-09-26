import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
export class DemoUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
}
export class DemoScopeDto {
  @ApiProperty() organizationId!: string;
  @ApiProperty() siteId!: string;
  @ApiProperty() sourceId!: string;
  @ApiProperty() siteTimeZone!: string;
}
export class DemoContextDto {
  @ApiProperty() enabled!: boolean;
  @ApiProperty({ type: [DemoUserDto] }) users!: DemoUserDto[];
  @ApiProperty({ type: DemoUserDto, nullable: true }) user!: DemoUserDto | null;
  @ApiProperty({ type: DemoScopeDto, nullable: true })
  scope!: DemoScopeDto | null;
}
export class SwitchUserDto {
  @ApiProperty() userId!: string;
}
export class ImportSummaryDto {
  @ApiProperty() importId!: string;
  @ApiProperty() originalFilename!: string;
  @ApiProperty() reportingDate!: string;
  @ApiProperty({ enum: ["received", "succeeded", "rejected", "failed"] })
  outcome!: "received" | "succeeded" | "rejected" | "failed";
  @ApiProperty() receivedAt!: string;
  @ApiProperty() submittedBy!: string;
  @ApiProperty({ type: Number, nullable: true }) admittedRecordCount!:
    | number
    | null;
  @ApiProperty({ type: String, nullable: true }) reasonCode!: string | null;
  @ApiProperty() byteLength!: number;
}
export class DiagnosticDto {
  @ApiProperty() code!: string;
  @ApiPropertyOptional() line?: number;
  @ApiPropertyOptional() field?: string;
  @ApiPropertyOptional() reason?: string;
}
export class ImportReviewDto {
  @ApiProperty() importId!: string;
  @ApiProperty() rawId!: string;
  @ApiProperty() sourceId!: string;
  @ApiProperty() reportingDate!: string;
  @ApiProperty() originalFilename!: string;
  @ApiProperty() sha256!: string;
  @ApiProperty() byteLength!: number;
  @ApiProperty({ enum: ["received", "succeeded", "rejected", "failed"] })
  outcome!: "received" | "succeeded" | "rejected" | "failed";
  @ApiProperty({ type: Number, nullable: true }) dataRecordCount!:
    | number
    | null;
  @ApiProperty({ type: Number, nullable: true }) admittedRecordCount!:
    | number
    | null;
  @ApiProperty({ type: Number, nullable: true }) rejectedRecordCount!:
    | number
    | null;
  @ApiProperty({ type: String, nullable: true }) reasonCode!: string | null;
  @ApiProperty() inspectedValidCount!: number;
  @ApiProperty() inspectedInvalidCount!: number;
  @ApiProperty() inspectionComplete!: boolean;
  @ApiProperty() unclassifiedCount!: number;
  @ApiProperty() repeatedCount!: number;
  @ApiProperty({ type: [DiagnosticDto] }) diagnostics!: DiagnosticDto[];
  @ApiProperty() diagnosticsTruncated!: boolean;
}
export class AvailabilityDto {
  @ApiProperty() revision!: string;
  @ApiProperty({ type: [String] }) dates!: string[];
  @ApiProperty({ type: String, nullable: true }) latestDate!: string | null;
  @ApiProperty() siteTimeZone!: string;
}
export class SelectionDto {
  @ApiProperty({ description: "Inclusive Gregorian reporting-date label." })
  from!: string;
  @ApiProperty({
    description: "Exclusive reporting-date label. Maximum range: 366 days.",
  })
  toExclusive!: string;
  @ApiPropertyOptional({ type: [String] }) sectors?: string[];
  @ApiPropertyOptional({ type: [String] }) areas?: string[];
  @ApiPropertyOptional({ type: [String] }) equipment?: string[];
  @ApiPropertyOptional({ type: [String] }) messages?: string[];
  @ApiPropertyOptional({ type: [String] }) excludedMessages?: string[];
}
export class AnalyticalRequestDto extends SelectionDto {
  @ApiProperty() revision!: string;
  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  pageSize?: number;
  @ApiPropertyOptional() cursor?: string;
}
export class OptionRequestDto {
  @ApiProperty({ enum: ["sector", "area", "equipment", "message"] }) kind!:
    | "sector"
    | "area"
    | "equipment"
    | "message";
  @ApiProperty() revision!: string;
  @ApiPropertyOptional() cursor?: string;
  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  pageSize?: number;
}
export class OptionDto {
  @ApiProperty() reference!: string;
  @ApiProperty() label!: string;
}
export class OptionsDto {
  @ApiProperty() revision!: string;
  @ApiProperty({ type: [OptionDto] }) options!: OptionDto[];
  @ApiProperty({ type: String, nullable: true }) nextCursor!: string | null;
}
export class GroupDto extends OptionDto {
  @ApiProperty() reportedFrequency!: number;
  @ApiProperty() accumulatedAlarmSeconds!: number;
  @ApiProperty() recordCount!: number;
}
export class GroupsDto {
  @ApiProperty({ type: [GroupDto] }) sector!: GroupDto[];
  @ApiProperty({ type: [GroupDto] }) area!: GroupDto[];
  @ApiProperty({ type: [GroupDto] }) equipment!: GroupDto[];
  @ApiProperty({ type: [GroupDto] }) message!: GroupDto[];
}
export class GroupCountsDto {
  @ApiProperty() sector!: number;
  @ApiProperty() area!: number;
  @ApiProperty() equipment!: number;
  @ApiProperty() message!: number;
}
export class FactDto {
  @ApiProperty() importId!: string;
  @ApiProperty() rawId!: string;
  @ApiProperty() reportingDate!: string;
  @ApiProperty() sourceRecordNumber!: number;
  @ApiProperty() reportedFrequency!: number;
  @ApiProperty() accumulatedAlarmSeconds!: number;
  @ApiProperty() originalDuration!: string;
  @ApiProperty() sourceArea!: string;
  @ApiProperty() sourceEquipmentReference!: string;
  @ApiProperty() sourceMessageText!: string;
  @ApiProperty() sourceMessageType!: string;
  @ApiProperty() sourceMessageGroup!: string;
  @ApiProperty() repeatedTuple!: boolean;
  @ApiProperty({ enum: ["mapped", "unclassified"] }) classificationStatus!:
    | "mapped"
    | "unclassified";
  @ApiProperty({ type: String, nullable: true }) sectorKey!: string | null;
  @ApiProperty() sectorLabel!: string;
  @ApiProperty() sectorRef!: string;
  @ApiProperty() areaRef!: string;
  @ApiProperty() equipmentRef!: string;
  @ApiProperty() messageRef!: string;
  @ApiProperty() mappingRevision!: string;
  @ApiProperty() adapterRevision!: string;
  @ApiProperty() profileRevision!: string;
  @ApiProperty() siteTimeZone!: string;
}
export class AnalysisDto {
  @ApiProperty() revision!: string;
  @ApiProperty({ type: SelectionDto }) selection!: SelectionDto;
  @ApiProperty() recordCount!: number;
  @ApiProperty() reportedFrequency!: number;
  @ApiProperty() accumulatedAlarmSeconds!: number;
  @ApiProperty({ type: [String] }) admittedDates!: string[];
  @ApiProperty({ type: [String] }) missingDates!: string[];
  @ApiProperty({ enum: ["no-imports", "no-matches", "ready"] }) state!:
    | "no-imports"
    | "no-matches"
    | "ready";
  @ApiProperty() unclassifiedCount!: number;
  @ApiProperty() repeatedCount!: number;
  @ApiProperty({ type: [FactDto] }) records!: FactDto[];
  @ApiProperty({ type: String, nullable: true }) nextCursor!: string | null;
  @ApiProperty({ type: GroupsDto }) groups!: GroupsDto;
  @ApiProperty({ type: GroupCountsDto }) groupCounts!: GroupCountsDto;
  @ApiProperty({ enum: ["unknown"] }) reportingWindowStatus!: "unknown";
}
