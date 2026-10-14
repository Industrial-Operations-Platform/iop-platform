import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { Status, Metric } from "../modules/improvement-tracking/domain/improvement";
export class ImprovementTargetDto {
  @ApiProperty({
    maxLength: 2000
  })
  objective!: string;
  @ApiProperty({
    enum: ["frequency", "alarm-seconds"]
  })
  metric!: Metric;
  @ApiProperty({
    type: Number,
    nullable: true,
    minimum: 0,
    maximum: 100
  })
  reductionPercent!: number | null;
}
export class ImprovementDataDto {
  @ApiProperty({
    maxLength: 160
  })
  title!: string;
  @ApiProperty({
    maxLength: 8000
  })
  hypothesis!: string;
  @ApiProperty()
  locationId!: string;
  @ApiProperty()
  assetId!: string;
  @ApiProperty()
  issueId!: string;
  @ApiProperty()
  ownerId!: string;
  @ApiProperty({
    description: "Optional site calendar date, or empty string."
  })
  dueDate!: string;
  @ApiProperty({
    enum: ["planned", "in-progress", "blocked", "implemented", "evaluated", "cancelled"]
  })
  status!: Status;
  @ApiProperty({
    description: "Required for implemented/evaluated; site calendar date."
  })
  implementedDate!: string;
  @ApiProperty({
    type: ImprovementTargetDto
  })
  target!: ImprovementTargetDto;
  @ApiProperty({
    maxLength: 8000
  })
  result!: string;
  @ApiProperty({
    maxLength: 2000
  })
  blockedReason!: string;
  @ApiProperty({
    maxLength: 2000
  })
  cancellationReason!: string;
}
export class ImprovementActionDto {
  @ApiProperty()
  id!: string;
  @ApiProperty({
    minimum: 1
  })
  revision!: number;
  @ApiProperty({
    type: ImprovementDataDto
  })
  data!: ImprovementDataDto;
  @ApiProperty()
  authorId!: string;
  @ApiProperty()
  authorName!: string;
  @ApiProperty()
  ownerName!: string;
  @ApiProperty()
  assetName!: string;
  @ApiProperty()
  issueTitle!: string;
  @ApiProperty()
  locationLabel!: string;
  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;
  @ApiProperty({
    format: "date-time"
  })
  updatedAt!: string;
  @ApiProperty()
  evidenceCount!: number;
  @ApiProperty()
  comparisonCount!: number;
}
export class ImprovementViewDto extends ImprovementActionDto {
  @ApiProperty()
  canEdit!: boolean;
  @ApiProperty()
  canCoordinate!: boolean;
}
export class ImprovementSaveDto {
  @ApiProperty()
  id!: string;
  @ApiProperty({
    minimum: 0
  })
  expectedRevision!: number;
  @ApiProperty({
    maxLength: 2000
  })
  reason!: string;
  @ApiProperty({
    type: ImprovementDataDto
  })
  data!: ImprovementDataDto;
}
export class ImprovementPersonDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
}
export class ImprovementLocationDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  label!: string;
  @ApiProperty()
  parentId!: string;
}
export class ImprovementAssetDto extends ImprovementPersonDto {
  @ApiProperty()
  code!: string;
  @ApiProperty()
  status!: string;
}
export class ImprovementCatalogDto {
  @ApiProperty()
  actorId!: string;
  @ApiProperty()
  canContribute!: boolean;
  @ApiProperty()
  canCoordinate!: boolean;
  @ApiProperty({
    type: [ImprovementPersonDto]
  })
  people!: ImprovementPersonDto[];
  @ApiProperty({
    type: [ImprovementLocationDto]
  })
  locations!: ImprovementLocationDto[];
  @ApiProperty({
    type: [ImprovementAssetDto]
  })
  assets!: ImprovementAssetDto[];
}
export class ImprovementIssueDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  title!: string;
  @ApiProperty()
  state!: string;
  @ApiProperty()
  revision!: number;
  @ApiProperty()
  equipmentCode!: string;
  @ApiProperty()
  area!: string;
}
export class ImprovementIssueQueryDto {
  @ApiPropertyOptional()
  search?: string;
  @ApiPropertyOptional()
  cursor?: string;
}
export class ImprovementIssuePageDto {
  @ApiProperty({
    type: [ImprovementIssueDto]
  })
  issues!: ImprovementIssueDto[];
  @ApiProperty()
  nextCursor!: string;
}
export class ImprovementSelectionDto {
  @ApiPropertyOptional({
    enum: ["", "planned", "in-progress", "blocked", "implemented", "evaluated", "cancelled"]
  })
  status?: Status | "";
  @ApiPropertyOptional()
  ownerId?: string;
  @ApiPropertyOptional()
  locationId?: string;
  @ApiPropertyOptional()
  assetId?: string;
  @ApiPropertyOptional({
    maxLength: 200
  })
  search?: string;
  @ApiPropertyOptional()
  cursor?: string;
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 20
  })
  limit?: number;
}
export class ImprovementCountsDto {
  @ApiProperty()
  planned!: number;
  @ApiProperty()
  "in-progress"!: number;
  @ApiProperty()
  blocked!: number;
  @ApiProperty()
  implemented!: number;
  @ApiProperty()
  evaluated!: number;
  @ApiProperty()
  cancelled!: number;
}
export class ImprovementPageDto {
  @ApiProperty({
    type: [ImprovementViewDto]
  })
  actions!: ImprovementViewDto[];
  @ApiProperty()
  total!: number;
  @ApiProperty()
  nextCursor!: string;
  @ApiProperty({
    type: ImprovementCountsDto
  })
  statusCounts!: ImprovementCountsDto;
}
export class ImprovementRevisionDto {
  @ApiProperty({
    type: ImprovementActionDto
  })
  action!: ImprovementActionDto;
  @ApiProperty()
  actorId!: string;
  @ApiProperty()
  actorName!: string;
  @ApiProperty({
    format: "date-time"
  })
  at!: string;
  @ApiProperty({
    enum: ["created", "updated", "status-changed", "evidence-added", "comparison-saved"]
  })
  change!: string;
  @ApiProperty()
  reason!: string;
  @ApiProperty()
  referenceId!: string;
}
export class ImprovementHistoryRequestDto {
  @ApiProperty()
  id!: string;
  @ApiPropertyOptional({
    minimum: 0
  })
  before?: number;
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100
  })
  limit?: number;
}
export class ImprovementHistoryDto {
  @ApiProperty({
    type: ImprovementViewDto
  })
  action!: ImprovementViewDto;
  @ApiProperty({
    type: [ImprovementRevisionDto]
  })
  revisions!: ImprovementRevisionDto[];
  @ApiProperty()
  nextBefore!: number;
}
export class ImprovementEvidenceRequestDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  actionId!: string;
  @ApiProperty({
    minimum: 1
  })
  expectedRevision!: number;
  @ApiProperty({
    enum: ["note", "result"]
  })
  kind!: "note" | "result";
  @ApiProperty({
    maxLength: 8000
  })
  note!: string;
  @ApiProperty({
    maxLength: 400
  })
  externalReference!: string;
  @ApiProperty()
  supersedesId!: string;
}
export class ImprovementEvidenceDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  actionId!: string;
  @ApiProperty()
  actionRevision!: number;
  @ApiProperty({
    enum: ["note", "result"]
  })
  kind!: "note" | "result";
  @ApiProperty()
  note!: string;
  @ApiProperty()
  externalReference!: string;
  @ApiProperty()
  supersedesId!: string;
  @ApiProperty()
  actorId!: string;
  @ApiProperty()
  actorName!: string;
  @ApiProperty({
    format: "date-time"
  })
  at!: string;
}
export class ImprovementEvidenceSavedDto {
  @ApiProperty({
    type: ImprovementViewDto
  })
  action!: ImprovementViewDto;
  @ApiProperty({
    type: ImprovementEvidenceDto
  })
  evidence!: ImprovementEvidenceDto;
}
export class ImprovementCollectionRequestDto {
  @ApiProperty()
  id!: string;
  @ApiPropertyOptional()
  cursor?: string;
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100
  })
  limit?: number;
}
export class ImprovementEvidencePageDto {
  @ApiProperty({
    type: [ImprovementEvidenceDto]
  })
  evidence!: ImprovementEvidenceDto[];
  @ApiProperty()
  nextCursor!: string;
}
export class ImprovementPeriodDto {
  @ApiProperty({
    format: "date"
  })
  from!: string;
  @ApiProperty({
    format: "date",
    description: "Exclusive calendar-date boundary."
  })
  toExclusive!: string;
}
export class ImprovementFiltersDto {
  @ApiProperty()
  sector!: string;
  @ApiProperty()
  area!: string;
  @ApiProperty()
  equipment!: string;
  @ApiProperty()
  message!: string;
}
export class ImprovementComparisonSelectionDto {
  @ApiProperty({
    type: ImprovementPeriodDto
  })
  before!: ImprovementPeriodDto;
  @ApiProperty({
    type: ImprovementPeriodDto
  })
  after!: ImprovementPeriodDto;
  @ApiProperty({
    enum: ["asset", "selection"]
  })
  scope!: "asset" | "selection";
  @ApiProperty({
    type: ImprovementFiltersDto
  })
  filters!: ImprovementFiltersDto;
}
export class ImprovementCompareDto {
  @ApiProperty()
  actionId!: string;
  @ApiProperty({
    minimum: 1
  })
  expectedRevision!: number;
  @ApiProperty({
    type: ImprovementComparisonSelectionDto
  })
  selection!: ImprovementComparisonSelectionDto;
}
export class ImprovementSaveComparisonDto extends ImprovementCompareDto {
  @ApiProperty()
  id!: string;
  @ApiProperty({
    maxLength: 2000
  })
  note!: string;
}
export class ImprovementMeasureDto extends ImprovementPeriodDto {
  @ApiProperty({
    type: [String]
  })
  eligibleDates!: string[];
  @ApiProperty({
    type: [String]
  })
  admittedDates!: string[];
  @ApiProperty({
    type: [String]
  })
  missingDates!: string[];
  @ApiProperty({
    type: [String]
  })
  excludedDates!: string[];
  @ApiProperty()
  frequency!: number;
  @ApiProperty()
  alarmSeconds!: number;
  @ApiProperty()
  records!: number;
}
export class ImprovementObservedChangeDto {
  @ApiProperty({
    type: Number,
    nullable: true
  })
  before!: number | null;
  @ApiProperty({
    type: Number,
    nullable: true
  })
  after!: number | null;
  @ApiProperty({
    type: Number,
    nullable: true
  })
  change!: number | null;
  @ApiProperty({
    type: Number,
    nullable: true
  })
  reductionPercent!: number | null;
}
export class ImprovementAliasDto {
  @ApiProperty()
  code!: string;
  @ApiProperty()
  sector!: string;
  @ApiProperty()
  area!: string;
}
export class ImprovementComparisonDto {
  @ApiProperty()
  sourceId!: string;
  @ApiProperty()
  siteTimeZone!: string;
  @ApiProperty()
  publicationRevision!: string;
  @ApiProperty()
  profileVersion!: string;
  @ApiProperty({
    type: ImprovementComparisonSelectionDto
  })
  selection!: ImprovementComparisonSelectionDto;
  @ApiProperty({
    type: [ImprovementAliasDto]
  })
  aliases!: ImprovementAliasDto[];
  @ApiProperty({
    type: ImprovementMeasureDto
  })
  before!: ImprovementMeasureDto;
  @ApiProperty({
    type: ImprovementMeasureDto
  })
  after!: ImprovementMeasureDto;
  @ApiProperty()
  mapped!: boolean;
  @ApiProperty({
    type: [String]
  })
  warnings!: string[];
  @ApiProperty({
    type: ImprovementObservedChangeDto
  })
  frequencyPerObservedDate!: ImprovementObservedChangeDto;
  @ApiProperty({
    type: ImprovementObservedChangeDto
  })
  alarmSecondsPerObservedDate!: ImprovementObservedChangeDto;
  @ApiProperty({
    type: ImprovementTargetDto
  })
  target!: ImprovementTargetDto;
  @ApiProperty({
    enum: ["not-assessable", "met", "not-met", "not-quantified"]
  })
  observedTarget!: "not-assessable" | "met" | "not-met" | "not-quantified";
  @ApiProperty()
  attribution!: string;
}
export class ImprovementSavedComparisonDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  actionId!: string;
  @ApiProperty()
  actionRevision!: number;
  @ApiProperty()
  actorId!: string;
  @ApiProperty()
  actorName!: string;
  @ApiProperty({
    format: "date-time"
  })
  at!: string;
  @ApiProperty()
  note!: string;
  @ApiProperty({
    type: ImprovementComparisonDto
  })
  comparison!: ImprovementComparisonDto;
}
export class ImprovementComparisonSavedDto {
  @ApiProperty({
    type: ImprovementViewDto
  })
  action!: ImprovementViewDto;
  @ApiProperty({
    type: ImprovementSavedComparisonDto
  })
  saved!: ImprovementSavedComparisonDto;
}
export class ImprovementComparisonPageDto {
  @ApiProperty({
    type: [ImprovementSavedComparisonDto]
  })
  comparisons!: ImprovementSavedComparisonDto[];
  @ApiProperty()
  nextCursor!: string;
}
