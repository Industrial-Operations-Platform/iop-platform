import { auditCatalog, auditChange, AuditError, type AuditChange } from "../src/modules/audit/domain/events";
import { siteMaterialAudit, type SiteMaterialEvent } from "../src/modules/audit/adapters/postgres/site-material";
import type { SiteTransaction } from "../src/persistence/site-operation";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("the SQL catalog and versioned application catalog register the same semantic event pairs",()=>{
  const sql=readFileSync(resolve(__dirname,"../../../infra/database/migrations/20261014070000-site-material-audit.sql"),"utf8");
  const declared=[...sql.matchAll(/'([a-z-]+\.[a-z-]+)'/g)].map(match=>match[1]);
  expect(declared.sort()).toEqual(Object.entries(auditCatalog).flatMap(([module,actions])=>actions.map(action=>module+"."+action)).sort());
  const event:AuditChange={operationId:"operation",module:"assets",action:"created",subjectType:"asset",subjectId:"id",revision:1,beforeRevision:0,state:"unverified",beforeState:"",reason:"none"};
  expect(()=>auditChange({...event,action:"received"})).toThrow(AuditError);
});
test("owner ports exclude free text, credentials, health absence state and unknown subjects before touching storage",async()=>{
  const query=jest.fn(),tx={context:{organizationId:"org",siteId:"site",userId:"actor"},query} as unknown as SiteTransaction;
  const event:SiteMaterialEvent={subjectType:"workforce-schedule",id:"record",action:"created",revision:1,beforeRevision:0,state:"active",beforeState:""};
  for(const invalid of [{...event,note:"private source body"},{...event,password:"secret"},{...event,state:"sick"},{...event,subjectType:"arbitrary"},{...event,occurredAt:"2026-02-31T00:00:00.000Z"}])
    await expect(siteMaterialAudit(tx,invalid as SiteMaterialEvent)).rejects.toBeInstanceOf(AuditError);
  expect(query).not.toHaveBeenCalled();
});
