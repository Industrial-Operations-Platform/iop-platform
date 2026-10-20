import { ApiProperty } from '@nestjs/swagger';
import { componentKinds, type ComponentKind } from '../modules/asset-locator/domain/locator';
import { modelStates, type ModelState } from '../modules/asset-locator/domain/model-preparation';
export class LocatorComponentDto {
  @ApiProperty()
  id!: string;
  @ApiProperty({ enum: componentKinds })
  kind!: ComponentKind;
  @ApiProperty()
  label!: string;
  @ApiProperty({ minimum: 0, maximum: 1 })
  x!: number;
  @ApiProperty({ minimum: 0, maximum: 1 })
  y!: number;
  @ApiProperty({ nullable: true, type: Number, description: 'Unknown until surveyed; normalized elevation, never metric height.' })
  elevation!: number | null;
  @ApiProperty()
  rotation!: number;
  @ApiProperty()
  width!: number;
  @ApiProperty()
  depth!: number;
  @ApiProperty()
  height!: number;
  @ApiProperty()
  assetId!: string;
  @ApiProperty({ enum: ['provisional', 'surveyed'] })
  verification!: 'provisional' | 'surveyed';
  @ApiProperty()
  note!: string;
}
export class LocatorContentDto {
  @ApiProperty()
  name!: string;
  @ApiProperty()
  group!: string;
  @ApiProperty()
  locationId!: string;
  @ApiProperty()
  referenceId!: string;
  @ApiProperty()
  description!: string;
  @ApiProperty({ enum: ['pending', 'surveyed'] })
  calibration!: 'pending' | 'surveyed';
  @ApiProperty()
  surveyNote!: string;
  @ApiProperty({ type: [LocatorComponentDto], maxItems: 1000 })
  components!: LocatorComponentDto[];
}
export class LocatorSceneDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  revision!: number;
  @ApiProperty()
  authorId!: string;
  @ApiProperty()
  createdAt!: string;
  @ApiProperty()
  updatedAt!: string;
  @ApiProperty({ type: LocatorContentDto })
  content!: LocatorContentDto;
}
export class LocatorReferenceDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  group!: string;
  @ApiProperty()
  sourcePath!: string;
  @ApiProperty()
  sha256!: string;
  @ApiProperty()
  width!: number;
  @ApiProperty()
  height!: number;
  @ApiProperty()
  bytes!: number;
  @ApiProperty()
  importedAt!: string;
  @ApiProperty({ enum: ['schematic', 'legend'] })
  kind!: 'schematic' | 'legend';
}
export class LocatorReferenceDimensionsDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  width!: number;
  @ApiProperty()
  height!: number;
}
export class LocatorLocationDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  label!: string;
  @ApiProperty()
  parentId!: string;
}
export class LocatorTemplateDto {
  @ApiProperty({ enum: componentKinds })
  kind!: ComponentKind;
  @ApiProperty()
  width!: number;
  @ApiProperty()
  depth!: number;
  @ApiProperty()
  height!: number;
}
export class LocatorContextDto {
  @ApiProperty()
  canManage!: boolean;
  @ApiProperty({ type: [LocatorReferenceDto] })
  references!: LocatorReferenceDto[];
  @ApiProperty({ type: [LocatorReferenceDimensionsDto] })
  referenceDimensions!: LocatorReferenceDimensionsDto[];
  @ApiProperty({ type: [LocatorLocationDto] })
  locations!: LocatorLocationDto[];
  @ApiProperty({ type: [LocatorTemplateDto] })
  componentCatalog!: LocatorTemplateDto[];
  @ApiProperty()
  coordinateSystem!: string;
  @ApiProperty({ enum: ['pending'] })
  globalCalibration!: 'pending';
}
export class LocatorQueryDto {
  @ApiProperty()
  search!: string;
  @ApiProperty()
  group!: string;
}
export class LocatorPageDto {
  @ApiProperty({ type: [LocatorSceneDto] })
  scenes!: LocatorSceneDto[];
  @ApiProperty()
  total!: number;
}
export class LocatorSaveDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  expectedRevision!: number;
  @ApiProperty()
  note!: string;
  @ApiProperty({ type: LocatorContentDto })
  content!: LocatorContentDto;
}
export class LocatorIdDto {
  @ApiProperty()
  id!: string;
}
export class LocatorHistoryRequestDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  before!: number;
}
export class LocatorRevisionDto {
  @ApiProperty({ type: LocatorSceneDto })
  scene!: LocatorSceneDto;
  @ApiProperty()
  actorId!: string;
  @ApiProperty()
  note!: string;
  @ApiProperty()
  at!: string;
}
export class LocatorHistoryDto {
  @ApiProperty({ type: [LocatorRevisionDto] })
  revisions!: LocatorRevisionDto[];
  @ApiProperty()
  nextBefore!: number;
}
export class LocatorAssetDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  code!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  locationId!: string;
  @ApiProperty()
  status!: string;
}
export class LocatorProblemDto {
  @ApiProperty()
  assetId!: string;
  @ApiProperty({ enum: ['handover', 'maintenance'] })
  kind!: 'handover' | 'maintenance';
  @ApiProperty()
  id!: string;
  @ApiProperty()
  title!: string;
  @ApiProperty()
  status!: string;
  @ApiProperty()
  recordedAt!: string;
}
export class LocatorCoverageDto {
  @ApiProperty({ enum: ['handover', 'maintenance'] })
  kind!: 'handover' | 'maintenance';
  @ApiProperty({ enum: ['available', 'not-authorized', 'unavailable'] })
  status!: 'available' | 'not-authorized' | 'unavailable';
}
export class LocatorProblemsDto {
  @ApiProperty({ type: [LocatorProblemDto] })
  items!: LocatorProblemDto[];
  @ApiProperty({ type: [LocatorCoverageDto] })
  coverage!: LocatorCoverageDto[];
}
export class LocatorDetailDto {
  @ApiProperty({ type: LocatorSceneDto })
  scene!: LocatorSceneDto;
  @ApiProperty({ type: [LocatorAssetDto] })
  assets!: LocatorAssetDto[];
  @ApiProperty({ type: LocatorProblemsDto })
  problems!: LocatorProblemsDto;
}
export class LocatorSearchDto {
  @ApiProperty()
  search!: string;
  @ApiProperty()
  unplacedOnly!: boolean;
}
export class LocatorPlacementDto {
  @ApiProperty()
  sceneId!: string;
  @ApiProperty()
  sceneName!: string;
  @ApiProperty()
  componentId!: string;
  @ApiProperty()
  label!: string;
  @ApiProperty({ enum: ['provisional', 'surveyed'] })
  verification!: 'provisional' | 'surveyed';
}
export class LocatorSearchResultDto {
  @ApiProperty({ type: LocatorAssetDto })
  asset!: LocatorAssetDto;
  @ApiProperty({ type: [LocatorPlacementDto] })
  placements!: LocatorPlacementDto[];
}
export class LocatorSearchResultsDto {
  @ApiProperty({ type: [LocatorSearchResultDto] })
  results!: LocatorSearchResultDto[];
  @ApiProperty({ type: LocatorProblemsDto })
  problems!: LocatorProblemsDto;
  @ApiProperty()
  total!: number;
  @ApiProperty()
  limit!: number;
}
export class LocatorBootstrapDto {
  @ApiProperty()
  created!: number;
  @ApiProperty()
  referenceCount!: number;
}
export class LocatorEmptyDto {
}
export class LocatorLocateDto {
  @ApiProperty()
  assetId!: string;
}
export class LocatorModelPreviewDto {
  @ApiProperty() referenceId!: string;
  @ApiProperty() referenceName!: string;
  @ApiProperty() sceneId!: string;
  @ApiProperty() expectedRevision!: number;
  @ApiProperty({ enum: modelStates }) status!: ModelState;
  @ApiProperty() componentCount!: number;
  @ApiProperty() motors!: number;
  @ApiProperty() photoelectricSensors!: number;
  @ApiProperty() conveyors!: number;
}
export class LocatorModelsDto {
  @ApiProperty({ type: [LocatorModelPreviewDto] }) models!: LocatorModelPreviewDto[];
}
export class LocatorModelApplyDto {
  @ApiProperty() id!: string;
  @ApiProperty({ minimum: 1 }) expectedRevision!: number;
}
export class LocatorModelResultDto {
  @ApiProperty() sceneId!: string;
  @ApiProperty() revision!: number;
  @ApiProperty({ enum: [...modelStates, 'applied'] }) status!: ModelState | 'applied';
}
export class LocatorMessageEvidenceDto {
  @ApiProperty() importId!: string;
  @ApiProperty() sourceRecordNumber!: number;
  @ApiProperty() reportingDate!: string;
  @ApiProperty() message!: string;
}
export class LocatorClassificationSourceDto {
  @ApiProperty() sourceId!: string;
  @ApiProperty() area!: string;
  @ApiProperty() code!: string;
  @ApiProperty({ enum: ['reviewed-mapping', 'exact-alias'] }) origin!: 'reviewed-mapping' | 'exact-alias';
  @ApiProperty() mappingId!: string;
  @ApiProperty() mappingRevision!: number;
  @ApiProperty() total!: number;
  @ApiProperty({ type: [LocatorMessageEvidenceDto] }) evidence!: LocatorMessageEvidenceDto[];
}
export class LocatorClassificationDto {
  @ApiProperty() assetId!: string;
  @ApiProperty({ enum: ['available', 'unmapped', 'limited'] }) coverage!: 'available' | 'unmapped' | 'limited';
  @ApiProperty() totalSources!: number;
  @ApiProperty({ type: [LocatorClassificationSourceDto] }) sources!: LocatorClassificationSourceDto[];
  @ApiProperty({ enum: ['', 'photoelectric-sensor'] }) suggestedKind!: '' | 'photoelectric-sensor';
  @ApiProperty() matchedMessages!: number;
}
