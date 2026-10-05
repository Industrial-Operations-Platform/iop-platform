import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { HandoverLocationDto } from "./handover-contracts";
export class AssetAliasDto {
  @ApiProperty({
    description:
      "Exact source namespace; site-equipment for handover, analytics for analytical rows.",
  })
  namespace!: string;
  @ApiProperty({
    description: "Required for analytics; empty for site-equipment.",
  })
  sourceId!: string;
  @ApiProperty() code!: string;
  @ApiProperty() departmentId!: string;
  @ApiProperty() areaId!: string;
  @ApiProperty() sector!: string;
  @ApiProperty() area!: string;
}
export class AssetContentDto {
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() type!: string;
  @ApiProperty() locationId!: string;
  @ApiProperty({ enum: ["unverified", "validated", "retired"] }) status!:
    | "unverified"
    | "validated"
    | "retired";
  @ApiProperty({
    description:
      "Required evidence when validating a manually registered asset.",
  })
  validationNote!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ type: [AssetAliasDto], maxItems: 30 })
  aliases!: AssetAliasDto[];
}
export class AssetDto {
  @ApiProperty() id!: string;
  @ApiProperty() revision!: number;
  @ApiProperty() authorId!: string;
  @ApiProperty() authorName!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiProperty({ type: AssetContentDto }) content!: AssetContentDto;
}
export class AssetsContextDto {
  @ApiProperty() actorId!: string;
  @ApiProperty() canManage!: boolean;
  @ApiProperty() timeZone!: string;
  @ApiProperty({ type: [HandoverLocationDto] })
  locations!: HandoverLocationDto[];
}
export class AssetsContextRequestDto {}
export class AssetSelectionDto {
  @ApiProperty() search!: string;
  @ApiProperty({ enum: ["", "unverified", "validated", "retired"] }) status!:
    | ""
    | "unverified"
    | "validated"
    | "retired";
  @ApiProperty() locationId!: string;
  @ApiProperty() cursor!: string;
}
export class AssetPageDto {
  @ApiProperty({ type: [AssetDto] }) assets!: AssetDto[];
  @ApiProperty() total!: number;
  @ApiProperty() nextCursor!: string;
}
export class AssetSaveDto {
  @ApiProperty({
    description: "Idempotency key for a new asset; empty for edits.",
  })
  key!: string;
  @ApiProperty({ description: "Empty for a new registration." }) id!: string;
  @ApiProperty() expectedRevision!: number;
  @ApiProperty() note!: string;
  @ApiProperty({ type: AssetContentDto }) content!: AssetContentDto;
}
export class AssetDetailRequestDto {
  @ApiProperty() id!: string;
}
export class AssetHistoryRequestDto {
  @ApiProperty() id!: string;
  @ApiProperty() before!: number;
}
export class AssetRevisionDto {
  @ApiProperty({ type: AssetDto }) asset!: AssetDto;
  @ApiProperty() actorId!: string;
  @ApiProperty() actorName!: string;
  @ApiProperty() action!: string;
  @ApiProperty() note!: string;
  @ApiProperty() at!: string;
}
export class AssetHistoryDto {
  @ApiProperty({ type: AssetDto }) asset!: AssetDto;
  @ApiProperty({ type: [AssetRevisionDto] }) revisions!: AssetRevisionDto[];
  @ApiProperty() nextBefore!: number;
}
export class AssetTimelineRequestDto {
  @ApiPropertyOptional({
    enum: ["maintenance", "handover", "analytics"],
    description:
      "Filter the source before totals and pagination; omit to include all authorized sources.",
  })
  kind?: "maintenance" | "handover" | "analytics";
  @ApiProperty() id!: string;
  @ApiProperty({
    format: "date",
    description: "Inclusive site-local recording date; at most 366 days.",
  })
  from!: string;
  @ApiProperty({ format: "date" }) to!: string;
  @ApiProperty() cursor!: string;
}
export class AssetTimelineRecordDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ["maintenance", "handover", "analytics"] }) kind!:
    | "maintenance"
    | "handover"
    | "analytics";
  @ApiProperty({ format: "date" }) date!: string;
  @ApiProperty({
    description:
      "Exact server recording instant for operational revisions. Empty for date-only analytical aggregates.",
  })
  recordedAt!: string;
  @ApiProperty() title!: string;
  @ApiProperty() summary!: string;
  @ApiProperty() sourceRecordId!: string;
  @ApiProperty({ enum: ["calendar-date", "daily-aggregate"] }) periodKind!:
    | "calendar-date"
    | "daily-aggregate";
  @ApiPropertyOptional() frequency?: number;
  @ApiPropertyOptional({
    description: "Accumulated alarm seconds, never plant downtime.",
  })
  seconds?: number;
}
export class AssetTimelineCoverageDto {
  @ApiProperty({ enum: ["maintenance", "handover", "analytics"] }) kind!:
    | "maintenance"
    | "handover"
    | "analytics";
  @ApiProperty({
    enum: ["available", "not-authorized", "unmapped", "unavailable"],
  })
  status!: "available" | "not-authorized" | "unmapped" | "unavailable";
  @ApiProperty() total!: number;
}
export class AssetTimelinePageDto {
  @ApiProperty({ type: AssetDto }) asset!: AssetDto;
  @ApiProperty({ type: [AssetTimelineRecordDto] })
  records!: AssetTimelineRecordDto[];
  @ApiProperty({ type: [AssetTimelineCoverageDto] })
  sources!: AssetTimelineCoverageDto[];
  @ApiProperty({
    description:
      "Full matching count across currently authorized and available sources.",
  })
  total!: number;
  @ApiProperty() nextCursor!: string;
}
