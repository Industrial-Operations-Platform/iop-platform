import { randomUUID,createHash } from "node:crypto";
import type { Pool } from "pg";
import { runSiteOperation,SiteAccessDeniedError,type SiteTransaction } from "../../../../persistence/site-operation";
import type { JobStore,JobTransaction } from "../../application/jobs";
import { JobError,JobTransientError,JobConfigurationPending,payload,type Job,type JobInput } from "../../domain/jobs";
export interface JobHandler {
  permission: string;
  keys: string[];
  validate?(payload: JobInput["payload"]): void;
  execute(tx: SiteTransaction,job: Job): Promise<Record<string,string | number | boolean>>;
}
export interface JobLookup {
  allowed(tx: SiteTransaction,actor: string,permission: string): Promise<boolean>;
  profile(tx: SiteTransaction,actor: string): Promise<string>;
  handlers: Record<string,JobHandler>;
  audit(tx: SiteTransaction,job: Job,before: Job | null,action: "created" | "changed" | "completed" | "retry" | "waiting" | "failed"): Promise<void>;
}
export class PgJobs implements JobStore {
  constructor(private readonly pool: Pool,private readonly scope:{organizationId:string;siteId:string},private readonly lookup:JobLookup){}
  run<T>(actor:string,work:(tx:JobTransaction)=>Promise<T>):Promise<T>{
    return runSiteOperation(this.pool,{...this.scope,userId:actor,permissions:["jobs.manage"]},async(tx)=>{
      await tx.query("SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))",[this.scope.organizationId]);
      if(!await this.lookup.allowed(tx,actor,"jobs.manage")||await this.lookup.profile(tx,actor)!=="administrator")throw new SiteAccessDeniedError();
      return work(new PgJobTransaction(tx,this.lookup));
    });
  }
}
class PgJobTransaction implements JobTransaction {
  constructor(private readonly tx:SiteTransaction,private readonly lookup:JobLookup){}
  private get scope(){return [this.tx.context.organizationId,this.tx.context.siteId,this.tx.context.userId];}
  async create(input:JobInput,at:string):Promise<Job>{
    const fingerprint=createHash("sha256").update(JSON.stringify({type:input.type,payload:input.payload})).digest("hex");
    await this.tx.query("SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))",[this.scope.join(":"),input.key]);
    const prior=await this.tx.query("SELECT snapshot FROM jobs.records WHERE organization_id=$1 AND site_id=$2 AND initiator_id=$3 AND request_key=$4",[...this.scope,input.key]);
    if(prior.rows[0]){const job=prior.rows[0].snapshot as Job;if(job.fingerprint!==fingerprint)throw new JobError("job_conflict");return job;}
    const handler=this.lookup.handlers[input.type];
    if(handler&&Object.keys(input.payload).some(key=>!handler.keys.includes(key)))throw new JobError("invalid_job");
    handler?.validate?.(input.payload);
    if(handler&&!await this.lookup.allowed(this.tx,this.tx.context.userId,handler.permission))throw new SiteAccessDeniedError();
    const job:Job={id:randomUUID(),type:input.type,initiatorId:this.tx.context.userId,key:input.key,fingerprint,payload:input.payload,revision:1,state:"queued",attempts:0,maxAttempts:5,availableAt:at,leaseToken:"",leaseUntil:"",createdAt:at,updatedAt:at,reason:"none",result:{}};
    await this.tx.query(`INSERT INTO jobs.records(organization_id,site_id,id,initiator_id,request_key,state,available_at,lease_until,revision,snapshot)
      VALUES($1,$2,$4,$3,$5,$6,$7,NULL,$8,$9)`,[...this.scope,job.id,job.key,job.state,job.availableAt,job.revision,JSON.stringify(job)]);
    await this.lookup.audit(this.tx,job,null,"created");return job;
  }
  async get(id:string):Promise<Job|null>{const result=await this.tx.query("SELECT snapshot FROM jobs.records WHERE organization_id=$1 AND site_id=$2 AND initiator_id=$3 AND id=$4 FOR UPDATE",[...this.scope,id]);return result.rows[0]?.snapshot as Job??null;}
  async claim(at:string,token:string):Promise<Job|null>{
    const result=await this.tx.query(`SELECT snapshot FROM jobs.records WHERE organization_id=$1 AND site_id=$2 AND initiator_id=$3
      AND ((state IN('queued','retry','waiting-handler','waiting-configuration') AND available_at<=$4::timestamptz) OR (state='running' AND lease_until<=$4::timestamptz))
      ORDER BY available_at,id FOR UPDATE SKIP LOCKED LIMIT 1`,[...this.scope,at]);
    if(!result.rows.length)return null;
    const before=result.rows[0].snapshot as Job,job=structuredClone(before);
    if(job.attempts>=job.maxAttempts){job.state="failed";job.reason="exhausted";job.leaseToken="";job.leaseUntil="";await this.save(job,before,"failed",at);return job;}
    job.state="running";job.attempts++;job.leaseToken=token;job.leaseUntil=new Date(Date.parse(at)+60000).toISOString();
    await this.save(job,before,"changed",at);return job;
  }
  async execute(claimed:Job,at:string):Promise<Job>{
    const current=await this.get(claimed.id);
    if(!current||current.state!=="running"||current.leaseToken!==claimed.leaseToken||current.leaseUntil<=at)throw new JobError("job_conflict");
    const job=structuredClone(current),handler=this.lookup.handlers[job.type];let action:"completed"|"retry"|"waiting"|"failed"="completed";
    if(!handler){job.state="waiting-handler";job.reason="missing-handler";job.attempts--;action="waiting";}
    else {
      if(!await this.lookup.allowed(this.tx,job.initiatorId,handler.permission))throw new SiteAccessDeniedError();
      if(Object.keys(job.payload).some(key=>!handler.keys.includes(key)))throw new JobError("invalid_job");
      handler.validate?.(job.payload);
      await this.tx.query("SAVEPOINT job_effect");
      try { job.result=payload(await handler.execute(this.tx,job));job.state="completed";job.reason="none";await this.tx.query("RELEASE SAVEPOINT job_effect"); }
      catch(error){
        if(!(error instanceof JobTransientError)&&!(error instanceof JobConfigurationPending))throw error;
        await this.tx.query("ROLLBACK TO SAVEPOINT job_effect");await this.tx.query("RELEASE SAVEPOINT job_effect");
        if(error instanceof JobConfigurationPending){job.state="waiting-configuration";job.reason="missing-configuration";job.attempts--;action="waiting";}
        else if(job.attempts>=job.maxAttempts){job.state="failed";job.reason="exhausted";action="failed";}
        else {job.state="retry";job.reason="transient";action="retry";}
      }
    }
    job.availableAt=new Date(Date.parse(at)+(job.state.startsWith("waiting")?60000:Math.min(60000,1000*2**Math.max(0,job.attempts-1)))).toISOString();
    job.leaseToken="";job.leaseUntil="";await this.save(job,current,action,at);return job;
  }
  private async save(job:Job,before:Job,action:Parameters<JobLookup["audit"]>[3],at:string){job.revision++;job.updatedAt=at;
    await this.tx.query("UPDATE jobs.records SET state=$5,available_at=$6,lease_until=$7,revision=$8,snapshot=$9 WHERE organization_id=$1 AND site_id=$2 AND initiator_id=$3 AND id=$4",[...this.scope,job.id,job.state,job.availableAt,job.leaseUntil||null,job.revision,JSON.stringify(job)]);
    await this.lookup.audit(this.tx,job,before,action);
  }
}
