import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Source, Coverage } from '../modules/operational-overview/domain/overview';
export class OverviewLocationDto {
    @ApiProperty()
    id!: string;
    @ApiProperty()
    label!: string;
    @ApiProperty()
    parentId!: string;
    @ApiProperty()
    role!: string;
}
export class OverviewCardDto {
    @ApiProperty({ enum: ['assets', 'handover', 'maintenance', 'area', 'analytics', 'shift'] })
    source!: 'assets' | 'handover' | 'maintenance' | 'area' | 'analytics' | 'shift';
    @ApiProperty()
    id!: string;
    @ApiProperty()
    title!: string;
    @ApiProperty()
    summary!: string;
    @ApiProperty()
    locationId!: string;
    @ApiProperty()
    locationLabel!: string;
    @ApiProperty()
    status!: string;
    @ApiProperty()
    date!: string;
    @ApiProperty()
    assetId!: string;
}
export class OverviewCoverageDto {
    @ApiProperty({ enum: ['areas', 'assets', 'handover', 'maintenance', 'analytics', 'shifts'] })
    source!: Source;
    @ApiProperty({ enum: ['available', 'not-authorized', 'unavailable', 'not-configured', 'unmapped'] })
    coverage!: Coverage;
}
export class OverviewGroupDto extends OverviewCoverageDto {
    @ApiProperty()
    view!: string;
    @ApiProperty({ type: [OverviewCardDto] })
    items!: OverviewCardDto[];
    @ApiProperty()
    total!: number;
    @ApiProperty()
    nextCursor!: string;
    @ApiProperty()
    limit!: number;
}
export class OverviewContextDto {
    @ApiProperty({ type: [OverviewLocationDto] })
    locations!: OverviewLocationDto[];
    @ApiProperty()
    timeZone!: string;
    @ApiProperty()
    today!: string;
    @ApiProperty({ type: [OverviewCoverageDto] })
    sources!: OverviewCoverageDto[];
}
export class OverviewCursorsDto {
    @ApiProperty()
    assets!: string;
    @ApiProperty()
    handover!: string;
    @ApiProperty()
    maintenance!: string;
}
export class OverviewSearchDto {
    @ApiProperty({ maxLength: 160 })
    query!: string;
    @ApiProperty()
    locationId!: string;
    @ApiProperty({ type: OverviewCursorsDto })
    cursors!: OverviewCursorsDto;
}
export class OverviewSearchResultDto {
    @ApiProperty()
    query!: string;
    @ApiProperty()
    locationId!: string;
    @ApiProperty({ type: [OverviewGroupDto] })
    groups!: OverviewGroupDto[];
}
export class OverviewAreaRequestDto {
    @ApiProperty()
    locationId!: string;
    @ApiProperty()
    date!: string;
    @ApiProperty({ description: 'Explicit current formal record selection; empty means no record selected.' })
    recordId!: string;
    @ApiPropertyOptional({ description: 'Source-owned formal record page cursor.' })
    recordCursor?: string;
}
export class OverviewAnalyticsDto {
    @ApiProperty({ enum: ['available', 'not-authorized', 'unavailable', 'not-configured', 'unmapped'] })
    coverage!: Coverage;
    @ApiProperty()
    from!: string;
    @ApiProperty()
    toExclusive!: string;
    @ApiProperty({ nullable: true, type: Number })
    frequency!: number | null;
    @ApiProperty({ nullable: true, type: Number })
    seconds!: number | null;
    @ApiProperty({ nullable: true, type: Number })
    records!: number | null;
    @ApiProperty({ type: [String] })
    importDates!: string[];
    @ApiProperty()
    note!: string;
}
export class OverviewShiftsDto {
    @ApiProperty({ enum: ['available', 'not-authorized', 'unavailable', 'not-configured', 'unmapped'] })
    coverage!: Coverage;
    @ApiProperty({ type: [OverviewCardDto] })
    options!: OverviewCardDto[];
    @ApiProperty({ nullable: true, type: OverviewCardDto })
    current!: OverviewCardDto | null;
    @ApiProperty({ nullable: true, type: OverviewCardDto })
    previous!: OverviewCardDto | null;
    @ApiProperty()
    note!: string;
    @ApiProperty()
    total!: number;
    @ApiProperty()
    nextCursor!: string;
}
export class OverviewAreaDto {
    @ApiProperty({ type: OverviewAreaRequestDto })
    selection!: OverviewAreaRequestDto;
    @ApiProperty({ type: OverviewLocationDto })
    location!: OverviewLocationDto;
    @ApiProperty({ type: [OverviewGroupDto] })
    groups!: OverviewGroupDto[];
    @ApiProperty({ type: OverviewAnalyticsDto })
    analytics!: OverviewAnalyticsDto;
    @ApiProperty({ type: OverviewShiftsDto })
    shifts!: OverviewShiftsDto;
    @ApiProperty()
    timeZone!: string;
}
export class OverviewEmptyDto {
}
