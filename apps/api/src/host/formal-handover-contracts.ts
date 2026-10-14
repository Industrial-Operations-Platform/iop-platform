import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { HandoverAssetReferenceDto, HandoverContentDto, HandoverLocationDto } from "./handover-contracts";
export class FormalHandoverAssignmentDto {
  @ApiProperty() id!: string;
  @ApiProperty() revision!: number;
}
export class FormalHandoverShiftDto {
  @ApiProperty() id!: string;
  @ApiProperty() date!: string;
  @ApiProperty() shiftTypeId!: string;
  @ApiProperty() label!: string;
  @ApiProperty() targetId!: string;
  @ApiProperty() targetLabel!: string;
  @ApiProperty() startsAt!: string;
  @ApiProperty() endsAt!: string;
  @ApiProperty({ type: [FormalHandoverAssignmentDto] }) assignments!: FormalHandoverAssignmentDto[];
}
export class FormalHandoverContentDto {
  @ApiProperty() shiftId!: string;
  @ApiProperty() shiftDate!: string;
  @ApiProperty() departmentId!: string;
  @ApiProperty() areaId!: string;
  @ApiProperty() title!: string;
  @ApiProperty() summary!: string;
  @ApiProperty({ type: [String], maxItems: 100 }) entryIds!: string[];
}
export class FormalHandoverEvidenceDto {
  @ApiProperty() id!: string;
  @ApiProperty() revision!: number;
  @ApiProperty() authorId!: string;
  @ApiProperty() authorName!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty({ type: HandoverContentDto }) content!: HandoverContentDto;
  @ApiProperty() departmentLabel!: string;
  @ApiProperty() areaLabel!: string;
  @ApiProperty() categoryLabel!: string;
  @ApiProperty() responsibleId!: string;
  @ApiProperty() responsibleName!: string;
  @ApiProperty({ enum: ["none", "open", "in-progress", "resolved"] }) issueState!: "none" | "open" | "in-progress" | "resolved";
  @ApiPropertyOptional({ type: HandoverAssetReferenceDto }) assetReference?: HandoverAssetReferenceDto;
}
export class FormalHandoverAcknowledgementDto {
  @ApiProperty() actorId!: string;
  @ApiProperty() actorName!: string;
  @ApiProperty() at!: string;
  @ApiProperty() note!: string;
}
export class FormalHandoverRecordDto {
  @ApiProperty() id!: string;
  @ApiProperty() revision!: number;
  @ApiProperty({ enum: ["draft", "open", "closed"] }) state!: "draft" | "open" | "closed";
  @ApiProperty() authorId!: string;
  @ApiProperty() authorName!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiProperty({ type: FormalHandoverShiftDto }) shift!: FormalHandoverShiftDto;
  @ApiProperty() departmentLabel!: string;
  @ApiProperty() areaLabel!: string;
  @ApiProperty({ type: FormalHandoverContentDto }) content!: FormalHandoverContentDto;
  @ApiProperty() closedBy!: string;
  @ApiProperty() closedByName!: string;
  @ApiProperty() closedAt!: string;
  @ApiProperty() outcome!: string;
  @ApiProperty({ type: [FormalHandoverEvidenceDto] }) entries!: FormalHandoverEvidenceDto[];
  @ApiProperty({ type: [FormalHandoverEvidenceDto] }) pending!: FormalHandoverEvidenceDto[];
  @ApiProperty({ type: [FormalHandoverAcknowledgementDto] }) acknowledgements!: FormalHandoverAcknowledgementDto[];
}
export class FormalHandoverRevisionDto {
  @ApiProperty({ type: FormalHandoverRecordDto }) record!: FormalHandoverRecordDto;
  @ApiProperty() actorId!: string;
  @ApiProperty() actorName!: string;
  @ApiProperty() at!: string;
  @ApiProperty({ enum: ["created", "corrected", "published", "closed", "acknowledged"] }) action!: "created" | "corrected" | "published" | "closed" | "acknowledged";
  @ApiProperty() note!: string;
}
export class FormalHandoverSelectionDto {
  @ApiProperty() from!: string;
  @ApiProperty() to!: string;
  @ApiProperty() departmentId!: string;
  @ApiProperty() areaId!: string;
  @ApiProperty() cursor!: string;
}
export class FormalHandoverSaveDto {
  @ApiProperty() key!: string;
  @ApiProperty() id!: string;
  @ApiProperty() expectedRevision!: number;
  @ApiProperty({ type: FormalHandoverContentDto }) content!: FormalHandoverContentDto;
  @ApiProperty() note!: string;
}
export class FormalHandoverTransitionDto {
  @ApiProperty() id!: string;
  @ApiProperty() expectedRevision!: number;
  @ApiProperty({ enum: ["publish", "close", "acknowledge"] }) action!: "publish" | "close" | "acknowledge";
  @ApiProperty() note!: string;
}
export class FormalHandoverContextDto {
  @ApiProperty() actorId!: string;
  @ApiProperty() canManageRecords!: boolean;
  @ApiProperty({ type: [HandoverLocationDto] }) locations!: HandoverLocationDto[];
  @ApiProperty() timeZone!: string;
}
export class FormalHandoverShiftsDto {
  @ApiProperty({ type: [FormalHandoverShiftDto] }) shifts!: FormalHandoverShiftDto[];
  @ApiProperty({ enum: ["planned-assignments"] }) coverage!: "planned-assignments";
}
export class FormalHandoverPageDto {
  @ApiProperty({ type: [FormalHandoverRecordDto] }) records!: FormalHandoverRecordDto[];
  @ApiProperty() total!: number;
  @ApiProperty() nextCursor!: string;
}
export class FormalHandoverHistoryRequestDto { @ApiProperty() id!: string; @ApiProperty() before!: number; }
export class FormalHandoverHistoryDto {
  @ApiProperty({ type: FormalHandoverRecordDto }) record!: FormalHandoverRecordDto;
  @ApiProperty({ type: [FormalHandoverRevisionDto] }) revisions!: FormalHandoverRevisionDto[];
  @ApiProperty() nextBefore!: number;
}
export class FormalHandoverPreviousRequestDto { @ApiProperty() id!: string; }
export class FormalHandoverPreviousDto {
  @ApiProperty({ type: FormalHandoverShiftDto, nullable: true }) shift!: FormalHandoverShiftDto | null;
  @ApiProperty({ type: FormalHandoverRecordDto, nullable: true }) record!: FormalHandoverRecordDto | null;
  @ApiProperty() overlaps!: boolean;
  @ApiProperty({ type: [FormalHandoverEvidenceDto] }) pending!: FormalHandoverEvidenceDto[];
  @ApiProperty() pendingTotal!: number;
}
export class FormalHandoverCandidatesRequestDto {
  @ApiProperty() departmentId!: string;
  @ApiProperty() areaId!: string;
  @ApiProperty() through!: string;
}
export class FormalHandoverCandidatesDto {
  @ApiProperty({ type: [FormalHandoverEvidenceDto] }) entries!: FormalHandoverEvidenceDto[];
  @ApiProperty() total!: number;
}
