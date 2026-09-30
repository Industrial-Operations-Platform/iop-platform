import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
export class HandoverContentDto {
  @ApiProperty() date!: string;
  @ApiProperty() categoryId!: string;
  @ApiProperty() summary!: string;
  @ApiProperty() details!: string;
  @ApiProperty() departmentId!: string;
  @ApiProperty() areaId!: string;
  @ApiProperty() equipmentCode!: string;
  @ApiProperty() equipmentNamespace!: string;
  @ApiProperty({
    enum: [
      "",
      "damaged",
      "inspection-needed",
      "blocked",
      "repaired",
      "restored",
    ],
  })
  condition!:
    | ""
    | "damaged"
    | "inspection-needed"
    | "blocked"
    | "repaired"
    | "restored";
  @ApiProperty() externalReference!: string;
  @ApiProperty() challenge!: string;
  @ApiProperty() cause!: string;
  @ApiProperty() measure!: string;
  @ApiProperty() dueDate!: string;
  @ApiProperty() feedbackDueDate!: string;
  @ApiProperty() discuss!: boolean;
}
export class HandoverLocationDto {
  @ApiProperty() id!: string;
  @ApiProperty() label!: string;
  @ApiProperty() parentId!: string;
  @ApiProperty() sectorKey!: string;
  @ApiProperty({ enum: ["department", "area", "location"] }) role!:
    | "department"
    | "area"
    | "location";
}
export class HandoverChoiceDto {
  @ApiProperty() id!: string;
  @ApiProperty() label!: string;
}
export class HandoverPersonDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
}
export class HandoverContextDto {
  @ApiProperty() canDelete!: boolean;
  @ApiProperty({ type: [HandoverLocationDto] })
  locations!: HandoverLocationDto[];
  @ApiProperty({ type: [HandoverChoiceDto] }) categories!: HandoverChoiceDto[];
  @ApiProperty({ type: [HandoverPersonDto] }) people!: HandoverPersonDto[];
  @ApiProperty() canCoordinate!: boolean;
  @ApiProperty() actorId!: string;
  @ApiProperty() externalSystemLabel!: string;
  @ApiProperty() timeZone!: string;
}
export class HandoverLatestUpdateDto {
  @ApiProperty() note!: string;
  @ApiProperty() actorName!: string;
  @ApiProperty() at!: string;
}
export class HandoverEntryDto {
  @ApiPropertyOptional() deleted?: boolean;
  @ApiPropertyOptional({ type: HandoverLatestUpdateDto })
  latestUpdate?: HandoverLatestUpdateDto;
  @ApiProperty() id!: string;
  @ApiProperty() authorId!: string;
  @ApiProperty() authorName!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiProperty() departmentLabel!: string;
  @ApiProperty() areaLabel!: string;
  @ApiProperty() categoryLabel!: string;
  @ApiProperty() equipmentReferenceId!: string;
  @ApiProperty() responsibleId!: string;
  @ApiProperty() responsibleName!: string;
  @ApiProperty() highlightedAt!: string;
  @ApiProperty() revision!: number;
  @ApiProperty({ type: HandoverContentDto }) content!: HandoverContentDto;
  @ApiProperty({ enum: ["none", "open", "in-progress", "resolved"] })
  issueState!: "none" | "open" | "in-progress" | "resolved";
  @ApiProperty() highlighted!: boolean;
}
export class HandoverCreateDto {
  @ApiProperty() key!: string;
  @ApiProperty() responsibleId!: string;
  @ApiProperty({ type: HandoverContentDto }) content!: HandoverContentDto;
  @ApiProperty() issue!: boolean;
}
export class HandoverChangeDto {
  @ApiProperty() id!: string;
  @ApiProperty() note!: string;
  @ApiProperty() expectedRevision!: number;
  @ApiProperty({
    enum: ["correct", "follow-up", "state", "assign", "highlight"],
  })
  action!: "correct" | "follow-up" | "state" | "assign" | "highlight";
  @ApiPropertyOptional({ type: HandoverContentDto })
  content?: HandoverContentDto;
  @ApiPropertyOptional({ enum: ["none", "open", "in-progress", "resolved"] })
  state?: "none" | "open" | "in-progress" | "resolved";
  @ApiPropertyOptional() responsibleId?: string;
  @ApiPropertyOptional() highlighted?: boolean;
}
export class HandoverSelectionDto {
  @ApiPropertyOptional() mine?: boolean;
  @ApiPropertyOptional() attention?: boolean;
  @ApiProperty() from!: string;
  @ApiProperty() to!: string;
  @ApiProperty() departmentId!: string;
  @ApiProperty() areaId!: string;
  @ApiProperty() equipmentReferenceId!: string;
  @ApiProperty() categoryId!: string;
  @ApiProperty() search!: string;
  @ApiProperty() cursor!: string;
  @ApiProperty({
    enum: ["", "none", "open", "in-progress", "resolved", "pending"],
  })
  state!: "none" | "open" | "in-progress" | "resolved" | "" | "pending";
  @ApiProperty() highlights!: boolean;
}
export class HandoverPageDto {
  @ApiProperty({ type: [HandoverEntryDto] }) entries!: HandoverEntryDto[];
  @ApiProperty() nextCursor!: string;
  @ApiProperty() total!: number;
}
export class HandoverRevisionDto {
  @ApiProperty({ type: HandoverEntryDto }) entry!: HandoverEntryDto;
  @ApiProperty() actorId!: string;
  @ApiProperty() actorName!: string;
  @ApiProperty() action!: string;
  @ApiProperty() note!: string;
  @ApiProperty() at!: string;
}
export class HandoverHistoryRequestDto {
  @ApiProperty() id!: string;
  @ApiProperty() before!: number;
}
export class HandoverHistoryDto {
  @ApiProperty({ type: HandoverEntryDto }) entry!: HandoverEntryDto;
  @ApiProperty({ type: [HandoverRevisionDto] })
  revisions!: HandoverRevisionDto[];
  @ApiProperty() nextBefore!: number;
}

export class HandoverEquipmentRequestDto {
  @ApiProperty() departmentId!: string;
  @ApiProperty() areaId!: string;
  @ApiProperty() search!: string;
  @ApiProperty() after!: string;
}
export class HandoverEquipmentPageDto {
  @ApiProperty({ type: [String] }) codes!: string[];
  @ApiProperty() nextCursor!: string;
}

export class HandoverRemoveDto {
  @ApiProperty() id!: string;
  @ApiProperty() expectedRevision!: number;
}
