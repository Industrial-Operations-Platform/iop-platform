import {ApiProperty} from "@nestjs/swagger";
import type {IntegrationKind} from "../modules/integrations/domain/connections";
export class ConnectionConfigurationDto {
  @ApiProperty({enum:['wincc','ultimo','entra']}) kind!: IntegrationKind;
  @ApiProperty({maxLength:100}) label!: string;
  @ApiProperty() enabled!: boolean;
  @ApiProperty({maxLength:500,description:'HTTPS endpoint without credentials, query or fragment.'}) endpoint!: string;
  @ApiProperty({maxLength:100}) contractVersion!: string;
  @ApiProperty({maxLength:100,description:'Logical reference only; never a secret value.'}) credentialReference!: string;
  @ApiProperty({maxLength:100}) tenantId!: string;
  @ApiProperty({maxLength:100}) clientId!: string;
}
export class ConnectionDto {
  @ApiProperty({type:ConnectionConfigurationDto}) configuration!: ConnectionConfigurationDto;
  @ApiProperty() revision!: number;
  @ApiProperty() updatedAt!: string;
  @ApiProperty() updatedBy!: string;
}
export class ConnectionReadinessDto extends ConnectionDto {
  @ApiProperty({enum:['disabled','configuration-pending','transport-pending']}) status!: 'disabled'|'configuration-pending'|'transport-pending';
  @ApiProperty({enum:['contract-ready']}) adapter!: 'contract-ready';
  @ApiProperty({type:[String]}) missingInputs!: string[];
  @ApiProperty({type:String,nullable:true}) lastSuccessfulConnection!: null;
}
export class ConnectionsDto { @ApiProperty({type:[ConnectionReadinessDto]}) connections!: ConnectionReadinessDto[]; }
export class ConnectionSaveDto {
  @ApiProperty({minimum:0}) expectedRevision!: number;
  @ApiProperty({type:ConnectionConfigurationDto}) configuration!: ConnectionConfigurationDto;
}
export class ConnectionHistoryRequestDto { @ApiProperty({enum:['wincc','ultimo','entra']}) kind!: IntegrationKind; }
export class ConnectionHistoryDto { @ApiProperty({type:[ConnectionDto]}) revisions!: ConnectionDto[]; }
