import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { FieldKind, MappingState } from "../modules/assets/domain/enrichment";
export class AssetMetadataFieldDto {
  @ApiProperty()
  key!: string;
  @ApiProperty()
  label!: string;
  @ApiProperty({
    enum: ["text", "number", "boolean", "date"]
  })
  kind!: FieldKind;
  @ApiProperty()
  required!: boolean;
  @ApiProperty()
  unit!: string;
}
export class AssetModelTypeDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  label!: string;
  @ApiProperty()
  active!: boolean;
  @ApiProperty()
  canContain!: boolean;
  @ApiProperty()
  isController!: boolean;
  @ApiProperty({
    type: [AssetMetadataFieldDto]
  })
  fields!: AssetMetadataFieldDto[];
}
export class AssetTypeCatalogDto {
  @ApiProperty()
  revision!: number;
  @ApiProperty({
    type: [AssetModelTypeDto]
  })
  types!: AssetModelTypeDto[];
}
export class AssetControllerRelationDto {
  @ApiProperty({
    enum: ["controlled-by"]
  })
  kind!: "controlled-by";
  @ApiProperty()
  targetId!: string;
  @ApiProperty()
  channel!: string;
}
export class AssetSurveyDto {
  @ApiProperty({
    enum: ["pending", "validated", "rejected"]
  })
  status!: "pending" | "validated" | "rejected";
  @ApiProperty({
    maxLength: 4000
  })
  note!: string;
  @ApiProperty({
    maxLength: 400
  })
  evidenceReference!: string;
}
export class AssetEnrichmentDataDto {
  @ApiProperty()
  typeId!: string;
  @ApiProperty()
  parentId!: string;
  @ApiProperty({
    type: [AssetControllerRelationDto]
  })
  controllers!: AssetControllerRelationDto[];
  @ApiProperty()
  manufacturer!: string;
  @ApiProperty()
  model!: string;
  @ApiProperty()
  serial!: string;
  @ApiProperty({
    type: "object",
    additionalProperties: {
      oneOf: [{
        type: "string"
      }, {
        type: "number"
      }, {
        type: "boolean"
      }]
    }
  })
  metadata!: Record<string, string | number | boolean>;
  @ApiProperty({
    type: AssetSurveyDto
  })
  survey!: AssetSurveyDto;
}
export class AssetEnrichmentDto {
  @ApiProperty()
  assetId!: string;
  @ApiProperty()
  revision!: number;
  @ApiProperty({
    type: AssetEnrichmentDataDto
  })
  data!: AssetEnrichmentDataDto;
  @ApiProperty()
  actorId!: string;
  @ApiProperty()
  actorName!: string;
  @ApiProperty()
  updatedAt!: string;
  @ApiProperty()
  surveyReviewerId!: string;
  @ApiProperty()
  surveyReviewerName!: string;
  @ApiProperty()
  surveyReviewedAt!: string;
}
export class AssetDomainReferenceDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  code!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty({
    enum: ["unverified", "validated", "retired"]
  })
  status!: "unverified" | "validated" | "retired";
}
export class AssetDomainCatalogDto {
  @ApiProperty()
  canManage!: boolean;
  @ApiProperty()
  sourceId!: string;
  @ApiProperty({
    type: AssetTypeCatalogDto
  })
  catalog!: AssetTypeCatalogDto;
}
export class AssetDomainConfigureDto {
  @ApiProperty({
    minimum: 0
  })
  expectedRevision!: number;
  @ApiProperty({
    type: [AssetModelTypeDto]
  })
  types!: AssetModelTypeDto[];
}
export class AssetDomainDetailDto {
  @ApiProperty({
    type: AssetDomainReferenceDto
  })
  asset!: AssetDomainReferenceDto;
  @ApiProperty({
    type: AssetEnrichmentDto,
    nullable: true
  })
  enrichment!: AssetEnrichmentDto | null;
  @ApiProperty({
    type: [AssetDomainReferenceDto]
  })
  related!: AssetDomainReferenceDto[];
  @ApiProperty()
  canManage!: boolean;
}
export class AssetDomainIdDto {
  @ApiProperty()
  assetId!: string;
}
export class AssetDomainSaveDto {
  @ApiProperty()
  assetId!: string;
  @ApiProperty({
    minimum: 0
  })
  expectedRevision!: number;
  @ApiProperty({
    maxLength: 2000
  })
  reason!: string;
  @ApiProperty({
    type: AssetEnrichmentDataDto
  })
  data!: AssetEnrichmentDataDto;
}
export class AssetDomainHistoryRequestDto extends AssetDomainIdDto {
  @ApiPropertyOptional({
    minimum: 0
  })
  before?: number;
}
export class AssetEnrichmentRevisionDto {
  @ApiProperty({
    type: AssetEnrichmentDto
  })
  enrichment!: AssetEnrichmentDto;
  @ApiProperty()
  reason!: string;
  @ApiProperty()
  actorId!: string;
  @ApiProperty()
  actorName!: string;
  @ApiProperty()
  at!: string;
}
export class AssetDomainHistoryDto {
  @ApiProperty({
    type: [AssetEnrichmentRevisionDto]
  })
  revisions!: AssetEnrichmentRevisionDto[];
  @ApiProperty()
  nextBefore!: number;
}
export class AssetSourceTupleDto {
  @ApiProperty()
  sourceId!: string;
  @ApiProperty({
    enum: ["source-equipment"]
  })
  namespace!: "source-equipment";
  @ApiProperty()
  area!: string;
  @ApiProperty()
  code!: string;
}
export class AssetMappingDataDto {
  @ApiProperty({
    type: AssetSourceTupleDto
  })
  source!: AssetSourceTupleDto;
  @ApiProperty({
    enum: ["pending", "approved", "rejected"]
  })
  status!: "pending" | "approved" | "rejected";
  @ApiProperty({
    type: [String],
    maxItems: 30
  })
  candidateIds!: string[];
  @ApiProperty()
  note!: string;
}
export class AssetSourceMappingDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  revision!: number;
  @ApiProperty({
    type: AssetMappingDataDto
  })
  data!: AssetMappingDataDto;
  @ApiProperty()
  actorId!: string;
  @ApiProperty()
  actorName!: string;
  @ApiProperty()
  updatedAt!: string;
}
export class AssetMappingPageDto {
  @ApiProperty({
    type: [AssetSourceMappingDto]
  })
  mappings!: AssetSourceMappingDto[];
  @ApiProperty()
  total!: number;
  @ApiProperty()
  nextCursor!: string;
}
export class AssetMappingSaveDto {
  @ApiProperty()
  id!: string;
  @ApiProperty({
    minimum: 0
  })
  expectedRevision!: number;
  @ApiProperty()
  reason!: string;
  @ApiProperty({
    type: AssetMappingDataDto
  })
  data!: AssetMappingDataDto;
}
export class AssetMappingHistoryRequestDto {
  @ApiProperty()
  id!: string;
  @ApiPropertyOptional({
    minimum: 0
  })
  before?: number;
}
export class AssetMappingRevisionDto {
  @ApiProperty({
    type: AssetSourceMappingDto
  })
  mapping!: AssetSourceMappingDto;
  @ApiProperty()
  reason!: string;
  @ApiProperty()
  actorId!: string;
  @ApiProperty()
  actorName!: string;
  @ApiProperty()
  at!: string;
}
export class AssetMappingHistoryDto {
  @ApiProperty({
    type: [AssetMappingRevisionDto]
  })
  revisions!: AssetMappingRevisionDto[];
  @ApiProperty()
  nextBefore!: number;
}
export class AssetSourceCandidateDto extends AssetSourceTupleDto {
  @ApiProperty()
  records!: number;
}
export class AssetSourceQueryDto {
  @ApiPropertyOptional()
  search?: string;
  @ApiPropertyOptional()
  cursor?: string;
}
export class AssetSourceCandidatePageDto {
  @ApiProperty({
    type: [AssetSourceCandidateDto]
  })
  candidates!: AssetSourceCandidateDto[];
  @ApiProperty()
  nextCursor!: string;
}
export class CanonicalParetoSelectionDto {
  @ApiProperty({
    format: "date"
  })
  from!: string;
  @ApiProperty({
    format: "date"
  })
  toExclusive!: string;
  @ApiProperty({
    enum: ["frequency", "alarm-seconds"]
  })
  metric!: "frequency" | "alarm-seconds";
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100
  })
  limit?: number;
}
export class CanonicalAssetMeasuresDto {
  @ApiProperty()
  frequency!: number;
  @ApiProperty()
  alarmSeconds!: number;
  @ApiProperty()
  records!: number;
}
export class CanonicalAssetGroupDto extends CanonicalAssetMeasuresDto {
  @ApiProperty()
  assetId!: string;
  @ApiPropertyOptional()
  assetCode?: string;
  @ApiProperty({
    type: Number,
    nullable: true
  })
  cumulativePercent!: number | null;
}
export class CanonicalAssetParetoDto {
  @ApiProperty({
    type: CanonicalParetoSelectionDto
  })
  selection!: CanonicalParetoSelectionDto;
  @ApiProperty({
    type: [CanonicalAssetGroupDto]
  })
  groups!: CanonicalAssetGroupDto[];
  @ApiProperty()
  groupCount!: number;
  @ApiProperty({
    type: CanonicalAssetMeasuresDto
  })
  totals!: CanonicalAssetMeasuresDto;
  @ApiProperty({
    type: CanonicalAssetMeasuresDto
  })
  mapped!: CanonicalAssetMeasuresDto;
  @ApiProperty({
    type: CanonicalAssetMeasuresDto
  })
  unresolved!: CanonicalAssetMeasuresDto;
  @ApiProperty({
    type: "object",
    additionalProperties: {
      type: "number"
    }
  })
  states!: Record<string, number>;
  @ApiProperty({
    type: [String]
  })
  missingDates!: string[];
  @ApiProperty({
    type: [String]
  })
  admittedDates!: string[];
  @ApiProperty()
  projectionRevision!: string;
  @ApiProperty()
  limitations!: string;
}
export class AssetDomainQueryDto {
  @ApiPropertyOptional()
  search?: string;
  @ApiPropertyOptional()
  cursor?: string;
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100
  })
  limit?: number;
}
export class AssetEnrichmentSummaryDto {
  @ApiProperty()
  assetId!: string;
  @ApiProperty()
  revision!: number;
  @ApiProperty()
  typeId!: string;
  @ApiProperty()
  parentId!: string;
  @ApiProperty({
    enum: ["pending", "validated", "rejected"]
  })
  surveyStatus!: "pending" | "validated" | "rejected";
}
export class AssetDomainReferencePageDto {
  @ApiProperty({
    type: [AssetDomainReferenceDto]
  })
  assets!: AssetDomainReferenceDto[];
  @ApiProperty({
    type: [AssetEnrichmentSummaryDto]
  })
  enrichments!: AssetEnrichmentSummaryDto[];
  @ApiProperty()
  total!: number;
  @ApiProperty()
  nextCursor!: string;
}
export class AssetMappingLookupDto {
  @ApiProperty({
    type: AssetSourceMappingDto,
    nullable: true
  })
  mapping!: AssetSourceMappingDto | null;
}
