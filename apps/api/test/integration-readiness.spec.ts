import {Connections, type ConnectionStore} from '../src/modules/integrations/application/connections';
import {emptyConnection,configuration,readiness,type Connection} from '../src/modules/integrations/domain/connections';
import {WinccReadOnlyAdapter,UltimoReadOnlyAdapter,EntraIdentityAdapter} from '../src/modules/integrations/adapters/providers/read-only';
const scope={organizationId:'org',siteId:'site',sourceId:'source'};
describe('integration readiness and replaceable providers',()=>{
  test('configured metadata never claims a successful provider connection',()=>{
    const record=emptyConnection('wincc');record.configuration={...record.configuration,enabled:true,endpoint:'https://example.invalid',contractVersion:'v1',credentialReference:'WINCC'};
    expect(readiness(record)).toMatchObject({status:'transport-pending',lastSuccessfulConnection:null});
    expect(readiness(record).missingInputs).toContain('Authorized real compatibility verification');
  });
  test('rejects embedded credentials and query secrets',()=>{
    const input=emptyConnection('wincc').configuration;
    for(const endpoint of ['https://user:secret@example.invalid','https://example.invalid?token=secret','http://example.invalid'])
      expect(()=>configuration({...input,endpoint})).toThrow('invalid_integration');
    expect(()=>configuration({...input,credentialReference:'secret with spaces'})).toThrow();
  });
  test('all unbound transports fail explicitly',async()=>{
    await expect(new WinccReadOnlyAdapter().read(scope)).rejects.toThrow('integration_unconfigured');
    await expect(new UltimoReadOnlyAdapter().read(scope)).rejects.toThrow('integration_unconfigured');
    await expect(new EntraIdentityAdapter().verify('opaque-token')).rejects.toThrow('integration_unconfigured');
  });
  test('WinCC preserves exact aggregate grain and rejects invalid calendar/counts',async()=>{
    const row={sourceRecordId:'line-1',reportingDate:'2026-10-14',equipmentCode:'Sensor_A',message:'Reported condition',frequency:2,alarmSeconds:60};
    const transport={read:jest.fn(async()=>[row])};
    expect(await new WinccReadOnlyAdapter(transport).read(scope)).toEqual([{...row,sourceWindow:'unknown',sourceKind:'aggregate'}]);
    row.reportingDate='2026-02-30';await expect(new WinccReadOnlyAdapter(transport).read(scope)).rejects.toThrow('invalid_integration');
    row.reportingDate='2026-10-14';row.frequency=Number.MAX_SAFE_INTEGER+1;await expect(new WinccReadOnlyAdapter(transport).read(scope)).rejects.toThrow();
  });
  test('Ultimo unknown vendor states remain unresolved and Entra rejects tenant/issuer mismatch',async()=>{
    const adapter=new UltimoReadOnlyAdapter({read:async()=>[{externalId:'WO-1',title:'Work',state:'vendor-unknown',equipmentCode:'A',outcome:''}]});
    expect((await adapter.read(scope))[0].state).toBe('unknown');
    const identity=new EntraIdentityAdapter({verify:async()=>({subject:'user',tenantId:'foreign',issuer:'issuer'})},'tenant','issuer');
    await expect(identity.verify('opaque-token')).rejects.toThrow('integration_denied');
  });
  test('registry revision conflicts preserve existing configuration',async()=>{
    let current:Connection|null=null;const revisions:Connection[]=[];
    const store:ConnectionStore={run:async(_actor,_write,work)=>work({get:async()=>current,save:async value=>{current=value;revisions.push(value);},history:async()=>revisions})};
    const app=new Connections(store,()=> '2026-10-14T12:00:00.000Z');
    await app.save('admin',{expectedRevision:0,configuration:emptyConnection('wincc').configuration});
    await expect(app.save('admin',{expectedRevision:0,configuration:emptyConnection('wincc').configuration})).rejects.toThrow('integration_conflict');
    expect(revisions).toHaveLength(1);
  });
});
