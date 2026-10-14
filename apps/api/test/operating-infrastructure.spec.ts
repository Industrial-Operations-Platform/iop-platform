import { auditChange,AuditError,type AuditChange } from "../src/modules/audit/domain/events";
import { input,JobError } from "../src/modules/jobs/domain/jobs";
import { Jobs,type JobTransaction } from "../src/modules/jobs/application/jobs";
const event:AuditChange={operationId:"operation",module:"jobs",action:"changed",subjectType:"job",subjectId:"job",revision:2,beforeRevision:1,state:"running",beforeState:"queued",reason:"none"};
test("Audit accepts only versioned safe lifecycle fields and rejects source bodies or personal/secret extensions",()=>{
 expect(auditChange(event)).toEqual(event);
 for(const extension of [{password:"secret"},{name:"Person"},{raw:"source bytes"},{details:"Arbitrary content"}])expect(()=>auditChange({...event,...extension})).toThrow(AuditError);
 expect(()=>auditChange({...event,module:"unknown" as AuditChange["module"]})).toThrow(AuditError);
 expect(()=>auditChange({...event,state:"Contains a personal name"})).toThrow(AuditError);
 expect(auditChange({...event,occurredAt:"2026-10-14T00:00:00.000Z"}).occurredAt).toBe("2026-10-14T00:00:00.000Z");
 expect(()=>auditChange({...event,occurredAt:"2026-02-31T00:00:00.000Z"})).toThrow(AuditError);
});
test("job admission bounds keys, payload primitives and obvious private credential fields",()=>{
 expect(input({key:"request",type:"local-check",payload:{value:12}})).toEqual({key:"request",type:"local-check",payload:{value:12}});
 for(const payload of [{password:"secret"},{token:"secret"},{email:"person"},{value:Infinity},{value:{nested:true}}])expect(()=>input({key:"request",type:"local-check",payload:payload as never})).toThrow(JobError);
 expect(JSON.stringify(input({key:"request",type:"local-check",payload:{value:12,failUntil:1}}))).toBe(JSON.stringify(input({key:"request",type:"local-check",payload:{failUntil:1,value:12}})));
});
test("durable claim is followed by a fresh initiating-user authority check before execution",async()=>{
 const claimed={id:"job"} as never,execute=jest.fn(),tx={claim:async()=>claimed,execute} as unknown as JobTransaction;let calls=0;
 const jobs=new Jobs({run:async(actor,work)=>{expect(actor).toBe("initiator");if(++calls===2)throw new JobError("job_denied");return work(tx);}},()=>"lease",()=>"2026-10-14T00:00:00.000Z");
 await expect(jobs.tick("initiator")).rejects.toThrow("job_denied");expect(execute).not.toHaveBeenCalled();expect(calls).toBe(2);
});
