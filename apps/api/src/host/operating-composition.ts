import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { Jobs } from "../modules/jobs/application/jobs";
import { PgJobs,type JobHandler } from "../modules/jobs/adapters/postgres/store";
import { JobTransientError, JobError } from "../modules/jobs/domain/jobs";
import { appendAudit } from "../modules/audit/adapters/postgres/append";
import { evaluateSiteAccess } from "../modules/users-rbac";
import { sitePersonProfile } from "../modules/users-rbac/adapters/postgres/site-people";
/** A real local queue exercise; it sends nothing externally and has one durable idempotent effect. */
const validateLocalCheck:NonNullable<JobHandler["validate"]> = (payload) => {
  if(typeof payload.value!=="number"||!Number.isSafeInteger(payload.value)||payload.value<0||payload.value>1000000||
    (payload.failUntil!==undefined&&(!Number.isSafeInteger(payload.failUntil)||Number(payload.failUntil)<0||Number(payload.failUntil)>4)))throw new JobError("invalid_job");
};
export const localCheckHandler:JobHandler={permission:"jobs.manage",keys:["value","failUntil"],validate:validateLocalCheck,execute:async(tx,job)=>{
  validateLocalCheck(job.payload);
  await tx.query("INSERT INTO jobs.local_effects(organization_id,site_id,job_id,value) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",[tx.context.organizationId,tx.context.siteId,job.id,job.payload.value]);
  if(job.attempts<=Number(job.payload.failUntil??0))throw new JobTransientError();
  return {verified:true,value:job.payload.value};
}};
export function composeJobs(pool:Pool,scope:{organizationId:string;siteId:string},handlers:Record<string,JobHandler>={"local-check":localCheckHandler},now=()=>new Date().toISOString()){
  return new Jobs(new PgJobs(pool,scope,{
    allowed:async(tx,actor,permission)=>(await evaluateSiteAccess(tx,{...scope,userId:actor,permissions:[permission]})).allowed,
    profile:(tx,actor)=>sitePersonProfile(tx,scope.organizationId,scope.siteId,actor),handlers,
    audit:(tx,job,before,action)=>appendAudit(tx,{operationId:job.id+":"+job.revision,module:"jobs",action,subjectType:"job",subjectId:job.id,
      revision:job.revision,beforeRevision:before?.revision??0,state:job.state,beforeState:before?.state??"",reason:job.reason,occurredAt:job.updatedAt}),
  }),randomUUID,now);
}
