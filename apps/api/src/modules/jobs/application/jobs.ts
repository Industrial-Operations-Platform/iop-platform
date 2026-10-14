import { input, identifier, JobError, type Job, type JobInput } from "../domain/jobs";
export interface JobTransaction {
  create(input: JobInput, at: string): Promise<Job>;
  get(id: string): Promise<Job | null>;
  claim(at: string, token: string): Promise<Job | null>;
  execute(job: Job, at: string): Promise<Job>;
}
export interface JobStore { run<T>(actor: string, work: (tx: JobTransaction) => Promise<T>): Promise<T> }
export class Jobs {
  constructor(private readonly store: JobStore, private readonly token: () => string, private readonly now: () => string) {}
  submit(actor: string, request: JobInput) { const value=input(request);return this.store.run(actor,(tx)=>tx.create(value,this.now())); }
  get(actor: string,id: string) { identifier(id);return this.store.run(actor,async(tx)=>{const job=await tx.get(id);if(!job)throw new JobError("job_missing");return job;}); }
  async tick(actor: string) {
    const claimed=await this.store.run(actor,(tx)=>tx.claim(this.now(),this.token()));
    if (!claimed) return { processed: false, job: null };
    if (claimed.state === "failed") return { processed: true, job: claimed };
    // Execution is separately authorized after durable claim; no permission snapshot survives the lease.
    const job=await this.store.run(actor,(tx)=>tx.execute(claimed,this.now()));
    return { processed: true, job };
  }
}
