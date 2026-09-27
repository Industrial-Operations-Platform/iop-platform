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
  @ApiProperty() canImport!: boolean;
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

export class NormalizationDto {
  @ApiProperty() trim!: boolean;
  @ApiProperty() unicodeNfc!: boolean;
  @ApiProperty() collapseWhitespace!: boolean;
}
export class AreaSectorDto {
  @ApiProperty() area!: string;
  @ApiProperty() sector!: string;
}
export class ValueAliasDto {
  @ApiProperty({
    enum: ["area", "equipment", "message", "type", "messageGroup"],
  })
  field!: "area" | "equipment" | "message" | "type" | "messageGroup";
  @ApiProperty() from!: string;
  @ApiProperty() to!: string;
}
export class ReportingProfileDto {
  @ApiProperty({ type: NormalizationDto }) normalization!: NormalizationDto;
  @ApiProperty() unclassifiedLabel!: string;
  @ApiProperty({ type: [AreaSectorDto] }) areaSectors!: AreaSectorDto[];
  @ApiProperty({ type: [ValueAliasDto] }) aliases!: ValueAliasDto[];
}
export class ProfileResultDto {
  @ApiProperty() version!: string;
  @ApiProperty({ type: ReportingProfileDto }) profile!: ReportingProfileDto;
}
export class ReportRequestDto {
  @ApiProperty() from!: string;
  @ApiProperty() toExclusive!: string;
  @ApiProperty({
    enum: [
      "sector",
      "area",
      "equipment",
      "message",
      "type",
      "messageGroup",
      "frequency",
      "duration",
    ],
  })
  dimension!:
    | "sector"
    | "area"
    | "equipment"
    | "message"
    | "type"
    | "messageGroup"
    | "frequency"
    | "duration";
  @ApiProperty({ enum: ["day", "week", "month"] }) period!:
    | "day"
    | "week"
    | "month";
  @ApiProperty({ enum: ["frequency", "duration"] }) metric!:
    | "frequency"
    | "duration";
  @ApiPropertyOptional({
    type: "object",
    additionalProperties: { type: "array", items: { type: "string" } },
  })
  filters?: Record<string, string[]>;
  @ApiPropertyOptional() search?: string;
  @ApiPropertyOptional() page?: number;
  @ApiPropertyOptional() revision?: string;
}
export class ReportRowDto {
  @ApiProperty() key!: string;
  @ApiProperty() frequency!: number;
  @ApiProperty() seconds!: number;
  @ApiProperty() minutes!: number;
  @ApiProperty() records!: number;
}
export class ReportPointDto extends ReportRowDto {
  @ApiProperty() period!: string;
}
export class ReportRecordDto {
  @ApiProperty() area!: string;
  @ApiProperty() equipment!: string;
  @ApiProperty() message!: string;
  @ApiProperty() type!: string;
  @ApiProperty() messageGroup!: string;
  @ApiProperty() sector!: string;
  @ApiProperty() date!: string;
  @ApiProperty() importId!: string;
  @ApiProperty() line!: number;
  @ApiProperty() frequency!: number;
  @ApiProperty() seconds!: number;
  @ApiProperty() minutes!: number;
}
export class ExecutiveLeaderDto extends ReportRowDto {
  @ApiProperty({ enum: ["sector", "area", "equipment", "message"] })
  dimension!: "sector" | "area" | "equipment" | "message";
  @ApiProperty({ enum: ["frequency", "duration"] }) metric!:
    | "frequency"
    | "duration";
}
export class ReportDto {
  @ApiProperty() revision!: string;
  @ApiProperty() profileVersion!: string;
  @ApiProperty({ type: ReportRequestDto }) selection!: ReportRequestDto;
  @ApiProperty({ type: ReportRowDto }) totals!: ReportRowDto;
  @ApiProperty({ type: [ExecutiveLeaderDto] }) executive!: ExecutiveLeaderDto[];
  @ApiProperty({ type: [ReportRowDto] }) groups!: ReportRowDto[];
  @ApiProperty({ type: [ReportRowDto] }) durationGroups!: ReportRowDto[];
  @ApiProperty() groupCount!: number;
  @ApiProperty({ type: [ReportPointDto] }) timeline!: ReportPointDto[];
  @ApiProperty({ type: [ReportPointDto] }) series!: ReportPointDto[];
  @ApiProperty({ type: [ReportPointDto] }) monthly!: ReportPointDto[];
  @ApiProperty({
    type: "object",
    additionalProperties: { type: "array", items: { type: "string" } },
  })
  options!: Record<string, string[]>;
  @ApiProperty({ type: "object", additionalProperties: { type: "number" } })
  optionCounts!: Record<string, number>;
  @ApiProperty({ type: [String] }) dates!: string[];
  @ApiProperty({ type: [ReportRecordDto] }) records!: ReportRecordDto[];
  @ApiProperty() recordCount!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageCount!: number;
  @ApiProperty() unclassifiedCount!: number;
}
