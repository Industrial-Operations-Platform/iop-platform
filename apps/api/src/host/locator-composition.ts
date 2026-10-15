import { siteMaterialAudit } from "../modules/audit/adapters/postgres/site-material";
import type {Pool} from 'pg';
import {composeLocator} from '../modules/asset-locator/adapters/composition';
import {locatorAsset,locatorAssets} from '../modules/assets/adapters/postgres/locator-read';
import {locatorEvidenceAssets} from '../modules/assets/adapters/postgres/locator-evidence-assets';
import {assetClassificationSources} from '../modules/assets/adapters/postgres/classification-sources';
import {equipmentMessageEvidence} from '../modules/oip/adapters/postgres/equipment-message-evidence';
import type {ClassificationEvidenceSource, ClassificationSourceEvidence} from '../modules/asset-locator/application/classification-evidence';
import {locatorHandoverProblems} from '../modules/shift-handover/adapters/postgres/locator-problems';
import {locatorMaintenanceProblems} from '../modules/maintenance/adapters/postgres/locator-problems';
import {sitePersonProfile} from '../modules/users-rbac/adapters/postgres/site-people';
import {evaluateSiteAccess} from '../modules/users-rbac';
import {runSiteOperation,SiteAccessDeniedError,type SiteTransaction} from '../persistence/site-operation';
import {LocatorError,type Problems} from '../modules/asset-locator/domain/locator';
export function composePlatformLocator(pool:Pool,scope:{organizationId:string;siteId:string;sourceId?:string},
  locations:readonly {id:string;label:string;parentId:string}[],referenceRoot:string) {
  const allowed=async(tx:SiteTransaction,actor:string,permission:string)=>
    (await evaluateSiteAccess(tx,{...scope,userId:actor,permissions:[permission]})).allowed;
  const requireAssets=async(tx:SiteTransaction)=>{
    if(!await allowed(tx,tx.context.userId,'assets.read'))throw new SiteAccessDeniedError();
  };
  const classificationEvidence:ClassificationEvidenceSource=(actor,assetId)=>runSiteOperation(pool,
    {...scope,userId:actor,permissions:['locator.manage','assets.read','analytics.read']},async tx=>{
      await tx.query("SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))",[scope.organizationId]);
      if(await sitePersonProfile(tx,scope.organizationId,scope.siteId,actor)!=='administrator')throw new SiteAccessDeniedError();
      if(!scope.sourceId){
        if(!await locatorAsset(tx,assetId))throw new LocatorError('locator_missing');
        return {assetId,coverage:'unmapped',totalSources:0,sources:[]};
      }
      const source={...scope,sourceId:scope.sourceId},references=await assetClassificationSources(tx,source,assetId);
      if(!references)throw new LocatorError('locator_missing');
      const sources:ClassificationSourceEvidence[]=[];
      for(const reference of references.sources)sources.push({...reference,...await equipmentMessageEvidence(tx,source,{area:reference.area,code:reference.code})});
      return {assetId,totalSources:references.totalSources,sources,
        coverage:references.totalSources>sources.length||sources.some(value=>value.total>value.evidence.length)?'limited':
          sources.some(value=>value.total>0)?'available':'unmapped'};
    });
  return composeLocator({pool,scope,locations,referenceRoot,classificationEvidence,lookups:{
    audit: siteMaterialAudit,
    allowed,profile:(tx,actor)=>sitePersonProfile(tx,scope.organizationId,scope.siteId,actor),
    asset:async(tx,id)=>{await requireAssets(tx);return locatorAsset(tx,id);},
    assets:async(tx,search)=>{await requireAssets(tx);return locatorAssets(tx,search);},
    problems:async(tx,ids)=>{
      const result:Problems={items:[],coverage:[]};
      // Identity/alias context is an Assets-owned read; it grants no source evidence.
      if(!await allowed(tx,tx.context.userId,'assets.read')){
        return {items:[],coverage:[{kind:'handover',status:'not-authorized'},{kind:'maintenance',status:'not-authorized'}]};
      }
      const assets=await locatorEvidenceAssets(tx,ids);
      const sources=[{kind:'handover' as const,permission:'handover.read',read:locatorHandoverProblems},
        {kind:'maintenance' as const,permission:'maintenance.read',read:locatorMaintenanceProblems}];
      for(const source of sources){
        if(!await allowed(tx,tx.context.userId,source.permission)){
          result.coverage.push({kind:source.kind,status:'not-authorized'});continue;
        }
        try{result.items.push(...await source.read(tx,assets));result.coverage.push({kind:source.kind,status:'available'});}
        catch{result.coverage.push({kind:source.kind,status:'unavailable'});}
      }
      return result;
    },
  }});
}
